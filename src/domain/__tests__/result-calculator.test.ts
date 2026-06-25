import { describe, it, expect } from 'vitest';
import {
  calculateLapTimes,
  aggregateMetrics,
  finalizeResult,
  calculateWorkoutResult,
} from '../result-calculator';
import { Workout, WorkoutStep } from '../types';

const mockSteps = (count: number): WorkoutStep[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `step-${i}`,
    kind: i % 2 === 0 ? ('station' as const) : ('cardio' as const),
    label: `Step ${i + 1}`,
    metric: 'reps',
    value: 10 + i,
    unit: 'reps' as const,
    displayValue: `${10 + i} reps`,
  }));

const mockWorkout = (stepCount: number): Workout => ({
  id: 'test',
  generatedAt: Date.now(),
  totalSteps: stepCount,
  steps: mockSteps(stepCount),
});

describe('WorkoutResultCalculator', () => {
  describe('calculateLapTimes', () => {
    it('should return zeros for uncompleted steps', () => {
      const completions = new Map<number, number>();
      const startTime = 1000;

      const lapTimes = calculateLapTimes(3, completions, startTime);

      expect(lapTimes).toEqual([0, 0, 0]);
    });

    it('should calculate first step from workout start', () => {
      const startTime = 1000;
      const completions = new Map<number, number>([[0, 2000]]); // 1 second later

      const lapTimes = calculateLapTimes(1, completions, startTime);

      expect(lapTimes[0]).toBe(1);
    });

    it('should calculate subsequent steps from previous step', () => {
      const startTime = 1000;
      const completions = new Map<number, number>([
        [0, 2000], // +1s
        [1, 4000], // +2s
        [2, 5000], // +1s
      ]);

      const lapTimes = calculateLapTimes(3, completions, startTime);

      expect(lapTimes).toEqual([1, 2, 1]);
    });

    it('should handle rounding', () => {
      const startTime = 1000;
      const completions = new Map<number, number>([
        [0, 1500], // 500ms → 0s (rounds down)
        [1, 3200], // 1700ms → 2s
      ]);

      const lapTimes = calculateLapTimes(2, completions, startTime);

      expect(lapTimes[0]).toBe(1); // 500ms rounds to 1s
      expect(lapTimes[1]).toBe(2); // 1700ms rounds to 2s
    });

    it('should ensure non-negative times', () => {
      const startTime = 2000;
      const completions = new Map<number, number>([[0, 1000]]); // Before start (shouldn't happen)

      const lapTimes = calculateLapTimes(1, completions, startTime);

      expect(lapTimes[0]).toBe(0); // Clamped to 0
    });

    it('should handle missing intermediate steps', () => {
      const startTime = 1000;
      const completions = new Map<number, number>([
        [0, 2000],
        // [1] missing
        [2, 4000],
      ]);

      const lapTimes = calculateLapTimes(3, completions, startTime);

      expect(lapTimes[0]).toBe(1); // Present
      expect(lapTimes[1]).toBe(0); // Missing
      expect(lapTimes[2]).toBe(0); // Can't calculate from missing previous
    });
  });

  describe('aggregateMetrics', () => {
    it('should sum all reps from station steps', () => {
      const steps: WorkoutStep[] = [
        {
          id: '1',
          kind: 'station',
          label: 'Burpees',
          metric: 'reps',
          value: 20,
          unit: 'reps',
          displayValue: '20 reps',
        },
        {
          id: '2',
          kind: 'station',
          label: 'Squats',
          metric: 'reps',
          value: 15,
          unit: 'reps',
          displayValue: '15 reps',
        },
      ];

      const { totalReps, totalDistance } = aggregateMetrics(steps);

      expect(totalReps).toBe(35);
      expect(totalDistance).toBe(0);
    });

    it('should sum only cardio distances, not station distances', () => {
      const steps: WorkoutStep[] = [
        {
          id: '1',
          kind: 'station',
          label: 'Farmers Carry',
          metric: 'distance',
          value: 100,
          unit: 'm',
          displayValue: '100m',
        },
        {
          id: '2',
          kind: 'cardio',
          label: 'Run',
          metric: 'distance',
          value: 400,
          unit: 'm',
          displayValue: '400m',
        },
        {
          id: '3',
          kind: 'cardio',
          label: 'Bike',
          metric: 'distance',
          value: 600,
          unit: 'm',
          displayValue: '600m',
        },
      ];

      const { totalReps, totalDistance } = aggregateMetrics(steps);

      expect(totalReps).toBe(0);
      expect(totalDistance).toBe(1000); // Only cardio: 400 + 600
    });

    it('should handle mixed reps and distances', () => {
      const steps: WorkoutStep[] = [
        {
          id: '1',
          kind: 'station',
          label: 'Burpees',
          metric: 'reps',
          value: 10,
          unit: 'reps',
          displayValue: '10 reps',
        },
        {
          id: '2',
          kind: 'cardio',
          label: 'Run',
          metric: 'distance',
          value: 500,
          unit: 'm',
          displayValue: '500m',
        },
      ];

      const { totalReps, totalDistance } = aggregateMetrics(steps);

      expect(totalReps).toBe(10);
      expect(totalDistance).toBe(500);
    });

    it('should return zeros for empty steps', () => {
      const { totalReps, totalDistance } = aggregateMetrics([]);

      expect(totalReps).toBe(0);
      expect(totalDistance).toBe(0);
    });
  });

  describe('finalizeResult', () => {
    it('should combine all result components', () => {
      const steps = mockSteps(2);
      const lapTimes = [10, 15];
      const metrics = { totalReps: 100, totalDistance: 500 };

      const result = finalizeResult(steps, lapTimes, 120, metrics);

      expect(result.completions).toHaveLength(2);
      expect(result.completions[0].lapTimeSeconds).toBe(10);
      expect(result.completions[1].lapTimeSeconds).toBe(15);
      expect(result.totalTimeSeconds).toBe(120);
      expect(result.totalReps).toBe(100);
      expect(result.totalDistance).toBe(500);
    });

    it('should include step metadata in completions', () => {
      const steps = mockSteps(1);
      steps[0].kind = 'station';
      steps[0].value = 20;

      const result = finalizeResult(steps, [5], 30, { totalReps: 20, totalDistance: 0 });

      expect(result.completions[0].stepId).toBe('step-0');
      expect(result.completions[0].label).toBe('Step 1');
      expect(result.completions[0].kind).toBe('station');
      expect(result.completions[0].reps).toBe(20);
    });
  });

  describe('calculateWorkoutResult (orchestrator)', () => {
    it('should calculate complete result in one call', () => {
      const workout = mockWorkout(2);
      const startTime = 1000;
      const completions = new Map<number, number>([
        [0, 2000], // +1s
        [1, 4000], // +2s
      ]);

      const result = calculateWorkoutResult(workout, completions, startTime, 30);

      expect(result.completions).toHaveLength(2);
      expect(result.completions[0].lapTimeSeconds).toBe(1);
      expect(result.completions[1].lapTimeSeconds).toBe(2);
      expect(result.totalTimeSeconds).toBe(30);
    });

    it('should aggregate metrics from workout steps', () => {
      const steps: WorkoutStep[] = [
        {
          id: '1',
          kind: 'station',
          label: 'Burpees',
          metric: 'reps',
          value: 20,
          unit: 'reps',
          displayValue: '20 reps',
        },
        {
          id: '2',
          kind: 'cardio',
          label: 'Run',
          metric: 'distance',
          value: 400,
          unit: 'm',
          displayValue: '400m',
        },
      ];

      const workout: Workout = {
        id: 'test',
        generatedAt: Date.now(),
        totalSteps: 2,
        steps,
      };

      const completions = new Map<number, number>([
        [0, 2000],
        [1, 3000],
      ]);

      const result = calculateWorkoutResult(workout, completions, 1000, 60);

      expect(result.totalReps).toBe(20);
      expect(result.totalDistance).toBe(400);
    });
  });

  describe('Edge cases', () => {
    it('should handle single-step workout', () => {
      const workout = mockWorkout(1);
      const startTime = 1000;
      const completions = new Map<number, number>([[0, 2000]]);

      const result = calculateWorkoutResult(workout, completions, startTime, 10);

      expect(result.completions).toHaveLength(1);
      expect(result.completions[0].lapTimeSeconds).toBe(1);
    });

    it('should handle workout with no completions', () => {
      const workout = mockWorkout(3);
      const startTime = 1000;
      const completions = new Map<number, number>();

      const result = calculateWorkoutResult(workout, completions, startTime, 0);

      expect(result.completions.every(c => c.lapTimeSeconds === 0)).toBe(true);
    });

    it('should handle very large workout', () => {
      const workout = mockWorkout(100);
      const startTime = 1000;
      const completions = new Map<number, number>();
      for (let i = 0; i < 100; i++) {
        completions.set(i, 1000 + (i + 1) * 1000);
      }

      const result = calculateWorkoutResult(workout, completions, startTime, 100000);

      expect(result.completions).toHaveLength(100);
      expect(result.completions.every(c => c.lapTimeSeconds === 1)).toBe(true);
    });
  });
});
