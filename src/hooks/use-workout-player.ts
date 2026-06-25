import { useState, useMemo } from 'react';
import { Workout, WorkoutStep } from '@/domain/types';

export function useWorkoutPlayer(workout: Workout) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStep = useMemo<WorkoutStep | null>(
    () => (currentIndex < workout.steps.length ? workout.steps[currentIndex] : null),
    [currentIndex, workout.steps],
  );

  const remainingSteps = useMemo<WorkoutStep[]>(
    () => workout.steps.slice(currentIndex + 1),
    [currentIndex, workout.steps],
  );

  const isFinished = currentIndex >= workout.totalSteps;
  const progress = currentIndex / workout.totalSteps;

  const advance = () => {
    setCurrentIndex((i) => Math.min(i + 1, workout.totalSteps));
  };

  const restart = () => {
    setCurrentIndex(0);
  };

  return {
    currentStep,
    remainingSteps,
    isFinished,
    progress,
    currentIndex,
    advance,
    restart,
  };
}
