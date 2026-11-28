import { Platform } from 'react-native';
import {
  VOICE_CLIPS,
  VOICE_SPRITE_URLS,
  VoiceClipRef,
  VoiceSpriteId,
} from './voiceManifest';

/**
 * Pure Web Audio API sound & warm neural voice engine for Whit's World.
 * - Studio-quality neural voice sprites (en-US-AvaNeural) decoded into Web Audio
 *   AudioBuffers for instant 0ms, natural human speech across all 17 games.
 * - Gentle, warm marimba/xylophone tones designed specifically for 3-year-olds.
 * - No harsh buzzers or error sounds.
 * - Automatic natural-voice Web Speech API fallback if an unrecorded phrase is spoken.
 */

type AudioCtx = AudioContext;

const DIGIT_TO_WORD: Record<string, string> = {
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
  '10': 'ten',
};

function normalizeSpeechKey(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\u2019/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface ScheduledClip {
  ref: VoiceClipRef;
  gapAfter: number;
}

/**
 * Resolves any spoken game prompt into one or more studio neural voice clips.
 * Returns null only if a phrase cannot be fully satisfied by our bundled sprites.
 */
function resolveVoiceClips(phrase: string): ScheduledClip[] | null {
  const fullKey = normalizeSpeechKey(phrase);
  if (!fullKey) return null;

  const exact = VOICE_CLIPS[fullKey];
  if (exact) {
    return [{ ref: exact, gapAfter: 0 }];
  }

  // Split multi-sentence prompts (e.g. "That's Blue! Find Red!" or "Three! 3 Monkeys!")
  const rawParts = phrase
    .split(/[.!?]+/)
    .map((p) => normalizeSpeechKey(p))
    .filter(Boolean);

  if (rawParts.length === 0) return null;

  const clips: ScheduledClip[] = [];

  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    const isLastPart = i === rawParts.length - 1;
    const sentenceGap = isLastPart ? 0 : 0.085;

    // Direct match for this sentence
    const direct = VOICE_CLIPS[part];
    if (direct) {
      clips.push({ ref: direct, gapAfter: sentenceGap });
      continue;
    }

    // Standalone digit -> number word ("3" -> "three")
    if (DIGIT_TO_WORD[part] && VOICE_CLIPS[DIGIT_TO_WORD[part]]) {
      clips.push({ ref: VOICE_CLIPS[DIGIT_TO_WORD[part]], gapAfter: sentenceGap });
      continue;
    }

    // "match 3" -> "match three"
    const matchNum = part.match(/^match (\d+)$/);
    if (matchNum) {
      const w = DIGIT_TO_WORD[matchNum[1]];
      if (w && VOICE_CLIPS[`match ${w}`]) {
        clips.push({ ref: VOICE_CLIPS[`match ${w}`], gapAfter: sentenceGap });
        continue;
      }
    }

    // "<count> <animal>" e.g. "3 monkeys" or "1 lion"
    const countNoun = part.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)$/);
    if (countNoun) {
      const numWord = DIGIT_TO_WORD[countNoun[1]] || countNoun[1];
      const nounKey = countNoun[2];
      const numClip = VOICE_CLIPS[numWord];
      const nounClip = VOICE_CLIPS[nounKey];
      if (numClip && nounClip) {
        clips.push({ ref: numClip, gapAfter: 0.025 });
        clips.push({ ref: nounClip, gapAfter: sentenceGap });
        continue;
      }
    }

    // Unknown segment -> fall back cleanly
    return null;
  }

  return clips.length > 0 ? clips : null;
}

class SoundEngine {
  private ctx: AudioCtx | null = null;
  private muted = false;
  private spriteBytes = new Map<VoiceSpriteId, Promise<ArrayBuffer | null>>();
  private spriteBuffers = new Map<VoiceSpriteId, AudioBuffer>();
  private spriteDecoding = new Map<VoiceSpriteId, Promise<AudioBuffer | null>>();
  private activeVoiceNodes: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  private speechToken = 0;

  constructor() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('whits_world_muted');
        if (saved === 'true') {
          this.muted = true;
        }
      } catch {
        // Ignore storage errors in private browsing
      }
      // Quietly prefetch compressed voice sprite bytes into RAM (no gesture needed)
      this.prefetchAllSprites();
    }
  }

  private prefetchAllSprites(): void {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof fetch !== 'function') {
      return;
    }
    const order: VoiceSpriteId[] = ['core', 'colors', 'numbers', 'letters'];
    order.forEach((id) => {
      this.fetchSpriteBytes(id);
    });
  }

  private fetchSpriteBytes(id: VoiceSpriteId): Promise<ArrayBuffer | null> {
    const existing = this.spriteBytes.get(id);
    if (existing) return existing;

    const url = VOICE_SPRITE_URLS[id];
    const req = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    this.spriteBytes.set(id, req);
    return req;
  }

  private async getSpriteBuffer(id: VoiceSpriteId, ctx: AudioCtx): Promise<AudioBuffer | null> {
    const cached = this.spriteBuffers.get(id);
    if (cached) return cached;

    const inFlight = this.spriteDecoding.get(id);
    if (inFlight) return inFlight;

    const decodePromise = (async () => {
      const raw = await this.fetchSpriteBytes(id);
      if (!raw) return null;
      try {
        // Always copy the ArrayBuffer because decodeAudioData detaches its input
        const buf = await ctx.decodeAudioData(raw.slice(0));
        this.spriteBuffers.set(id, buf);
        return buf;
      } catch {
        return null;
      } finally {
        this.spriteDecoding.delete(id);
      }
    })();

    this.spriteDecoding.set(id, decodePromise);
    return decodePromise;
  }

  private stopActiveVoice(): void {
    const ctx = this.ctx;
    const now = ctx ? ctx.currentTime : 0;
    for (const item of this.activeVoiceNodes) {
      try {
        if (ctx) {
          item.gain.gain.cancelScheduledValues(now);
          item.gain.gain.setValueAtTime(Math.max(0.0001, item.gain.gain.value), now);
          item.gain.gain.linearRampToValueAtTime(0.0001, now + 0.015);
          item.source.stop(now + 0.02);
        } else {
          item.source.stop();
        }
      } catch {
        // Ignore already-stopped AudioBufferSourceNodes
      }
    }
    this.activeVoiceNodes = [];

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) {
      this.speechToken += 1;
      this.stopActiveVoice();
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('whits_world_muted', String(muted));
      } catch {
        // Ignore storage errors
      }
    }
  }

  private getContext(): AudioCtx | null {
    if (this.muted || Platform.OS !== 'web' || typeof window === 'undefined') {
      return null;
    }
    if (!this.ctx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        return null;
      }
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Call on first user touch/tap to unlock iOS/Android Web Audio cleanly
   * and warm up all 4 neural voice sprites for instant 0ms playback.
   */
  public unlock(): void {
    const ctx = this.getContext();
    if (ctx) {
      const ids: VoiceSpriteId[] = ['core', 'colors', 'numbers', 'letters'];
      ids.forEach((id) => {
        void this.getSpriteBuffer(id, ctx);
      });
    }
  }

  private playTone(
    freq: number,
    startOffset: number,
    duration: number,
    volume = 0.16,
    type: OscillatorType = 'sine',
    slideToFreq?: number
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + startOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideToFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(slideToFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  /** Soft bubbly marimba pop when picking up or tapping a piece */
  public playPop(): void {
    this.playTone(440, 0, 0.11, 0.14, 'sine', 620);
  }

  /** Light wooden tap for buttons and Peek-a-Boo card flips */
  public playCardFlip(): void {
    this.playTone(360, 0, 0.08, 0.12, 'triangle', 520);
  }

  /** Cheerful rising 2-note chime when a piece snaps into place */
  public playSnap(): void {
    this.playTone(523.25, 0, 0.14, 0.16, 'triangle'); // C5
    this.playTone(659.25, 0.08, 0.22, 0.18, 'sine'); // E5
    this.playTone(1046.5, 0.08, 0.18, 0.06, 'sine'); // C6 shimmer
  }

  /** Bright triad sparkle when matching a pair */
  public playMatch(): void {
    this.playTone(523.25, 0, 0.14, 0.15, 'triangle'); // C5
    this.playTone(659.25, 0.08, 0.14, 0.15, 'triangle'); // E5
    this.playTone(783.99, 0.16, 0.28, 0.17, 'sine'); // G5
  }

  /** Gentle soft wooden bounce when a piece returns (never harsh!) */
  public playGentleBounce(): void {
    this.playTone(310, 0, 0.14, 0.11, 'sine', 245);
    this.playTone(260, 0.09, 0.12, 0.08, 'sine', 290);
  }

  /** Playful gorilla giggle / happy bounce when tapping Whit */
  public playGorillaGiggle(): void {
    this.playTone(392, 0, 0.09, 0.13, 'triangle', 494);
    this.playTone(494, 0.09, 0.09, 0.13, 'triangle', 587);
    this.playTone(587, 0.18, 0.16, 0.15, 'sine', 659);
  }

  /** Sparkling underwater bubble pop with rising pitch */
  public playBubblePop(step = 0): void {
    const base = 420 + Math.min(step, 8) * 55;
    this.playTone(base, 0, 0.11, 0.16, 'sine', base * 1.9);
    this.playTone(base * 2.1, 0.04, 0.14, 0.07, 'triangle');
  }

  /** Warm resonant wooden jungle xylophone / marimba note */
  public playNote(freq: number): void {
    this.playTone(freq, 0, 0.34, 0.18, 'triangle');
    this.playTone(freq * 2, 0, 0.18, 0.06, 'sine');
    this.playTone(freq * 3, 0, 0.09, 0.025, 'sine');
  }

  /** Soft bouncy soccer kick thump + cheerful whoosh */
  public playKick(): void {
    this.playTone(190, 0, 0.12, 0.2, 'sine', 95);
    this.playTone(340, 0.02, 0.14, 0.1, 'triangle', 540);
  }

  /** Joyful uplifting soccer goal fanfare chord */
  public playGoalCheer(): void {
    this.playTone(523.25, 0, 0.13, 0.16, 'triangle'); // C5
    this.playTone(659.25, 0.07, 0.15, 0.16, 'triangle'); // E5
    this.playTone(783.99, 0.14, 0.18, 0.17, 'sine'); // G5
    this.playTone(1046.5, 0.21, 0.34, 0.18, 'sine'); // C6
    this.playTone(1318.5, 0.25, 0.28, 0.08, 'triangle'); // E6 sparkle
  }

  /** Playful rubbery mushroom bumper boing */
  public playBoing(): void {
    this.playTone(230, 0, 0.14, 0.17, 'sine', 490);
    this.playTone(490, 0.09, 0.16, 0.14, 'triangle', 320);
    this.playTone(340, 0.18, 0.14, 0.1, 'sine', 440);
  }

  /** Sparkling golden chime when rolling through a star */
  public playStarCollect(step = 0): void {
    const base = 660 + Math.min(step, 5) * 90;
    this.playTone(base, 0, 0.14, 0.15, 'triangle');
    this.playTone(base * 1.5, 0.05, 0.18, 0.09, 'sine');
  }

  /** Playful sparkling arctic water splash + rising catch chime */
  public playWaterSplash(step = 0): void {
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const note = pentatonic[step % pentatonic.length];
    this.playTone(320, 0, 0.09, 0.13, 'sine', 640);
    this.playTone(note, 0.04, 0.18, 0.16, 'triangle');
    this.playTone(note * 1.5, 0.09, 0.16, 0.08, 'sine');
  }

  /** Playful, warm musical signature tailored to each zoo & aquarium animal */
  public playAnimalSound(animal: string): void {
    switch (animal) {
      case 'monkey':
        // Playful rising ooh-ooh-aah chatter
        this.playTone(460, 0, 0.09, 0.14, 'triangle', 640);
        this.playTone(540, 0.1, 0.09, 0.14, 'triangle', 740);
        this.playTone(680, 0.2, 0.14, 0.15, 'sine', 880);
        break;
      case 'toucan':
        // Bright tropical toucan chirp-trill
        this.playTone(760, 0, 0.09, 0.14, 'sine', 1120);
        this.playTone(980, 0.1, 0.14, 0.14, 'triangle', 780);
        break;
      case 'gorilla':
        this.playGorillaGiggle();
        break;
      case 'frog':
        // Bouncy friendly ribbit slide
        this.playTone(220, 0, 0.1, 0.16, 'triangle', 460);
        this.playTone(250, 0.13, 0.12, 0.15, 'sine', 520);
        break;
      case 'whale':
        // Gentle melodic underwater whale call
        this.playTone(220, 0, 0.26, 0.15, 'sine', 340);
        this.playTone(340, 0.22, 0.24, 0.12, 'sine', 260);
        break;
      case 'turtle':
      case 'clownfish':
        // Bubbly aquatic sparkle bloop
        this.playTone(480, 0, 0.1, 0.14, 'sine', 820);
        this.playTone(660, 0.09, 0.12, 0.12, 'sine', 1040);
        break;
      case 'octopus':
        // Squishy playful ascending plucks
        this.playTone(360, 0, 0.08, 0.13, 'triangle', 500);
        this.playTone(480, 0.08, 0.08, 0.13, 'triangle', 640);
        this.playTone(620, 0.16, 0.12, 0.13, 'sine', 780);
        break;
      case 'elephant':
        // Cheerful rising baby-elephant trumpet chime
        this.playTone(340, 0, 0.14, 0.16, 'triangle', 680);
        this.playTone(680, 0.12, 0.2, 0.14, 'sine', 840);
        break;
      case 'lion':
      case 'tiger':
        // Warm friendly playful low purr-bounce
        this.playTone(210, 0, 0.16, 0.16, 'triangle', 165);
        this.playTone(260, 0.12, 0.18, 0.14, 'sine', 220);
        break;
      case 'giraffe':
      case 'flamingo':
        // Graceful airy harp/flute notes
        this.playTone(587.33, 0, 0.12, 0.13, 'sine');
        this.playTone(783.99, 0.09, 0.12, 0.13, 'sine');
        this.playTone(987.77, 0.18, 0.2, 0.13, 'triangle');
        break;
      case 'zebra':
        // Jaunty clip-clop woodblock trot
        this.playTone(420, 0, 0.06, 0.14, 'triangle', 340);
        this.playTone(520, 0.08, 0.06, 0.14, 'triangle', 420);
        this.playTone(640, 0.16, 0.1, 0.13, 'sine');
        break;
      case 'panda':
        // Soft bamboo flute fifth
        this.playTone(440, 0, 0.15, 0.13, 'sine');
        this.playTone(659.25, 0.12, 0.22, 0.14, 'sine');
        break;
      case 'hippo':
        // Cheerful deep bubbly splash bounce
        this.playTone(175, 0, 0.14, 0.16, 'sine', 260);
        this.playTone(240, 0.12, 0.14, 0.14, 'triangle', 320);
        break;
      // Snowy Arctic friends
      case 'penguin':
        // Cheerful quick waddle-chirp honk-honk!
        this.playTone(540, 0, 0.08, 0.15, 'triangle', 680);
        this.playTone(620, 0.1, 0.1, 0.15, 'triangle', 480);
        break;
      case 'polarbear':
        // Warm cozy low bear hum-hug
        this.playTone(185, 0, 0.18, 0.16, 'sine', 235);
        this.playTone(235, 0.15, 0.2, 0.14, 'triangle', 175);
        break;
      case 'seal':
        // Bouncy playful arf-arf-arf!
        this.playTone(360, 0, 0.08, 0.15, 'triangle', 520);
        this.playTone(400, 0.11, 0.08, 0.15, 'triangle', 580);
        this.playTone(440, 0.22, 0.11, 0.14, 'sine', 640);
        break;
      case 'puffin':
        // Bright seaside bird whistle-trill
        this.playTone(720, 0, 0.09, 0.13, 'sine', 960);
        this.playTone(860, 0.09, 0.13, 0.14, 'triangle', 1140);
        break;
      // Sunny Farm friends
      case 'cow':
        // Friendly warm musical moo slide
        this.playTone(195, 0, 0.24, 0.16, 'triangle', 250);
        this.playTone(250, 0.2, 0.24, 0.14, 'sine', 180);
        break;
      case 'pig':
        // Silly snorty double oink-oink!
        this.playTone(290, 0, 0.08, 0.15, 'triangle', 390);
        this.playTone(320, 0.11, 0.09, 0.15, 'triangle', 440);
        break;
      case 'duck':
        // Bright bouncy quack-quack!
        this.playTone(580, 0, 0.08, 0.15, 'triangle', 420);
        this.playTone(620, 0.11, 0.09, 0.15, 'triangle', 440);
        break;
      case 'sheep':
        // Gentle melodic baa-baa vibrato
        this.playTone(390, 0, 0.14, 0.14, 'sine', 450);
        this.playTone(440, 0.12, 0.18, 0.14, 'triangle', 370);
        break;
      default:
        this.playPop();
    }
  }

  /** Playful 3-chomp munch-munch-munch sound when feeding Whit or zoo friends */
  public playMunch(): void {
    [0, 0.11, 0.22].forEach((offset, idx) => {
      const f = 260 + idx * 45;
      this.playTone(f, offset, 0.08, 0.16, 'triangle', f * 1.45);
      this.playTone(f * 0.7, offset + 0.02, 0.06, 0.09, 'sine', f * 0.5);
    });
  }

  /** Warm joyful heart-sparkle chime when an animal eats its favorite treat */
  public playYumSparkle(): void {
    this.playTone(587.33, 0, 0.13, 0.14, 'sine'); // D5
    this.playTone(783.99, 0.08, 0.14, 0.14, 'triangle'); // G5
    this.playTone(1046.5, 0.17, 0.24, 0.15, 'sine'); // C6
  }

  /** Playful rubber-stamp boop + sparkle chime when placing a coloring sticker */
  public playStamp(): void {
    this.playTone(300, 0, 0.07, 0.16, 'sine', 520);
    this.playTone(783.99, 0.04, 0.14, 0.14, 'triangle');
    this.playTone(1174.66, 0.09, 0.18, 0.09, 'sine');
  }

  /** Glittering fairy-harp ascending arpeggio for the Magic Wand in Zoo Coloring */
  public playMagicWand(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      this.playTone(freq, idx * 0.045, 0.2, 0.12, 'sine');
      this.playTone(freq * 1.5, idx * 0.045 + 0.015, 0.14, 0.05, 'triangle');
    });
  }

  /** Celebratory xylophone fanfare when a puzzle is solved */
  public playWin(): void {
    const notes = [
      { f: 523.25, t: 0.0, d: 0.16 }, // C5
      { f: 659.25, t: 0.1, d: 0.16 }, // E5
      { f: 783.99, t: 0.2, d: 0.18 }, // G5
      { f: 1046.5, t: 0.32, d: 0.45 }, // C6
      { f: 783.99, t: 0.32, d: 0.35 }, // G5 harmony
      { f: 1318.5, t: 0.46, d: 0.45 }, // E6 sparkle
    ];
    notes.forEach(({ f, t, d }) => {
      this.playTone(f, t, d, 0.15, 'triangle');
      this.playTone(f * 2, t, d * 0.7, 0.04, 'sine');
    });
  }

  /** Soft, sleepy music-box lullaby chime when Whit's Calm Timer gently finishes */
  public playBedtimeLullaby(): void {
    const notes = [
      { f: 659.25, t: 0.0, d: 0.42 }, // E5
      { f: 587.33, t: 0.34, d: 0.42 }, // D5
      { f: 523.25, t: 0.68, d: 0.52 }, // C5
      { f: 392.0, t: 1.08, d: 0.68 }, // G4
      { f: 523.25, t: 1.48, d: 0.9 }, // C5 warm rest
    ];
    notes.forEach(({ f, t, d }) => {
      this.playTone(f, t, d, 0.09, 'sine');
      this.playTone(f * 2, t, d * 0.6, 0.025, 'triangle');
    });
  }

  /**
   * Picks the warmest, most natural-sounding English voice available if the
   * Web Speech API fallback is ever needed for an unrecorded phrase.
   */
  private pickBestFallbackVoice(): SpeechSynthesisVoice | null {
    try {
      const synth = window.speechSynthesis;
      if (!synth || typeof synth.getVoices !== 'function') return null;
      const voices = synth.getVoices();
      if (!voices || voices.length === 0) return null;

      const enVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
      const pool = enVoices.length > 0 ? enVoices : voices;

      const scoreVoice = (v: SpeechSynthesisVoice): number => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        let score = 0;
        if (lang === 'en-us' || lang === 'en_us') score += 20;
        if (name.includes('natural') || name.includes('neural')) score += 60;
        if (name.includes('ava') || name.includes('emma') || name.includes('aria') || name.includes('jenny')) score += 45;
        if (name.includes('enhanced') || name.includes('premium')) score += 35;
        if (name.includes('samantha') || name.includes('karen') || name.includes('google us english')) score += 30;
        if (name.includes('espeak') || name.includes('compact') || name.includes('fred') || name.includes('albert') || name.includes('bells') || name.includes('zarvox')) {
          score -= 100;
        }
        return score;
      };

      let best = pool[0];
      let bestScore = scoreVoice(best);
      for (let i = 1; i < pool.length; i++) {
        const sc = scoreVoice(pool[i]);
        if (sc > bestScore) {
          best = pool[i];
          bestScore = sc;
        }
      }
      return best;
    } catch {
      return null;
    }
  }

  private speakFallback(word: string): void {
    try {
      const synth = window.speechSynthesis;
      if (!synth || typeof window.SpeechSynthesisUtterance !== 'function') {
        return;
      }
      synth.cancel();
      const utter = new window.SpeechSynthesisUtterance(word);
      const voice = this.pickBestFallbackVoice();
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = 'en-US';
      }
      utter.rate = 0.96;
      utter.pitch = 1.0;
      utter.volume = 0.92;
      synth.speak(utter);
    } catch {
      // Ignore Web Speech API restrictions on unsupported browsers
    }
  }

  private scheduleVoiceClips(
    ctx: AudioCtx,
    clips: ScheduledClip[],
    buffers: Map<VoiceSpriteId, AudioBuffer>,
    token: number
  ): void {
    if (token !== this.speechToken || this.muted) return;

    let cursor = ctx.currentTime + 0.01;
    const nodes: { source: AudioBufferSourceNode; gain: GainNode }[] = [];

    for (const item of clips) {
      const [spriteId, startSec, rawDur] = item.ref;
      const buf = buffers.get(spriteId);
      if (!buf) continue;

      const safeStart = Math.max(0, Math.min(startSec, Math.max(0, buf.duration - 0.02)));
      const safeDur = Math.max(0.04, Math.min(rawDur, buf.duration - safeStart));

      const source = ctx.createBufferSource();
      source.buffer = buf;

      const gain = ctx.createGain();
      const fadeIn = Math.min(0.008, safeDur * 0.15);
      const fadeOut = Math.min(0.015, safeDur * 0.2);

      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.linearRampToValueAtTime(0.95, cursor + fadeIn);
      gain.gain.setValueAtTime(0.95, cursor + Math.max(fadeIn, safeDur - fadeOut));
      gain.gain.linearRampToValueAtTime(0.0001, cursor + safeDur);

      source.connect(gain);
      gain.connect(ctx.destination);

      source.start(cursor, safeStart, safeDur);
      nodes.push({ source, gain });

      cursor += safeDur + item.gapAfter;
    }

    this.activeVoiceNodes = nodes;
  }

  /**
   * Warm, natural human neural voice (en-US-AvaNeural) via bundled Web Audio sprites.
   * Falls back cleanly to the best available natural browser voice only if unrecorded.
   */
  public speakWord(word: string): void {
    if (this.muted || Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const token = ++this.speechToken;
    this.stopActiveVoice();

    const clips = resolveVoiceClips(word);
    const ctx = this.getContext();

    if (!clips || !ctx) {
      this.speakFallback(word);
      return;
    }

    // Collect unique sprite IDs needed for this phrase
    const needed = new Set<VoiceSpriteId>();
    for (const c of clips) {
      needed.add(c.ref[0]);
    }

    // Fast path: if all needed sprites are already decoded, schedule synchronously (0ms!)
    let allReady = true;
    for (const id of needed) {
      if (!this.spriteBuffers.has(id)) {
        allReady = false;
        break;
      }
    }

    if (allReady) {
      this.scheduleVoiceClips(ctx, clips, this.spriteBuffers, token);
      return;
    }

    // Async decode path (first time a topic sprite is played)
    void Promise.all(
      Array.from(needed).map(async (id) => {
        const buf = await this.getSpriteBuffer(id, ctx);
        return [id, buf] as const;
      })
    ).then((pairs) => {
      if (token !== this.speechToken || this.muted) return;
      for (const [, buf] of pairs) {
        if (!buf) {
          this.speakFallback(word);
          return;
        }
      }
      this.scheduleVoiceClips(ctx, clips, this.spriteBuffers, token);
    });
  }
}

export const soundEngine = new SoundEngine();
