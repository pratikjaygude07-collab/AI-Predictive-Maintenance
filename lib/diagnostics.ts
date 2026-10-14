import type { ChartRange, DemoAsset, TrendPoint } from "./demo-data.ts";

export interface VibrationSample {
  timeMs: number;
  valueMmS: number;
  source: "simulated";
}

export interface SpectrumSample {
  frequencyHz: number;
  order: number;
  amplitudeMmS: number;
  source: "simulated";
}

export interface EducationalFaultPattern {
  id: string;
  name: string;
  pattern: string;
  context: string;
}

const WAVEFORM_SAMPLE_COUNT = 256;
const WAVEFORM_CYCLES = 16;
const MAX_SPECTRUM_ORDER = 10;

export const EDUCATIONAL_FAULT_PATTERNS: readonly EducationalFaultPattern[] = [
  {
    id: "imbalance",
    name: "Rotor imbalance",
    pattern: "Often illustrated by a dominant running-speed (1×) component.",
    context:
      "An educational reference only. A 1× component is not unique to imbalance and requires machine-specific investigation.",
  },
  {
    id: "misalignment",
    name: "Shaft misalignment",
    pattern: "May include 1× and 2× running-speed components, with axial response.",
    context:
      "An educational reference only. Coupling, mounting, load, and measurement direction affect the observed pattern.",
  },
  {
    id: "bearing",
    name: "Bearing-related impacts",
    pattern: "Can appear as repetitive high-frequency impacts or modulated components.",
    context:
      "An educational reference only. Bearing geometry, shaft speed, lubrication, and sensor placement are needed for interpretation.",
  },
];

function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function hashSeed(value: string): number {
  let hash = 2_166_136_261;

  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16_777_619);
  }

  return hash >>> 0;
}

export function getSimulatedWaveform(
  asset: DemoAsset,
): VibrationSample[] {
  const shaftFrequencyHz = asset.speedRpm / 60;
  const sampleRateHz = shaftFrequencyHz * (WAVEFORM_SAMPLE_COUNT / WAVEFORM_CYCLES);
  const random = createRandom(hashSeed(`waveform:${asset.id}`));
  const normalization = Math.sqrt(1 + 0.16 ** 2 + 0.06 ** 2);

  return Array.from({ length: WAVEFORM_SAMPLE_COUNT }, (_, index) => {
    const phase = (index / WAVEFORM_SAMPLE_COUNT) * WAVEFORM_CYCLES * Math.PI * 2;
    const velocity =
      (asset.vibrationMmS * Math.SQRT2 * (
        Math.sin(phase) +
        0.16 * Math.sin(phase * 2 + 0.3) +
        0.06 * Math.sin(phase * 5 + 0.7)
      )) /
      normalization;
    const noise = (random() - 0.5) * asset.vibrationMmS * 0.025;

    return {
      timeMs: (index / sampleRateHz) * 1_000,
      valueMmS: Number((velocity + noise).toFixed(4)),
      source: "simulated",
    };
  });
}

export function getSimulatedSpectrum(
  asset: DemoAsset,
  waveform: readonly VibrationSample[] = getSimulatedWaveform(asset),
): SpectrumSample[] {
  if (waveform.length === 0) return [];

  const sampleCount = waveform.length;
  const shaftFrequencyHz = asset.speedRpm / 60;
  const sampleRateHz =
    shaftFrequencyHz * (sampleCount / WAVEFORM_CYCLES);
  const maxBin = Math.floor(MAX_SPECTRUM_ORDER * WAVEFORM_CYCLES);
  const spectrum: SpectrumSample[] = [];

  for (let bin = 0; bin <= maxBin; bin += 1) {
    let real = 0;
    let imaginary = 0;

    for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
      const angle = (2 * Math.PI * bin * sampleIndex) / sampleCount;
      const sample = waveform[sampleIndex].valueMmS;
      real += sample * Math.cos(angle);
      imaginary -= sample * Math.sin(angle);
    }

    const amplitude =
      bin === 0
        ? Math.hypot(real, imaginary) / sampleCount
        : (2 * Math.hypot(real, imaginary)) / sampleCount;
    const frequencyHz = (bin * sampleRateHz) / sampleCount;

    spectrum.push({
      frequencyHz: Number(frequencyHz.toFixed(2)),
      order: Number((frequencyHz / shaftFrequencyHz).toFixed(2)),
      amplitudeMmS: Number(amplitude.toFixed(4)),
      source: "simulated",
    });
  }

  return spectrum;
}

export function getSimulatedTemperatureTrend(
  asset: DemoAsset,
  range: ChartRange,
): TrendPoint[] {
  const sampleCount = range === "24h" ? 24 : 7;
  const amplitude = range === "7d" ? 2.8 : 1.7;
  const random = createRandom(hashSeed(`temperature:${asset.id}:${range}`));

  return Array.from({ length: sampleCount }, (_, index) => {
    const phase = index / Math.max(sampleCount - 1, 1);
    const cycle = Math.sin(phase * Math.PI * 2.1 - 0.65);
    const drift = Math.sin(phase * Math.PI * 4.2) * amplitude * 0.2;
    const variation = (random() - 0.5) * amplitude * 0.18;
    const value =
      index === sampleCount - 1
        ? asset.temperatureC
        : asset.temperatureC + cycle * amplitude + drift + variation;
    const label =
      range === "7d"
        ? `Day ${index + 1}`
        : range === "6h"
          ? `${String(index).padStart(2, "0")}:00`
          : `${String(index).padStart(2, "0")}:00`;

    return {
      label,
      value: Number(value.toFixed(1)),
      source: "simulated",
    };
  });
}
