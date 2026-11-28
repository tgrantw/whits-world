#!/usr/bin/env python3
"""
Generate warm, studio-quality neural human voice sprites for Whit's World
using Microsoft Edge Neural TTS (en-US-AvaNeural) + ffmpeg.

Outputs:
  - public/audio/voice-core.mp3
  - public/audio/voice-colors.mp3
  - public/audio/voice-numbers.mp3
  - public/audio/voice-letters.mp3
  - src/services/voiceManifest.ts

Run:
  python3 scripts/generate-voice-sprites.py
"""

import asyncio
import hashlib
import json
import os
import re
import subprocess
import wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
AUDIO_OUT_DIR = ROOT / "public" / "audio"
MANIFEST_OUT = ROOT / "src" / "services" / "voiceManifest.ts"
CACHE_DIR = Path("/tmp/whits_world_voice_cache_ava_v1")

VOICE = "en-US-AvaNeural"
RATE = "-5%"
PITCH = "+2Hz"
SAMPLE_RATE = 24000
GAP_MS = 160  # Pure silence gap between clips so MP3 frames never bleed
PRE_PAD_MS = 25
POST_PAD_MS = 55


def normalize_key(text: str) -> str:
    """Normalize a spoken phrase to a deterministic lookup key."""
    s = text.lower().strip()
    s = s.replace("\u2019", "'")
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# Map single letters to unambiguous spoken prompts when spoken standalone
LETTER_STANDALONE_SPEECH = {
    "A": "The letter A!",
    "B": "B!",
    "C": "C!",
    "D": "D!",
    "E": "E!",
    "F": "F!",
    "G": "G!",
    "H": "H!",
    "I": "The letter I!",
    "J": "J!",
    "K": "K!",
    "L": "L!",
    "M": "M!",
    "N": "N!",
    "O": "Oh!",
    "P": "P!",
    "Q": "Q!",
    "R": "R!",
    "S": "S!",
    "T": "T!",
    "U": "The letter U!",
    "V": "V!",
    "W": "W!",
    "X": "X!",
    "Y": "Y!",
    "Z": "Z!",
}

ALPHABET = [
    ("A", "Apple"),
    ("B", "Banana"),
    ("C", "Cow"),
    ("D", "Duck"),
    ("E", "Elephant"),
    ("F", "Frog"),
    ("G", "Giraffe"),
    ("H", "Hippo"),
    ("I", "Ice Cream"),
    ("J", "Jellyfish"),
    ("K", "Kite"),
    ("L", "Lion"),
    ("M", "Monkey"),
    ("N", "Nest"),
    ("O", "Octopus"),
    ("P", "Panda"),
    ("Q", "Queen Crown"),
    ("R", "Rainbow"),
    ("S", "Sheep"),
    ("T", "Tiger"),
    ("U", "Umbrella"),
    ("V", "Vine"),
    ("W", "Whale"),
    ("X", "Xylophone"),
    ("Y", "Yo-Yo"),
    ("Z", "Zebra"),
]

COLORS = ["Red", "Blue", "Yellow", "Green", "Orange", "Purple", "Pink", "Brown"]

COLOR_MATCH_CELEBS = [
    ("Red! Red Apple!", "Red! Red apple!"),
    ("Blue! Blue Whale!", "Blue! Blue whale!"),
    ("Green! Green Frog!", "Green! Green frog!"),
    ("Yellow! Yellow Sun!", "Yellow! Yellow sun!"),
    ("Orange! Juicy Orange!", "Orange! Juicy orange!"),
    ("Purple! Purple Grapes!", "Purple! Purple grapes!"),
    ("Pink! Pink Flower!", "Pink! Pink flower!"),
    ("Brown! Brown Bear!", "Brown! Brown bear!"),
]

NUMBER_WORDS = [
    (1, "One"),
    (2, "Two"),
    (3, "Three"),
    (4, "Four"),
    (5, "Five"),
    (6, "Six"),
    (7, "Seven"),
    (8, "Eight"),
    (9, "Nine"),
    (10, "Ten"),
]

ANIMALS = [
    "Monkey",
    "Toucan",
    "Gorilla",
    "Frog",
    "Whale",
    "Turtle",
    "Octopus",
    "Clownfish",
    "Giraffe",
    "Zebra",
    "Elephant",
    "Lion",
    "Panda",
    "Flamingo",
    "Hippo",
    "Tiger",
    "Penguin",
    "Seal",
    "Polar Bear",
    "Puffin",
    "Cow",
    "Sheep",
    "Duck",
    "Pig",
]

COUNT_PLURALS = [
    "Monkeys",
    "Elephants",
    "Penguins",
    "Lions",
    "Frogs",
    "Turtles",
    "Ducks",
    "Pandas",
]

COLORING_TITLES = [
    "Sunny Lion",
    "Happy Elephant",
    "Splashy Whale",
    "Little Penguin",
    "Tall Giraffe",
    "Whit the Gorilla",
    "Playful Monkey",
    "Bouncy Frog",
    "Sweet Panda",
    "Rainbow Turtle",
]

TOOLS_AND_STICKERS = [
    "Fill",
    "Draw",
    "Stickers",
    "Star",
    "Heart",
    "Flower",
    "Butterfly",
    "Rainbow",
    "Sun",
    "Crown",
    "Paw",
    "White",
    "Saved!",
    "Picture saved!",
]

WHIT_HATS = [
    "Natural Whit",
    "Jungle Flower",
    "Safari Sun Hat",
    "Party Hat",
    "Golden Crown",
    "Star Shades",
    "Polka Bowtie",
    "Nose Butterfly",
    "Captain Hat",
    "Rainbow Crown",
    "Chef Hat",
    "Wizard Hat",
    "Explorer Medal",
]

PICNIC_PHRASES = [
    "Watermelon",
    "Bamboo",
    "Berries",
    "Fish Treat",
    "Star Cupcake",
    "Yum! Banana!",
    "Yum! Watermelon!",
    "Yum! Bamboo!",
    "Yum! Berries!",
    "Yum! Fish Treat!",
    "Yum! Star Cupcake!",
]

PARADE_SIZE_PHRASES = [
    "Tiny Frog!",
    "Small Toucan!",
    "Medium Monkey!",
    "Big Elephant!",
    "Tiny Puffin!",
    "Small Penguin!",
    "Medium Seal!",
    "Big Polar Bear!",
    "Tiny Duck!",
    "Small Pig!",
    "Medium Sheep!",
    "Big Cow!",
    "Tiny Clownfish!",
    "Small Panda!",
    "Medium Zebra!",
    "Big Giraffe!",
    "Medium Lion!",
    "Big Hippo!",
]

NURSERY_ANIMALS = [
    "Elephant",
    "Giraffe",
    "Monkey",
    "Lion",
    "Panda",
    "Whale",
    "Hippo",
    "Tiger",
    "Zebra",
    "Turtle",
    "Gorilla",
    "Flamingo",
]

BUBBLE_AND_ACTION_PHRASES = [
    "Pop the bubbles!",
    "Pop the Whale bubbles!",
    "Pop the Turtle bubbles!",
    "Pop the Octopus bubbles!",
    "Pop the Clownfish bubbles!",
    "Pop the Frog bubbles!",
    "Rainbow bubble!",
    "Golden star!",
    "Peek-a-boo!",
    "Goal!",
    "Golden Fish!",
    "Brrr!",
    "Twinkle Twinkle!",
    "Row Your Boat!",
    "Little Lamb!",
    "Free Jam!",
    "Whit",
    "Hi friend!",
    "Let's play!",
    "Amazing job!",
    "You earned a star!",
    "New hat unlocked!",
    "New friend found!",
    "Zoo Playground!",
    "Sunny Clearing!",
    "Snowy Arctic!",
    "Coral Reef!",
    "Sunny Farm!",
    "Dance party!",
    "Zoo photo saved!",
    "Rainbow paint!",
    "Jungle Ball!",
    "Party Balloon!",
    "Gold Star!",
    "Sunshine!",
    "Awesome tracing!",
    "Follow the star!",
]


def build_sprite_specs() -> dict[str, list[tuple[str, str]]]:
    """
    Returns sprite_id -> list of (lookup_key_source, spoken_tts_text).
    """
    sprites: dict[str, list[tuple[str, str]]] = {
        "core": [],
        "colors": [],
        "numbers": [],
        "letters": [],
    }

    # --- CORE: animals, colors, numbers, coloring pages/tools/stickers, hats, games, UI ---
    for c in COLORS:
        sprites["core"].append((c, f"{c}!"))
    for _, w in NUMBER_WORDS:
        sprites["core"].append((w, f"{w}!"))
    for a in ANIMALS:
        sprites["core"].append((a, f"{a}!"))
    for t in COLORING_TITLES:
        sprites["core"].append((t, f"{t}!"))
    for item in TOOLS_AND_STICKERS:
        sprites["core"].append((item, item if item.endswith("!") else f"{item}!"))
    for hat in WHIT_HATS:
        sprites["core"].append((hat, f"{hat}!"))
    for pp in PICNIC_PHRASES:
        sprites["core"].append((pp, pp if pp.endswith("!") else f"{pp}!"))
    for sp in PARADE_SIZE_PHRASES:
        sprites["core"].append((sp, sp))
    for na in NURSERY_ANIMALS:
        sprites["core"].append((f"Baby {na}!", f"Baby {na}!"))
        sprites["core"].append((f"Mama and Baby {na}!", f"Mama and Baby {na}!"))
    for bp in BUBBLE_AND_ACTION_PHRASES:
        sprites["core"].append((bp, bp if bp.endswith("!") else f"{bp}!"))
    sprites["core"].extend([
        ("Great job!", "Great job!"),
        ("Yes!", "Yes!"),
        ("Try again!", "Try again!"),
        ("ABC Sound Board!", "A, B, C Sound Board!"),
    ])

    # --- COLORS: Color Safari & Color Match sentences ---
    for c in COLORS:
        sprites["colors"].append((f"Find {c}!", f"Find {c}!"))
        sprites["colors"].append((f"Yes! {c}!", f"Yes! {c}!"))
        sprites["colors"].append((f"That's {c}!", f"That's {c}!"))
        sprites["colors"].append((f"Match {c}!", f"Match {c}!"))
    for key_src, spoken in COLOR_MATCH_CELEBS:
        sprites["colors"].append((key_src, spoken))

    # --- NUMBERS: Counting Zoo, Number Match & Trace Trail 1-10 ---
    for pl in COUNT_PLURALS:
        sprites["numbers"].append((pl, f"{pl}!"))
        sprites["numbers"].append((f"How many {pl}?", f"How many {pl}?"))
    for n, w in NUMBER_WORDS:
        sprites["numbers"].append((f"Tap number {n}!", f"Tap number {w}!"))
        sprites["numbers"].append((f"That's {w}!", f"That's {w}!"))
        sprites["numbers"].append((f"Trace {n}!", f"Trace number {w}!"))
        if n <= 8:
            sprites["numbers"].append((f"Match {w}!", f"Match {w}!"))
    sprites["numbers"].append(("Tap the animals to count!", "Tap the animals to count!"))

    # --- LETTERS: ABC Safari, Letter Match & Trace Trail A-Z ---
    seen_core = {normalize_key(k) for k, _ in sprites["core"]}
    for letter, word in ALPHABET:
        sprites["letters"].append((letter, LETTER_STANDALONE_SPEECH[letter]))
        sprites["letters"].append((f"Find {letter}!", f"Find the letter {letter}!"))
        sprites["letters"].append((f"That's {letter}!", f"That's the letter {letter}!"))
        sprites["letters"].append((f"Match {letter}!", f"Match the letter {letter}!"))
        sprites["letters"].append((f"Trace {letter}!", f"Trace the letter {letter}!"))
        sprites["letters"].append((f"{letter} is for {word}!", f"{letter}, is for {word}!"))
        if normalize_key(word) not in seen_core:
            sprites["letters"].append((word, f"{word}!"))

    # Deduplicate across sprites preserving first occurrence
    global_seen: set[str] = set()
    deduped: dict[str, list[tuple[str, str]]] = {}
    for sid, items in sprites.items():
        out = []
        for k_src, spoken in items:
            nk = normalize_key(k_src)
            if nk in global_seen:
                continue
            global_seen.add(nk)
            out.append((nk, spoken))
        deduped[sid] = out
    return deduped


async def synthesize_clip(
    sem: asyncio.Semaphore, key: str, spoken: str
) -> tuple[str, Path]:
    h = hashlib.sha1(f"{VOICE}|{RATE}|{PITCH}|{spoken}".encode("utf-8")).hexdigest()[:16]
    mp3_path = CACHE_DIR / f"{h}.mp3"
    wav_path = CACHE_DIR / f"{h}.wav"

    if not wav_path.exists():
        async with sem:
            if not mp3_path.exists():
                for attempt in range(4):
                    try:
                        comm = edge_tts.Communicate(
                            spoken, VOICE, rate=RATE, pitch=PITCH
                        )
                        await comm.save(str(mp3_path))
                        break
                    except Exception as exc:
                        if attempt == 3:
                            raise RuntimeError(f"Failed TTS for {spoken!r}: {exc}") from exc
                        await asyncio.sleep(0.8 * (attempt + 1))

            # Trim leading/trailing silence, normalize cleanly, convert to 24kHz mono 16-bit PCM WAV
            af = (
                "highpass=f=75,"
                "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-42dB:detection=peak,"
                "areverse,"
                "silenceremove=start_periods=1:start_duration=0.01:start_threshold=-42dB:detection=peak,"
                "areverse,"
                "loudnorm=I=-16:TP=-1.5:LRA=9"
            )
            res = subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-v",
                    "error",
                    "-i",
                    str(mp3_path),
                    "-af",
                    af,
                    "-ar",
                    str(SAMPLE_RATE),
                    "-ac",
                    "1",
                    "-c:a",
                    "pcm_s16le",
                    str(wav_path),
                ],
                capture_output=True,
                text=True,
            )
            if res.returncode != 0 or not wav_path.exists() or wav_path.stat().st_size < 100:
                # Fallback without silenceremove if a super short clip was over-trimmed
                subprocess.run(
                    [
                        "ffmpeg",
                        "-y",
                        "-v",
                        "error",
                        "-i",
                        str(mp3_path),
                        "-ar",
                        str(SAMPLE_RATE),
                        "-ac",
                        "1",
                        "-c:a",
                        "pcm_s16le",
                        str(wav_path),
                    ],
                    check=True,
                )

    return key, wav_path


def read_wav_frames(wav_path: Path) -> bytes:
    with wave.open(str(wav_path), "rb") as wf:
        assert wf.getnchannels() == 1
        assert wf.getsampwidth() == 2
        assert wf.getframerate() == SAMPLE_RATE
        return wf.readframes(wf.getnframes())


def assemble_sprite(
    sprite_id: str, entries: list[tuple[str, Path]]
) -> tuple[Path, dict[str, tuple[float, float]]]:
    bytes_per_sec = SAMPLE_RATE * 2
    gap_bytes = int((GAP_MS / 1000.0) * SAMPLE_RATE) * 2
    pre_pad_bytes = int((PRE_PAD_MS / 1000.0) * SAMPLE_RATE) * 2
    post_pad_bytes = int((POST_PAD_MS / 1000.0) * SAMPLE_RATE) * 2

    chunks: list[bytes] = [b"\x00" * gap_bytes]
    cursor_bytes = gap_bytes
    timings: dict[str, tuple[float, float]] = {}

    for key, wav_path in entries:
        pcm = read_wav_frames(wav_path)
        start_sec = (cursor_bytes - pre_pad_bytes) / bytes_per_sec
        dur_sec = (len(pcm) + pre_pad_bytes + post_pad_bytes) / bytes_per_sec
        timings[key] = (round(start_sec, 3), round(dur_sec, 3))
        chunks.append(pcm)
        chunks.append(b"\x00" * gap_bytes)
        cursor_bytes += len(pcm) + gap_bytes

    combined_wav = CACHE_DIR / f"sprite_{sprite_id}.wav"
    with wave.open(str(combined_wav), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(b"".join(chunks))

    out_mp3 = AUDIO_OUT_DIR / f"voice-{sprite_id}.mp3"
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(combined_wav),
            "-ar",
            str(SAMPLE_RATE),
            "-ac",
            "1",
            "-b:a",
            "40k",
            "-c:a",
            "libmp3lame",
            str(out_mp3),
        ],
        check=True,
    )

    # Measure MP3 encoder start_time so timestamps match decoded AudioBuffer sample-for-sample
    probe = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration,start_time",
            "-of",
            "json",
            str(out_mp3),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    info = json.loads(probe.stdout)["format"]
    start_offset = float(info.get("start_time", 0.0) or 0.0)
    # Note: Web Audio decodeAudioData strips LAME Xing/Info encoder delay in modern browsers,
    # and our 25ms pre-pad + 55ms post-pad inside the 160ms silence gap absorbs any +/-23ms delta.
    size_kb = out_mp3.stat().st_size / 1024.0
    print(
        f"  Built voice-{sprite_id}.mp3: {len(entries)} clips, "
        f"{float(info['duration']):.1f}s, {size_kb:.1f} KB (start_time={start_offset:.4f}s)"
    )
    return out_mp3, timings


async def main() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    AUDIO_OUT_DIR.mkdir(parents=True, exist_ok=True)

    specs = build_sprite_specs()
    total = sum(len(v) for v in specs.values())
    print(f"Synthesizing {total} warm neural clips with {VOICE}...")

    sem = asyncio.Semaphore(8)
    manifest: dict[str, tuple[str, float, float]] = {}

    for sprite_id, items in specs.items():
        tasks = [synthesize_clip(sem, k, spoken) for k, spoken in items]
        results = await asyncio.gather(*tasks)
        _, timings = assemble_sprite(sprite_id, results)
        for key, (start, dur) in timings.items():
            manifest[key] = (sprite_id, start, dur)

    # Emit compact TypeScript manifest
    lines = [
        "/*",
        " * Auto-generated by scripts/generate-voice-sprites.py",
        f" * Voice: {VOICE} (rate={RATE}, pitch={PITCH})",
        " * Each entry maps a normalized spoken phrase -> [spriteId, startSec, durationSec].",
        " */",
        "",
        "export type VoiceSpriteId = 'core' | 'colors' | 'numbers' | 'letters';",
        "",
        "export const VOICE_SPRITE_URLS: Record<VoiceSpriteId, string> = {",
        "  core: './audio/voice-core.mp3',",
        "  colors: './audio/voice-colors.mp3',",
        "  numbers: './audio/voice-numbers.mp3',",
        "  letters: './audio/voice-letters.mp3',",
        "};",
        "",
        "export type VoiceClipRef = readonly [sprite: VoiceSpriteId, start: number, duration: number];",
        "",
        "export const VOICE_CLIPS: Record<string, VoiceClipRef> = {",
    ]
    for key in sorted(manifest.keys()):
        sid, start, dur = manifest[key]
        lines.append(f"  {json.dumps(key)}: ['{sid}', {start}, {dur}],")
    lines.append("};")
    lines.append("")

    MANIFEST_OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {MANIFEST_OUT} with {len(manifest)} phrases!")


if __name__ == "__main__":
    asyncio.run(main())
