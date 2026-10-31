import type { LayerId, Place, Season } from "./places";

export interface Environment {
  season: Season;
  hour: number;
}

export interface AudioDebugState {
  context: string;
  playing: boolean;
  placeId: string | null;
  volume: number;
  layers: Record<LayerId, number>;
  environment: Environment;
}

interface Scene {
  gain: GainNode;
  layerGains: Record<LayerId, GainNode>;
  airFilter: BiquadFilterNode;
  waterFilter: BiquadFilterNode;
  padGain: GainNode;
  sources: AudioScheduledSourceNode[];
  timers: number[];
  place: Place;
  padIndex: number;
}

const SEASON_BRIGHTNESS: Record<Season, number> = {
  primavera: 1.05,
  estate: 1.2,
  autunno: 0.95,
  inverno: 0.8,
};

const SEASON_ACTIVITY: Record<Season, number> = {
  primavera: 1.1,
  estate: 1.25,
  autunno: 0.9,
  inverno: 0.7,
};

const LAYER_SCALE = 0.45;

function midiToFrequency(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class Soundscape {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private scene: Scene | null = null;
  private place: Place | null = null;
  private playing = false;
  private volume = 0.78;
  private layers: Record<LayerId, number> = {
    air: 0.5,
    water: 0.5,
    earth: 0.5,
    life: 0.5,
  };
  private environment: Environment = { season: "primavera", hour: 9 };
  private noiseBuffers = new Map<string, AudioBuffer>();
  private sceneVersion = 0;

  async init(): Promise<void> {
    if (!this.ctx) {
      const context = new AudioContext();
      const master = context.createGain();
      master.gain.value = this.volume;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.82;
      master.connect(analyser);
      analyser.connect(context.destination);
      this.ctx = context;
      this.master = master;
      this.analyser = analyser;
      this.noiseBuffers.set("white", this.createNoise(context, "white"));
      this.noiseBuffers.set("pink", this.createNoise(context, "pink"));
      this.noiseBuffers.set("brown", this.createNoise(context, "brown"));
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
  }

  async play(place: Place): Promise<void> {
    await this.init();
    const samePlace = this.place?.id === place.id;
    this.place = place;
    this.layers = { ...place.layers };
    this.playing = true;

    if (samePlace && this.scene) {
      this.scene.gain.gain.cancelScheduledValues(this.ctx!.currentTime);
      this.scene.gain.gain.setTargetAtTime(
        1,
        this.ctx!.currentTime,
        0.35,
      );
      return;
    }

    this.stopScene(0.9);
    this.buildScene(place);
  }

  pause(): void {
    this.playing = false;
    this.stopScene(0.6);
  }

  async resume(): Promise<void> {
    if (!this.place) return;
    await this.play(this.place);
  }

  setVolume(value: number): void {
    this.volume = clamp(value, 0, 1);
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.08);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setLayer(layer: LayerId, value: number): void {
    this.layers[layer] = clamp(value, 0, 1);
    if (this.ctx && this.scene) {
      const gain = this.scene.layerGains[layer];
      gain.gain.setTargetAtTime(
        this.layers[layer] * LAYER_SCALE,
        this.ctx.currentTime,
        0.12,
      );
    }
  }

  setEnvironment(environment: Environment): void {
    this.environment = environment;
    if (!this.ctx || !this.scene || !this.place) return;
    const now = this.ctx.currentTime;
    this.scene.airFilter.frequency.setTargetAtTime(
      this.airCutoff(),
      now,
      1.2,
    );
    this.scene.waterFilter.frequency.setTargetAtTime(
      this.waterCutoff(),
      now,
      1.2,
    );
  }

  getLevels(target: Uint8Array<ArrayBuffer>): Uint8Array<ArrayBuffer> {
    if (!this.analyser) {
      target.fill(0);
      return target;
    }
    this.analyser.getByteTimeDomainData(target);
    return target;
  }

  hasAnalyser(): boolean {
    return this.analyser !== null;
  }

  getState(): AudioDebugState {
    return {
      context: this.ctx?.state ?? "uninitialized",
      playing: this.playing,
      placeId: this.place?.id ?? null,
      volume: this.volume,
      layers: { ...this.layers },
      environment: { ...this.environment },
    };
  }

  dispose(): void {
    this.stopScene(0.2);
    if (this.ctx) {
      this.sceneVersion += 1;
      void this.ctx.close();
      this.ctx = null;
      this.master = null;
      this.analyser = null;
    }
  }

  private dayFactor(): number {
    const raw =
      Math.sin(((this.environment.hour - 6) / 24) * Math.PI * 2) * 0.5 + 0.5;
    return clamp(raw, 0.12, 1);
  }

  private airCutoff(): number {
    const base = this.place?.sound.filter ?? 1200;
    return clamp(
      base *
        (0.75 + this.dayFactor() * 0.55) *
        SEASON_BRIGHTNESS[this.environment.season],
      140,
      9000,
    );
  }

  private waterCutoff(): number {
    const base = this.place?.sound.filter ?? 1200;
    return clamp(
      base * 0.55 * (0.8 + this.dayFactor() * 0.3),
      90,
      4000,
    );
  }

  private activityFactor(): number {
    return this.dayFactor() * SEASON_ACTIVITY[this.environment.season];
  }

  private createNoise(
    context: AudioContext,
    color: "white" | "pink" | "brown",
  ): AudioBuffer {
    const seconds = 3;
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let pink = 0;
    let brown = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      if (color === "white") {
        data[index] = white;
      } else if (color === "pink") {
        pink = pink * 0.985 + white * 0.035;
        data[index] = pink;
      } else {
        brown = brown * 0.995 + white * 0.02;
        data[index] = brown;
      }
    }
    let peak = 0;
    for (let index = 0; index < length; index += 1) {
      peak = Math.max(peak, Math.abs(data[index]));
    }
    if (peak > 0) {
      for (let index = 0; index < length; index += 1) {
        data[index] /= peak;
      }
    }
    return buffer;
  }

  private noiseSource(
    sources: AudioScheduledSourceNode[],
    color: "white" | "pink" | "brown",
    filterType: BiquadFilterType,
    frequency: number,
    destination: AudioNode,
    volume: number,
  ): BiquadFilterNode {
    const context = this.ctx!;
    const source = context.createBufferSource();
    source.buffer = this.noiseBuffers.get(color) ?? null;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = 0.7;
    const gain = context.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    source.start();
    sources.push(source);
    return filter;
  }

  private buildScene(place: Place): void {
    const context = this.ctx!;
    const master = this.master!;
    const version = ++this.sceneVersion;
    const now = context.currentTime;

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(1, now + 1.4);
    gain.connect(master);

    const layerGains = {} as Record<LayerId, GainNode>;
    (["air", "water", "earth", "life"] as LayerId[]).forEach((id) => {
      const layerGain = context.createGain();
      layerGain.gain.value = this.layers[id] * LAYER_SCALE;
      layerGain.connect(gain);
      layerGains[id] = layerGain;
    });

    const sources: AudioScheduledSourceNode[] = [];
    const airFilter = this.noiseSource(
      sources,
      place.sound.noise,
      "lowpass",
      this.airCutoff(),
      layerGains.air,
      0.2,
    );
    const waterFilter = this.noiseSource(
      sources,
      "brown",
      "lowpass",
      this.waterCutoff(),
      layerGains.water,
      0.24,
    );

    const scene: Scene = {
      gain,
      layerGains,
      airFilter,
      waterFilter,
      padGain: context.createGain(),
      sources,
      timers: [],
      place,
      padIndex: 0,
    };

    const airLfo = context.createOscillator();
    airLfo.frequency.value = 0.06 + place.sound.lfo;
    const airLfoGain = context.createGain();
    airLfoGain.gain.value = 0.055;
    airLfo.connect(airLfoGain);
    airLfoGain.connect(layerGains.air.gain);
    airLfo.start();
    scene.sources.push(airLfo);

    const waterLfo = context.createOscillator();
    waterLfo.frequency.value = 0.035 + place.sound.lfo * 0.6;
    const waterLfoGain = context.createGain();
    waterLfoGain.gain.value = 0.06;
    waterLfo.connect(waterLfoGain);
    waterLfoGain.connect(layerGains.water.gain);
    waterLfo.start();
    scene.sources.push(waterLfo);

    const drone = context.createOscillator();
    drone.type = "sine";
    drone.frequency.value = midiToFrequency(place.sound.padRoot - 12);
    const droneGain = context.createGain();
    droneGain.gain.value = 0.075;
    const droneLfo = context.createOscillator();
    droneLfo.frequency.value = 0.05;
    const droneLfoGain = context.createGain();
    droneLfoGain.gain.value = 0.025;
    droneLfo.connect(droneLfoGain);
    droneLfoGain.connect(droneGain.gain);
    drone.connect(droneGain);
    droneGain.connect(layerGains.earth);
    drone.start();
    droneLfo.start();
    scene.sources.push(drone, droneLfo);

    scene.padGain.gain.value = 0.9;
    scene.padGain.connect(layerGains.air);

    this.scene = scene;
    this.schedulePad(scene);
    this.scheduleLife(scene, version);
  }

  private schedulePad(scene: Scene): void {
    if (!this.ctx || this.scene !== scene) return;
    const context = this.ctx;
    const now = context.currentTime;
    const progression = scene.place.sound.progression;
    const chord = progression[scene.padIndex % progression.length];
    scene.padIndex += 1;
    const root = scene.place.sound.padRoot;

    chord.forEach((offset, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = scene.place.sound.padWave;
      oscillator.frequency.value = midiToFrequency(root + offset + 12);
      oscillator.detune.value = index % 2 === 0 ? -4 : 4;
      const voice = context.createGain();
      voice.gain.setValueAtTime(0.0001, now);
      voice.gain.exponentialRampToValueAtTime(0.045, now + 1.6);
      voice.gain.exponentialRampToValueAtTime(0.0001, now + 7.4);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = clamp(
        this.airCutoff() * 1.4,
        500,
        6000,
      );
      oscillator.connect(filter);
      filter.connect(voice);
      voice.connect(scene.padGain);
      oscillator.start(now);
      oscillator.stop(now + 7.6);
      scene.sources.push(oscillator);
    });

    const timer = window.setTimeout(() => this.schedulePad(scene), 7200);
    scene.timers.push(timer);
  }

  private scheduleLife(scene: Scene, version: number): void {
    const timer = window.setInterval(() => {
      if (
        !this.ctx ||
        !this.playing ||
        this.scene !== scene ||
        this.sceneVersion !== version
      ) {
        return;
      }
      const probability =
        scene.place.sound.eventRate * this.activityFactor() * 0.22;
      if (Math.random() < probability) {
        this.playEvent(scene);
      }
    }, 280);
    scene.timers.push(timer);
  }

  private playEvent(scene: Scene): void {
    if (!this.ctx) return;
    const context = this.ctx;
    const now = context.currentTime;
    const destination = scene.layerGains.life;
    const pan = context.createStereoPanner();
    pan.pan.value = randomBetween(-0.75, 0.75);
    pan.connect(destination);

    const startOscillator = (
      frequency: number,
      type: OscillatorType,
      duration: number,
      volume: number,
      endFrequency?: number,
    ) => {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
          endFrequency,
          now + duration,
        );
      }
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(volume, now + 0.02);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(envelope);
      envelope.connect(pan);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.05);
      scene.sources.push(oscillator);
    };

    switch (scene.place.sound.eventType) {
      case "birds": {
        const base = randomBetween(1500, 2600);
        const notes = 2 + Math.floor(Math.random() * 3);
        for (let index = 0; index < notes; index += 1) {
          const offset = index * 0.12;
          const oscillator = context.createOscillator();
          const start = now + offset;
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(base + index * 90, start);
          oscillator.frequency.exponentialRampToValueAtTime(
            base + 320 + index * 60,
            start + 0.07,
          );
          const envelope = context.createGain();
          envelope.gain.setValueAtTime(0.0001, start);
          envelope.gain.exponentialRampToValueAtTime(0.022, start + 0.015);
          envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
          oscillator.connect(envelope);
          envelope.connect(pan);
          oscillator.start(start);
          oscillator.stop(start + 0.16);
          scene.sources.push(oscillator);
        }
        break;
      }
      case "waves": {
        const source = context.createBufferSource();
        source.buffer = this.noiseBuffers.get("brown") ?? null;
        source.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = randomBetween(320, 620);
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(0.09, now + 0.7);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(pan);
        source.start(now);
        source.stop(now + 2.5);
        scene.sources.push(source);
        break;
      }
      case "wind": {
        const source = context.createBufferSource();
        source.buffer = this.noiseBuffers.get("pink") ?? null;
        source.loop = true;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = randomBetween(700, 1600);
        filter.Q.value = 1.4;
        const envelope = context.createGain();
        envelope.gain.setValueAtTime(0.0001, now);
        envelope.gain.exponentialRampToValueAtTime(0.06, now + 1.1);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 3);
        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(pan);
        source.start(now);
        source.stop(now + 3.1);
        scene.sources.push(source);
        break;
      }
      case "bells": {
        const base = randomBetween(520, 880);
        startOscillator(base, "sine", 4.2, 0.03);
        startOscillator(base * 2.01, "sine", 3.4, 0.018);
        startOscillator(base * 2.98, "sine", 2.8, 0.009);
        break;
      }
      case "ice": {
        startOscillator(randomBetween(2400, 4200), "sine", 1.8, 0.016);
        startOscillator(randomBetween(3200, 5200), "sine", 1.2, 0.009);
        break;
      }
      case "city": {
        startOscillator(randomBetween(180, 320), "square", 0.18, 0.012);
        startOscillator(randomBetween(600, 1100), "sine", 0.35, 0.015);
        break;
      }
      default:
        break;
    }
  }

  private stopScene(fade: number): void {
    const scene = this.scene;
    if (!scene || !this.ctx) return;
    this.scene = null;
    this.sceneVersion += 1;
    scene.timers.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    const now = this.ctx.currentTime;
    scene.gain.gain.cancelScheduledValues(now);
    scene.gain.gain.setValueAtTime(
      Math.max(scene.gain.gain.value, 0.0001),
      now,
    );
    scene.gain.gain.exponentialRampToValueAtTime(0.0001, now + fade);
    window.setTimeout(() => {
      scene.sources.forEach((source) => {
        try {
          source.stop();
        } catch {
          // already stopped
        }
      });
      scene.gain.disconnect();
    }, fade * 1000 + 120);
  }
}
