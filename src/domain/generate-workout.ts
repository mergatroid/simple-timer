import { EffortScale, WorkoutConfig, WorkoutStep, Workout } from './types';
import { STATION_DEFS } from './stations';
import { CARDIO_DEFS } from './cardio';

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildMultiples(min: number, max: number, step: number): number[] {
  const result: number[] = [];
  for (let i = min; i <= max; i += step) {
    result.push(i);
  }
  return result;
}

function applyEffortScale(value: number, scale: EffortScale): number {
  const multiplier = scale === 'full' ? 1.0 : scale === 'half' ? 0.5 : 0.25;
  return Math.ceil((value * multiplier) / 5) * 5;
}

function formatStepDisplay(value: number, unit: 'm' | 'reps' | 's'): string {
  if (unit === 'm') return `${value}m`;
  if (unit === 'reps') return `${value} reps`;
  if (unit === 's') {
    const min = Math.floor(value / 60);
    const sec = value % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }
  return String(value);
}

export function generateWorkout(config: WorkoutConfig): Workout {
  if (config.selectedStations.length < 3) {
    throw new Error('At least 3 stations are required');
  }
  if (config.selectedCardioTypes.length === 0) {
    throw new Error('At least 1 cardio type is required');
  }

  const shuffledStations = fisherYatesShuffle(config.selectedStations);
  const steps: WorkoutStep[] = [];

  shuffledStations.forEach((stationId) => {
    const stationDef = STATION_DEFS[stationId];
    const scaledValue = applyEffortScale(stationDef.fullValue, config.effortScale);

    const stationStep: WorkoutStep = {
      id: '',
      kind: 'station',
      label: stationDef.label,
      stationId,
      metric: stationDef.metric,
      value: scaledValue,
      unit: stationDef.unit,
      displayValue: formatStepDisplay(scaledValue, stationDef.unit),
    };

    const cardioType = randomPick(config.selectedCardioTypes);
    let cardioDistance: number;

    if (config.runDistanceMode === 'fixed') {
      cardioDistance = config.runDistanceFixed;
    } else {
      const multiples = buildMultiples(config.runDistanceMin, config.runDistanceMax, 100);
      cardioDistance = randomPick(multiples);
    }

    const cardioDef = CARDIO_DEFS[cardioType];
    const cardioStep: WorkoutStep = {
      id: '',
      kind: 'cardio',
      label: cardioDef.label,
      cardioType,
      metric: 'distance',
      value: cardioDistance,
      unit: 'm',
      displayValue: formatStepDisplay(cardioDistance, 'm'),
    };

    const pair =
      config.pairingRule === 'before'
        ? [cardioStep, stationStep]
        : config.pairingRule === 'after'
          ? [stationStep, cardioStep]
          : Math.random() > 0.5
            ? [cardioStep, stationStep]
            : [stationStep, cardioStep];

    steps.push(...pair);
  });

  steps.forEach((step, index) => {
    step.id = String(index);
  });

  const workout: Workout = {
    id: Date.now().toString(),
    generatedAt: Date.now(),
    steps,
    totalSteps: steps.length,
    presetUsed: config.preset,
  };

  return workout;
}
