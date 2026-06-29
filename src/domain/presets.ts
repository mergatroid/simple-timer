import { PresetId, WorkoutConfig } from './types';

export type PresetDef = {
  id: PresetId;
  label: string;
  config: Partial<WorkoutConfig>;
};

export const PRESETS: Record<PresetId, PresetDef> = {
  beginner: {
    id: 'beginner',
    label: 'Easy',
    config: {
      effortScale: 'quarter',
      runDistanceMode: 'fixed',
      runDistanceFixed: 300,
      runDistanceMin: 200,
      runDistanceMax: 400,
    },
  },
  intermediate: {
    id: 'intermediate',
    label: 'Medium',
    config: {
      effortScale: 'half',
      runDistanceMode: 'fixed',
      runDistanceFixed: 400,
      runDistanceMin: 300,
      runDistanceMax: 600,
    },
  },
  advanced: {
    id: 'advanced',
    label: 'Hard',
    config: {
      effortScale: 'full',
      runDistanceMode: 'range',
      runDistanceFixed: 600,
      runDistanceMin: 400,
      runDistanceMax: 800,
    },
  },
};

export const PRESET_STATION_COUNTS: Record<PresetId, [number, number]> = {
  beginner: [3, 3],
  intermediate: [5, 5],
  advanced: [8, 8],
};
