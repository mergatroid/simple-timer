export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function parseDurationInput(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(':')) {
    const [minutesPart, secondsPart] = trimmed.split(':');
    const minutes = Number(minutesPart);
    const seconds = Number(secondsPart);

    if (
      !Number.isInteger(minutes) ||
      !Number.isInteger(seconds) ||
      minutes < 0 ||
      seconds < 0 ||
      seconds >= 60
    ) {
      return null;
    }

    const total = minutes * 60 + seconds;
    return total > 0 ? total : null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

export function tickTimer(remainingSeconds: number): number {
  return Math.max(0, remainingSeconds - 1);
}

export function getTimerStatus(
  remainingSeconds: number,
  isRunning: boolean,
  hasStarted: boolean,
): TimerStatus {
  if (remainingSeconds <= 0 && hasStarted) {
    return 'finished';
  }

  if (isRunning) {
    return 'running';
  }

  if (hasStarted) {
    return 'paused';
  }

  return 'idle';
}
