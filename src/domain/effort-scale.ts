import { EffortScale } from './types';

/**
 * EffortScale is a deep pure utility module that handles effort scaling calculations.
 * Single source of truth for effort multipliers and rounding rules.
 *
 * This module eliminates duplication between the generation layer (generate-workout.ts)
 * and the UI layer (index.tsx), which were independently calculating scaled values.
 *
 * Interface: 2 pure functions
 * Implementation: multiplier logic + rounding strategy
 */

/**
 * Get the multiplier for an effort scale.
 *
 * @example
 * getMultiplier('full')   // 1.0
 * getMultiplier('half')   // 0.5
 * getMultiplier('quarter') // 0.25
 */
export function getMultiplier(scale: EffortScale): number {
  switch (scale) {
    case 'full':
      return 1.0;
    case 'half':
      return 0.5;
    case 'quarter':
      return 0.25;
    default:
      throw new Error(`Unknown effort scale: ${scale}`);
  }
}

/**
 * Apply an effort scale to a value, with rounding.
 *
 * Rounding rule: Round to nearest 5 (e.g., 47 → 45, 48 → 50)
 * This ensures nice round numbers for user-facing values.
 *
 * @example
 * applyScale(100, 'full')    // 100
 * applyScale(100, 'half')    // 50
 * applyScale(100, 'quarter') // 25
 * applyScale(47, 'full')     // 45 (rounded to nearest 5)
 */
export function applyScale(value: number, scale: EffortScale): number {
  const multiplier = getMultiplier(scale);
  const scaled = value * multiplier;
  // Round to nearest 5
  return Math.ceil(scaled / 5) * 5;
}

/**
 * Get the scale label for display (e.g., "Full" for 'full').
 */
export function getScaleLabel(scale: EffortScale): string {
  switch (scale) {
    case 'full':
      return 'Full';
    case 'half':
      return 'Half';
    case 'quarter':
      return 'Quarter';
    default:
      throw new Error(`Unknown effort scale: ${scale}`);
  }
}
