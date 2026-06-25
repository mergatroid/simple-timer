import { useState, useCallback } from 'react';
import {
  WorkoutConfig,
  StationId,
  CardioType,
  EffortScale,
  PairingRule,
  PresetId,
  Workout,
} from '@/domain/types';
import { STATION_IDS } from '@/domain/stations';
import { PRESETS, PRESET_STATION_COUNTS } from '@/domain/presets';
import { generateWorkout } from '@/domain/generate-workout';

const DEFAULT_CONFIG: WorkoutConfig = {
  selectedStations: ['ski-erg', 'sled-push', 'sled-pull', 'rowing', 'burpee-broad-jumps'],
  selectedCardioTypes: ['run'],
  effortScale: 'half',
  pairingRule: 'after',
  runDistanceMode: 'fixed',
  runDistanceFixed: 400,
  runDistanceMin: 300,
  runDistanceMax: 600,
  preset: 'intermediate',
};

export function useWodWorkout() {
  const [config, setConfig] = useState<WorkoutConfig>(DEFAULT_CONFIG);

  const isValid = config.selectedStations.length >= 3 && config.selectedCardioTypes.length >= 1;

  const validationError: string | null = !isValid
    ? config.selectedStations.length < 3
      ? 'Select at least 3 stations'
      : 'Select at least 1 cardio type'
    : null;

  const applyPreset = useCallback((presetId: PresetId) => {
    const preset = PRESETS[presetId];
    const [minStations, maxStations] = PRESET_STATION_COUNTS[presetId];
    const stationCount = Math.floor(Math.random() * (maxStations - minStations + 1)) + minStations;
    const selectedStations = STATION_IDS.slice(0, stationCount) as StationId[];

    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      selectedStations,
      preset: presetId,
    }));
  }, []);

  const toggleStation = useCallback((id: StationId) => {
    setConfig((prev) => {
      const newStations = prev.selectedStations.includes(id)
        ? prev.selectedStations.filter((s) => s !== id)
        : [...prev.selectedStations, id];
      return { ...prev, selectedStations: newStations };
    });
  }, []);

  const toggleCardio = useCallback((type: CardioType) => {
    setConfig((prev) => {
      const newCardio = prev.selectedCardioTypes.includes(type)
        ? prev.selectedCardioTypes.filter((c) => c !== type)
        : [...prev.selectedCardioTypes, type];
      return { ...prev, selectedCardioTypes: newCardio };
    });
  }, []);

  const setEffortScale = useCallback((scale: EffortScale) => {
    setConfig((prev) => ({ ...prev, effortScale: scale }));
  }, []);

  const setPairingRule = useCallback((rule: PairingRule) => {
    setConfig((prev) => ({ ...prev, pairingRule: rule }));
  }, []);

  const setRunDistanceMode = useCallback((mode: 'fixed' | 'range') => {
    setConfig((prev) => ({ ...prev, runDistanceMode: mode }));
  }, []);

  const setRunDistanceFixed = useCallback((metres: number) => {
    setConfig((prev) => ({ ...prev, runDistanceFixed: metres }));
  }, []);

  const setRunDistanceRange = useCallback((min: number, max: number) => {
    setConfig((prev) => ({ ...prev, runDistanceMin: min, runDistanceMax: max }));
  }, []);

  const generate = useCallback((): Workout => {
    return generateWorkout(config);
  }, [config]);

  return {
    config,
    isValid,
    validationError,
    applyPreset,
    toggleStation,
    toggleCardio,
    setEffortScale,
    setPairingRule,
    setRunDistanceMode,
    setRunDistanceFixed,
    setRunDistanceRange,
    generate,
  };
}
