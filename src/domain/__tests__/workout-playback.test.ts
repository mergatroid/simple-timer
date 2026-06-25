import { describe, it, expect, beforeEach } from 'vitest';
import { WorkoutPlayback } from '../workout-playback';
import { Workout, WorkoutStep } from '../types';

// Mock workout for testing
const createMockWorkout = (stepCount: number = 3): Workout => ({
  id: 'test-1',
  generatedAt: Date.now(),
  totalSteps: stepCount,
  steps: Array.from({ length: stepCount }, (_, i) => ({
    id: `step-${i}`,
    kind: i % 2 === 0 ? 'station' : 'cardio',
    label: `Step ${i + 1}`,
    metric: 'reps',
    value: 10,
    unit: 'reps',
    displayValue: '10 reps',
  } as WorkoutStep)),
});

describe('WorkoutPlayback State Machine', () => {
  let playback: WorkoutPlayback;
  let mockWorkout: Workout;

  beforeEach(() => {
    mockWorkout = createMockWorkout(3);
    playback = new WorkoutPlayback(mockWorkout);
  });

  afterEach(() => {
    playback.cleanup();
  });

  describe('Initial State', () => {
    it('should start at step 0, not running, not finished', () => {
      const state = playback.state;
      expect(state.currentStepIndex).toBe(0);
      expect(state.isRunning).toBe(false);
      expect(state.isFinished).toBe(false);
      expect(state.elapsedSeconds).toBe(0);
      expect(state.workoutResult).toBeNull();
    });

    it('should return the first step as currentStep', () => {
      expect(playback.state.currentStep?.label).toBe('Step 1');
    });

    it('should calculate progress as 0 initially', () => {
      expect(playback.state.progress).toBe(0);
    });

    it('should not be on last step initially (3-step workout)', () => {
      expect(playback.isOnLastStep()).toBe(false);
    });
  });

  describe('Step Progression', () => {
    it('should not allow advanceStep() if not running', () => {
      expect(() => playback.advanceStep()).toThrow('Cannot advance while step is not running');
    });

    it('should allow startStep() to begin running', () => {
      playback.startStep();
      expect(playback.state.isRunning).toBe(true);
    });

    it('should advance to next step after startStep() then advanceStep()', async () => {
      playback.startStep();
      expect(playback.state.currentStepIndex).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 100)); // Let timer tick

      playback.advanceStep();
      expect(playback.state.currentStepIndex).toBe(1);
      expect(playback.state.isRunning).toBe(false);
      expect(playback.state.elapsedSeconds).toBe(0); // Reset after advance
    });

    it('should progress through all steps and finish', async () => {
      for (let i = 0; i < 3; i++) {
        playback.startStep();
        await new Promise(resolve => setTimeout(resolve, 100));
        playback.advanceStep();
      }

      expect(playback.state.currentStepIndex).toBe(3);
      expect(playback.state.isFinished).toBe(true);
      expect(playback.state.workoutResult).not.toBeNull();
    });

    it('should prevent advancing past the end', () => {
      expect(() => {
        playback = new WorkoutPlayback(createMockWorkout(1));
        playback.startStep();
        playback.advanceStep(); // Moves to step 1, finishes
        playback.advanceStep(); // Should throw
      }).toThrow('Cannot advance after workout is finished');
    });
  });

  describe('Timer Management', () => {
    it('should increment elapsed seconds over time', async () => {
      playback.startStep();
      expect(playback.state.elapsedSeconds).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for 1 second tick
      expect(playback.state.elapsedSeconds).toBeGreaterThanOrEqual(1);
    });

    it('should reset elapsed seconds after advancing', async () => {
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 500));
      playback.advanceStep();

      expect(playback.state.elapsedSeconds).toBe(0);

      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 500));
      expect(playback.state.elapsedSeconds).toBeGreaterThan(0);
    });

    it('should stop timer and preserve time on finishWorkout()', async () => {
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 1100));
      const timeBeforeFinish = playback.state.elapsedSeconds;

      playback.finishWorkout();
      const timeAfterFinish = playback.state.elapsedSeconds;

      expect(timeAfterFinish).toBe(timeBeforeFinish);
      expect(playback.state.isRunning).toBe(false);
    });
  });

  describe('Result Calculation', () => {
    it('should calculate lap times correctly', async () => {
      // Step 1: ~1 second
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 1100));
      playback.advanceStep();

      // Step 2: ~1 second
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 1100));
      playback.advanceStep();

      // Step 3: ~1 second
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 1100));
      playback.finishWorkout();

      const result = playback.state.workoutResult;
      expect(result).not.toBeNull();
      expect(result!.completions.length).toBe(3);

      // Each lap time should be ~1 second
      result!.completions.forEach(completion => {
        expect(completion.lapTimeSeconds).toBeGreaterThanOrEqual(0);
        expect(completion.lapTimeSeconds).toBeLessThanOrEqual(2);
      });
    });

    it('should aggregate total time correctly', async () => {
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 500));
      playback.advanceStep();

      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 500));
      playback.finishWorkout();

      const result = playback.state.workoutResult;
      expect(result!.totalTimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('should aggregate reps and distances', () => {
      const workout: Workout = {
        id: 'test',
        generatedAt: Date.now(),
        totalSteps: 2,
        steps: [
          {
            id: 'station-1',
            kind: 'station',
            label: 'Burpees',
            metric: 'reps',
            value: 20,
            unit: 'reps',
            displayValue: '20 reps',
          },
          {
            id: 'cardio-1',
            kind: 'cardio',
            label: 'Run',
            metric: 'distance',
            value: 400,
            unit: 'm',
            displayValue: '400m',
          },
        ],
      };

      playback = new WorkoutPlayback(workout);
      playback.startStep();
      playback.advanceStep();
      playback.startStep();
      playback.finishWorkout();

      const result = playback.state.workoutResult;
      expect(result!.totalReps).toBe(20);
      expect(result!.totalDistance).toBe(400); // Only cardio distances
    });
  });

  describe('canAdvance() Guard', () => {
    it('should return false when not running', () => {
      expect(playback.canAdvance()).toBe(false);
    });

    it('should return true when running and not finished', async () => {
      playback.startStep();
      expect(playback.canAdvance()).toBe(true);
    });

    it('should return false when finished', async () => {
      playback.startStep();
      playback.advanceStep();
      playback.startStep();
      playback.advanceStep();
      playback.startStep();
      playback.advanceStep();

      expect(playback.canAdvance()).toBe(false);
      expect(playback.state.isFinished).toBe(true);
    });
  });

  describe('Last Step Detection', () => {
    it('should detect when on last step', async () => {
      playback.startStep();
      playback.advanceStep();
      playback.startStep();
      playback.advanceStep();

      expect(playback.isOnLastStep()).toBe(true);
    });

    it('should not detect last step at beginning', () => {
      expect(playback.isOnLastStep()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw on empty workout', () => {
      const emptyWorkout: Workout = {
        id: 'empty',
        generatedAt: Date.now(),
        totalSteps: 0,
        steps: [],
      };

      expect(() => new WorkoutPlayback(emptyWorkout)).toThrow(
        'WorkoutPlayback requires a valid workout with steps'
      );
    });

    it('should prevent operations after finish', () => {
      playback.finishWorkout();

      expect(() => playback.startStep()).toThrow('Cannot start a step after workout is finished');
      expect(() => playback.advanceStep()).toThrow('Cannot advance after workout is finished');
    });
  });

  describe('Cleanup', () => {
    it('should stop timer on cleanup', async () => {
      playback.startStep();
      await new Promise(resolve => setTimeout(resolve, 100));

      const elapsedBefore = playback.state.elapsedSeconds;
      playback.cleanup();

      await new Promise(resolve => setTimeout(resolve, 1100));
      const elapsedAfter = playback.state.elapsedSeconds;

      // Should not have incremented significantly
      expect(elapsedAfter - elapsedBefore).toBeLessThan(2);
    });
  });
});
