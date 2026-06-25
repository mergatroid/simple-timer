import { Workout } from './types';

let _current: Workout | null = null;

export function setCurrentWorkout(w: Workout): void {
  _current = w;
}

export function getCurrentWorkout(): Workout | null {
  return _current;
}

export function clearCurrentWorkout(): void {
  _current = null;
}
