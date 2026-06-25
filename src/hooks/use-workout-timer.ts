import { useCallback, useEffect, useRef, useState } from 'react';

type UseWorkoutTimerOptions = {
  onComplete?: () => void;
};

export function useWorkoutTimer({ onComplete }: UseWorkoutTimerOptions = {}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  return {
    remainingSeconds: elapsedSeconds,
    isRunning,
    start,
    pause,
    reset,
  };
}
