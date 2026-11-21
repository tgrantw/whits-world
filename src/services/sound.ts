import { Platform } from 'react-native';

/**
 * Pure Web Audio API synthesized sound engine for Whit's World.
 * - Zero external audio assets needed (no broken URLs).
 * - Gentle, warm marimba/xylophone tones designed specifically for 3-year-olds.
 * - No harsh buzzers or error sounds.
 * - Safe no-op fallback on native platforms (hook point for expo-av / expo-audio later).
 */

type AudioCtx = AudioContext;

class SoundEngine {
  private ctx: AudioCtx | null = null;
  private muted = false;

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
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
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
   * Call on first user touch/tap to unlock iOS Safari Web Audio cleanly.
   */
  public unlock(): void {
    this.getContext();
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
}

export const soundEngine = new SoundEngine();
