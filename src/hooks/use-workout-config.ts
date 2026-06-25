import { useState, useCallback } from 'react';
import { WorkoutConfigManager } from '@/domain/workout-config-manager';
import { WorkoutConfig, Workout, PresetId, StationId, CardioType } from '@/domain/types';
import { generateWorkout } from '@/domain/generate-workout';

/**
 * Hook that wraps WorkoutConfigManager to provide a React interface.
 * Manages workout configuration state and generation.
 */
export function useWorkoutConfig() {
  const [manager] = useState(() => new WorkoutConfigManager());
  const [, setForceUpdate] = useState(0);

  const config = manager.config;
  const isValid = manager.isValid;
  const validationError = manager.validationError;

  // Trigger re-render when config changes
  const updateConfig = useCallback(
    (field: keyof WorkoutConfig, value: any) => {
      try {
        manager.updateConfig(field, value);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Config update failed:', error);
      }
    },
    [manager]
  );

  const toggleStation = useCallback(
    (stationId: StationId) => {
      try {
        manager.toggleStation(stationId);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Toggle station failed:', error);
      }
    },
    [manager]
  );

  const toggleCardioType = useCallback(
    (cardioType: CardioType) => {
      try {
        manager.toggleCardioType(cardioType);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Toggle cardio type failed:', error);
      }
    },
    [manager]
  );

  const applyPreset = useCallback(
    (presetId: PresetId) => {
      try {
        manager.applyPreset(presetId);
        setForceUpdate(prev => prev + 1);
      } catch (error) {
        console.error('Apply preset failed:', error);
      }
    },
    [manager]
  );

  const generate = useCallback((): Workout => {
    if (!isValid) {
      throw new Error('Cannot generate workout: invalid configuration');
    }
    return generateWorkout(config);
  }, [config, isValid]);

  return {
    config,
    isValid,
    validationError,
    updateConfig,
    toggleStation,
    toggleCardioType,
    applyPreset,
    generate,
  };
}
