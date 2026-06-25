import { Workout, WorkoutStep, WorkoutResult, StepCompletion } from './types';

export interface WorkoutState {
  readonly currentStepIndex: number;
  readonly currentStep: WorkoutStep | null;
  readonly elapsedSeconds: number;
  readonly isRunning: boolean;
  readonly isFinished: boolean;
  readonly workoutResult: WorkoutResult | null;
  readonly progress: number;
}

/**
 * WorkoutPlayback is a deep state machine that owns the complete workout execution flow.
 * It manages step progression, timing, and result aggregation.
 *
 * Interface is small (3 commands): startStep, advanceStep, finishWorkout.
 * Implementation is large: timing bookkeeping, state transitions, result calculation.
 *
 * This is a domain module, not a React hook. It's fully testable without rendering.
 */
export class WorkoutPlayback {
  private currentStepIndex = 0;
  private elapsedSeconds = 0;
  private isRunning = false;
  private isFinished = false;
  private workoutResult: WorkoutResult | null = null;
  private workoutStartTime: number | null = null;
  private stepCompletionTimes: Map<number, number> = new Map(); // step index -> completion timestamp
  private timerIntervalId: NodeJS.Timeout | null = null;

  constructor(private workout: Workout) {
    if (!workout || workout.steps.length === 0) {
      throw new Error('WorkoutPlayback requires a valid workout with steps');
    }
  }

  /**
   * Immutable snapshot of current state.
   */
  get state(): WorkoutState {
    return {
      currentStepIndex: this.currentStepIndex,
      currentStep: this.workout.steps[this.currentStepIndex] || null,
      elapsedSeconds: this.elapsedSeconds,
      isRunning: this.isRunning,
      isFinished: this.isFinished,
      workoutResult: this.workoutResult,
      progress: this.currentStepIndex / this.workout.totalSteps,
    };
  }

  /**
   * Start the timer for the current step.
   * Can be called on any step; typically called after advancing to prepare the next step.
   */
  startStep(): void {
    if (this.isFinished) {
      throw new Error('Cannot start a step after workout is finished');
    }

    if (this.isRunning) {
      return; // Already running
    }

    // Record workout start time on first step
    if (this.workoutStartTime === null) {
      this.workoutStartTime = Date.now();
    }

    this.isRunning = true;
    this.startTimer();
  }

  /**
   * Advance to the next step and record the completion time of the current step.
   * Only call if canAdvance() returns true (caller's responsibility).
   */
  advanceStep(): void {
    if (this.isFinished) {
      throw new Error('Cannot advance after workout is finished');
    }

    if (!this.isRunning) {
      throw new Error('Cannot advance while step is not running. Call startStep() first.');
    }

    // Record completion time for current step
    this.recordStepCompletion(this.currentStepIndex);

    // Stop timer
    this.stopTimer();
    this.elapsedSeconds = 0;
    this.isRunning = false;

    // Move to next step
    this.currentStepIndex += 1;

    // If we've reached the end, mark as finished
    if (this.currentStepIndex >= this.workout.totalSteps) {
      this.isFinished = true;
      this.finishWorkoutInternal();
    }
  }

  /**
   * Finish the workout immediately and calculate results.
   * Used when user explicitly ends the workout early.
   */
  finishWorkout(): void {
    if (this.isFinished) {
      return; // Already finished
    }

    // If we're in the middle of a step, record it
    if (this.isRunning && this.currentStepIndex < this.workout.totalSteps) {
      this.recordStepCompletion(this.currentStepIndex);
      this.stopTimer();
    }

    this.isRunning = false;
    this.isFinished = true;
    this.finishWorkoutInternal();
  }

  /**
   * Check if the current step can be advanced.
   * Component must check this before calling advanceStep().
   */
  canAdvance(): boolean {
    return this.isRunning && !this.isFinished;
  }

  /**
   * Check if we're on the last step.
   */
  isOnLastStep(): boolean {
    return this.currentStepIndex === this.workout.totalSteps - 1;
  }

  /**
   * Cleanup: stop any running timer.
   */
  cleanup(): void {
    this.stopTimer();
  }

  // === Private Implementation ===

  private recordStepCompletion(stepIndex: number): void {
    const now = Date.now();
    this.stepCompletionTimes.set(stepIndex, now);
  }

  private finishWorkoutInternal(): void {
    this.stopTimer();
    this.workoutResult = this.calculateResults();
  }

  private calculateResults(): WorkoutResult {
    if (this.workoutStartTime === null) {
      throw new Error('Workout never started');
    }

    const totalTimeSeconds = Math.floor(this.elapsedSeconds);
    let totalReps = 0;
    let totalDistance = 0;

    const completions = this.workout.steps.map((step, index) => {
      if (step.unit === 'reps') {
        totalReps += step.value;
      }
      if (step.unit === 'm' && step.kind === 'cardio') {
        totalDistance += step.value;
      }

      const completionTime = this.stepCompletionTimes.get(index);
      let lapTimeSeconds = 0;

      if (completionTime !== undefined) {
        // First step: time from workout start
        // Subsequent steps: time from previous step completion
        const previousTime =
          index === 0 ? this.workoutStartTime : this.stepCompletionTimes.get(index - 1);

        if (previousTime !== undefined) {
          lapTimeSeconds = Math.round((completionTime - previousTime) / 1000);
        }
      }

      return {
        stepId: step.id,
        label: step.label,
        kind: step.kind,
        lapTimeSeconds,
        reps: step.unit === 'reps' ? step.value : undefined,
        distance: step.unit === 'm' ? step.value : undefined,
      };
    });

    return {
      completions,
      totalTimeSeconds,
      totalReps,
      totalDistance,
      stationLapTimes: {},
    };
  }

  private startTimer(): void {
    this.timerIntervalId = setInterval(() => {
      this.elapsedSeconds += 1;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
  }
}
