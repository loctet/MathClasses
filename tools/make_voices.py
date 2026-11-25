"""Record every Nursery sentence with Kokoro, for a plain static website.

1. node tools/collect-voices.js            (writes tools/voice-texts.json)
2. <python with kokoro-onnx> tools/make_voices.py

Writes audio/nursery/<id>.mp3 and audio/nursery/manifest.json ({sentence: file}).
Sentences already recorded are skipped, so it is quick to run again after changing lessons.
Files that are no longer used are deleted.

Optional environment variables:
    KOKORO_MODEL   (default ~/.cache/hyperframes/tts/models/kokoro-v1.0.onnx)
    KOKORO_VOICES  (default ~/.cache/hyperframes/tts/voices/voices-v1.0.bin)
    KOKORO_VOICE   (default af_heart)
    KOKORO_SPEED   (default 0.85 — a little slow for young children)
    FFMPEG         (default: ffmpeg on PATH)
"""
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "audio" / "nursery"
HOME = Path.home()
MODEL = os.environ.get("KOKORO_MODEL", str(HOME / ".cache/hyperframes/tts/models/kokoro-v1.0.onnx"))
VOICES = os.environ.get("KOKORO_VOICES", str(HOME / ".cache/hyperframes/tts/voices/voices-v1.0.bin"))
VOICE = os.environ.get("KOKORO_VOICE", "af_heart")
SPEED = float(os.environ.get("KOKORO_SPEED", "0.85"))
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg")


def file_id(text: str) -> str:
    return hashlib.sha1(f"{VOICE}|{SPEED}|{text}".encode("utf-8")).hexdigest()[:14] + ".mp3"


def main():
    texts = json.loads((ROOT / "tools" / "voice-texts.json").read_text(encoding="utf-8"))
    if not FFMPEG:
        sys.exit("ffmpeg not found: install it or set FFMPEG=path/to/ffmpeg")
    from kokoro_onnx import Kokoro
    import soundfile as sf

    OUT.mkdir(parents=True, exist_ok=True)
    kokoro = Kokoro(MODEL, VOICES)
    manifest, made, start = {}, 0, time.time()
    for i, text in enumerate(texts, 1):
        name = file_id(text)
        manifest[text] = name
        target = OUT / name
        if target.exists():
            continue
        samples, rate = kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        with tempfile.TemporaryDirectory() as tmp:
            wav = Path(tmp) / "a.wav"
            sf.write(wav, samples, rate)
            subprocess.run([FFMPEG, "-v", "error", "-y", "-i", str(wav), "-ac", "1", "-b:a", "48k", str(target)], check=True)
        made += 1
        if made % 10 == 0:
            print(f"[{i}/{len(texts)}] {made} made, {time.time() - start:.0f}s", flush=True)
    keep = set(manifest.values())
    removed = 0
    for f in OUT.glob("*.mp3"):
        if f.name not in keep:
            f.unlink()
            removed += 1
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding="utf-8")
    size = sum(f.stat().st_size for f in OUT.glob("*.mp3"))
    print(f"Done: {len(texts)} sentences ({made} new, {removed} removed), {size / 1e6:.1f} MB in audio/nursery/")


if __name__ == "__main__":
    main()
