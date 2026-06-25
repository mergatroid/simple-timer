import { WorkoutResult } from '@/domain/types';
import { formatTime } from './workout-timer';

export function formatWorkoutForSharing(workoutResult: WorkoutResult): string {
  const lines: string[] = [
    '🏋️ WODFather Workout Complete! 💪',
    '',
    '⏱️ Total Time: ' + formatTime(workoutResult.totalTimeSeconds),
  ];

  if (workoutResult.totalDistance > 0) {
    lines.push('📏 Total Distance: ' + workoutResult.totalDistance + 'm');
  }

  if (workoutResult.totalReps > 0) {
    lines.push('🔁 Total Reps: ' + workoutResult.totalReps);
  }

  if (workoutResult.completions.length > 0) {
    lines.push('');
    lines.push('Splits:');
    workoutResult.completions.forEach((completion) => {
      lines.push('  • ' + completion.label + ': ' + formatTime(completion.lapTimeSeconds));
    });
  }

  lines.push('');
  lines.push('Generated with WODFather');

  return lines.join('\n');
}
