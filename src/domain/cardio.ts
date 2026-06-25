import { CardioType } from './types';

export type CardioDef = {
  type: CardioType;
  label: string;
  unit: 'm';
};

export const CARDIO_DEFS: Record<CardioType, CardioDef> = {
  run: { type: 'run', label: 'Run', unit: 'm' },
  bike: { type: 'bike', label: 'Bike', unit: 'm' },
  'ski-erg': { type: 'ski-erg', label: 'Ski Erg', unit: 'm' },
  rower: { type: 'rower', label: 'Rower', unit: 'm' },
};

export const CARDIO_TYPES: CardioType[] = ['run', 'bike', 'ski-erg', 'rower'];
