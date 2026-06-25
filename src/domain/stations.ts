import { StationId } from './types';

export type StationDef = {
  id: StationId;
  label: string;
  metric: 'distance' | 'reps';
  fullValue: number;
  unit: 'm' | 'reps';
};

export const STATION_DEFS: Record<StationId, StationDef> = {
  'ski-erg': {
    id: 'ski-erg',
    label: 'Ski Erg',
    metric: 'distance',
    fullValue: 1000,
    unit: 'm',
  },
  'sled-push': {
    id: 'sled-push',
    label: 'Sled Push',
    metric: 'distance',
    fullValue: 50,
    unit: 'm',
  },
  'sled-pull': {
    id: 'sled-pull',
    label: 'Sled Pull',
    metric: 'distance',
    fullValue: 50,
    unit: 'm',
  },
  'burpee-broad-jumps': {
    id: 'burpee-broad-jumps',
    label: 'Burpee BJs',
    metric: 'distance',
    fullValue: 80,
    unit: 'm',
  },
  rowing: {
    id: 'rowing',
    label: 'Rowing',
    metric: 'distance',
    fullValue: 1000,
    unit: 'm',
  },
  'farmers-carry': {
    id: 'farmers-carry',
    label: 'Farmers Carry',
    metric: 'distance',
    fullValue: 200,
    unit: 'm',
  },
  'sandbag-lunges': {
    id: 'sandbag-lunges',
    label: 'Sandbag Lunges',
    metric: 'distance',
    fullValue: 100,
    unit: 'm',
  },
  'wall-balls': {
    id: 'wall-balls',
    label: 'Wall Balls',
    metric: 'reps',
    fullValue: 100,
    unit: 'reps',
  },
};

export const STATION_IDS = Object.keys(STATION_DEFS) as StationId[];
