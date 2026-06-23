import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getTimerStatus,
  parseDurationInput,
  tickTimer,
  type TimerStatus,
} from '@/utils/workout-timer';

type UseWorkoutTimerOptions = {
  initialSeconds?: number;
  onComplete?: () => void;
};

export function useWorkoutTimer({ initialSeconds = 60, onComplete }: UseWorkoutTimerOptions = {}) {
  const [durationSeconds, setDurationSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const status: TimerStatus = getTimerStatus(remainingSeconds, isRunning, hasStarted);
  const onCompleteRef = useRef(onComplete);
  const hasAlertedRef = useRef(false);

  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (status === 'finished' && !hasAlertedRef.current) {
      hasAlertedRef.current = true;
      onCompleteRef.current?.();
    }

    if (status !== 'finished') {
      hasAlertedRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      setRemainingSeconds((current) => {
        const next = tickTimer(current);
        if (next === 0) {
          setIsRunning(false);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning, remainingSeconds]);

  const start = useCallback(() => {
    if (remainingSeconds <= 0) {
      setRemainingSeconds(durationSeconds);
    }
    setHasStarted(true);
    setIsRunning(true);
  }, [durationSeconds, remainingSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setHasStarted(false);
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  const setDurationFromInput = useCallback(
    (input: string) => {
      const parsed = parseDurationInput(input);
      if (parsed === null) {
        return false;
      }

      setDurationSeconds(parsed);
      setRemainingSeconds(parsed);
      setIsRunning(false);
      setHasStarted(false);
      return true;
    },
    [],
  );

  const setDuration = useCallback((seconds: number) => {
    const safeSeconds = Math.max(1, Math.floor(seconds));
    setDurationSeconds(safeSeconds);
    setRemainingSeconds(safeSeconds);
    setIsRunning(false);
    setHasStarted(false);
  }, []);

  return {
    durationSeconds,
    remainingSeconds,
    status,
    isRunning,
    start,
    pause,
    reset,
    setDuration,
    setDurationFromInput,
  };
}
