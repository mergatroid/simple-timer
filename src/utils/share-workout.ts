import { WorkoutResult, Workout, StepCompletion } from '@/domain/types';
import { formatTime } from './workout-timer';

export function formatCompletionMetric(completion: StepCompletion): string {
  return completion.reps ? `${completion.reps} reps` : completion.distance ? `${completion.distance}m` : '';
}

export function formatWorkoutForSharing(workoutResult: WorkoutResult): string {
  const lines: string[] = [
    'wodfish Workout Complete!',
    '',
    'Total Time: ' + formatTime(workoutResult.totalTimeSeconds),
  ];

  if (workoutResult.totalDistance > 0) {
    lines.push('Total Distance: ' + workoutResult.totalDistance + 'm');
  }

  if (workoutResult.totalReps > 0) {
    lines.push('Total Reps: ' + workoutResult.totalReps);
  }

  if (workoutResult.completions.length > 0) {
    lines.push('');
    lines.push('Splits:');
    workoutResult.completions.forEach((completion) => {
      const metric = formatCompletionMetric(completion);
      const name = completion.label.padEnd(35);
      const metricPadded = metric.padStart(15);
      const time = formatTime(completion.lapTimeSeconds).padStart(10);
      const splitLine = `${name}${metricPadded}${time}`;
      lines.push(splitLine);
    });
  }

  lines.push('');
  lines.push('Generated with wodfish');

  return lines.join('\n');
}

export function formatGeneratedWorkoutForSharing(workout: Workout): string {
  const lines: string[] = [
    'wodfish Workout',
    '',
    'Exercises:',
  ];

  workout.steps.forEach((step, index) => {
    const type = step.kind === 'cardio' ? 'Cardio' : 'Station';
    lines.push(`${index + 1}. [${type}] ${step.label} - ${step.displayValue}`);
  });

  lines.push('');
  lines.push('Ready to crush it!');
  lines.push('');
  lines.push('Generated with wodfish');

  return lines.join('\n');
}
