export type StationId =
  | 'ski-erg'
  | 'sled-push'
  | 'sled-pull'
  | 'burpee-broad-jumps'
  | 'rowing'
  | 'farmers-carry'
  | 'sandbag-lunges'
  | 'wall-balls';

export type CardioType = 'run' | 'bike' | 'ski-erg' | 'rower';

export type EffortScale = 'full' | 'half' | 'quarter';

export type PairingRule = 'before' | 'after' | 'random';

export type PresetId = 'beginner' | 'intermediate' | 'advanced';

export type WorkoutStep = {
  id: string;
  kind: 'station' | 'cardio';
  label: string;
  stationId?: StationId;
  cardioType?: CardioType;
  metric: 'distance' | 'reps' | 'timed';
  value: number;
  unit: 'm' | 'reps' | 's';
  displayValue: string;
};

export type Workout = {
  id: string;
  generatedAt: number;
  steps: WorkoutStep[];
  totalSteps: number;
  presetUsed?: PresetId;
};

export type WorkoutConfig = {
  selectedStations: StationId[];
  selectedCardioTypes: CardioType[];
  effortScale: EffortScale;
  pairingRule: PairingRule;
  runDistanceMode: 'fixed' | 'range';
  runDistanceFixed: number;
  runDistanceMin: number;
  runDistanceMax: number;
  preset?: PresetId;
};

export type StepCompletion = {
  stepId: string;
  label: string;
  kind: 'station' | 'cardio';
  lapTimeSeconds: number;
  reps?: number;
  distance?: number;
};

export type WorkoutResult = {
  completions: StepCompletion[];
  totalTimeSeconds: number;
  totalReps: number;
  totalDistance: number;
  stationLapTimes: Record<string, number>;
};
