import { Workout, WorkoutStep, WorkoutResult, StepCompletion } from './types';

/**
 * WorkoutResultCalculator is a deep pure module for aggregating workout results.
 * Extracted from the component's useEffect, it enables testing result logic without React.
 *
 * Interface: 3 pure functions
 * Implementation: lap time calculation, metric aggregation, distance filtering
 */

export interface StepCompletion {
  stepId: string;
  label: string;
  kind: 'station' | 'cardio';
  lapTimeSeconds: number;
  reps?: number;
  distance?: number;
}

/**
 * Calculate individual step lap times.
 *
 * First step: time from workout start
 * Subsequent steps: time from previous step completion
 *
 * @param stepCompletions Map of step index → completion timestamp
 * @param workoutStartTime Timestamp when workout started
 * @returns Array of lap times in seconds
 */
export function calculateLapTimes(
  stepCount: number,
  stepCompletions: Map<number, number>,
  workoutStartTime: number
): number[] {
  const lapTimes: number[] = [];

  for (let i = 0; i < stepCount; i++) {
    const completionTime = stepCompletions.get(i);

    if (completionTime === undefined) {
      lapTimes.push(0);
      continue;
    }

    const previousTime = i === 0 ? workoutStartTime : stepCompletions.get(i - 1);

    if (previousTime === undefined) {
      lapTimes.push(0);
    } else {
      const lapTime = Math.round((completionTime - previousTime) / 1000);
      lapTimes.push(Math.max(0, lapTime)); // Ensure non-negative
    }
  }

  return lapTimes;
}

/**
 * Aggregate metrics (reps and cardio distances) from steps.
 *
 * Only cardio distances count toward total distance.
 * Station reps count toward total reps.
 */
export function aggregateMetrics(steps: WorkoutStep[]): {
  totalReps: number;
  totalDistance: number;
} {
  let totalReps = 0;
  let totalDistance = 0;

  steps.forEach(step => {
    if (step.unit === 'reps') {
      totalReps += step.value;
    }
    // Only count cardio distances, not station distances
    if (step.unit === 'm' && step.kind === 'cardio') {
      totalDistance += step.value;
    }
  });

  return { totalReps, totalDistance };
}

/**
 * Finalize a complete workout result from components.
 *
 * Combines lap times, metrics, and step info into the final result structure.
 */
export function finalizeResult(
  steps: WorkoutStep[],
  lapTimes: number[],
  totalTimeSeconds: number,
  metrics: { totalReps: number; totalDistance: number }
): WorkoutResult {
  const completions = steps.map((step, index) => ({
    stepId: step.id,
    label: step.label,
    kind: step.kind,
    lapTimeSeconds: lapTimes[index] || 0,
    reps: step.unit === 'reps' ? step.value : undefined,
    distance: step.unit === 'm' ? step.value : undefined,
  }));

  return {
    completions,
    totalTimeSeconds,
    totalReps: metrics.totalReps,
    totalDistance: metrics.totalDistance,
    stationLapTimes: {},
  };
}

/**
 * Orchestrator: calculate complete result in one call.
 *
 * This combines the three functions for callers that want a simple interface.
 */
export function calculateWorkoutResult(
  workout: Workout,
  stepCompletions: Map<number, number>,
  workoutStartTime: number,
  totalTimeSeconds: number
): WorkoutResult {
  const lapTimes = calculateLapTimes(workout.totalSteps, stepCompletions, workoutStartTime);
  const metrics = aggregateMetrics(workout.steps);
  return finalizeResult(workout.steps, lapTimes, totalTimeSeconds, metrics);
}
