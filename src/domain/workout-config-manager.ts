import { WorkoutConfig, PresetId, EffortScale, PairingRule, StationId, CardioType } from './types';
import { PRESETS, PRESET_STATION_COUNTS } from './presets';
import { STATION_IDS } from './stations';

/**
 * WorkoutConfigManager is a deep module that consolidates all configuration management logic.
 * Replaces 14 separate callbacks from the old useWodWorkout hook with a single updateConfig interface.
 *
 * Owns:
 * - Configuration state
 * - Validation rules
 * - Preset application
 * - Constraint enforcement (minimum selections, etc.)
 *
 * Interface: small and uniform (updateConfig, applyPreset, validate)
 * Implementation: validation logic, preset expansion, constraint checking
 */

export class WorkoutConfigManager {
  private _config: WorkoutConfig;
  private _validationError: string | null = null;

  constructor(initialConfig?: Partial<WorkoutConfig>) {
    this._config = {
      selectedStations: [],
      selectedCardioTypes: [],
      effortScale: 'full',
      pairingRule: 'random',
      runDistanceMode: 'fixed',
      runDistanceFixed: 400,
      runDistanceMin: 200,
      runDistanceMax: 800,
      preset: undefined,
      ...initialConfig,
    };

    // Apply intermediate preset by default for better UX (pre-selects stations and cardio)
    if (!initialConfig?.selectedStations || initialConfig.selectedStations.length === 0) {
      this.applyPreset('intermediate');
    } else {
      this.validate(); // Check initial state
    }
  }

  /**
   * Current configuration (immutable snapshot with deep copies of arrays).
   */
  get config(): WorkoutConfig {
    return {
      ...this._config,
      selectedStations: [...this._config.selectedStations],
      selectedCardioTypes: [...this._config.selectedCardioTypes],
    };
  }

  /**
   * Most recent validation error, or null if valid.
   */
  get validationError(): string | null {
    return this._validationError;
  }

  /**
   * Check if config is valid.
   */
  get isValid(): boolean {
    return this._validationError === null;
  }

  /**
   * Update a single configuration field.
   * Validates immediately. Silently ignores invalid updates instead of throwing.
   */
  updateConfig(field: keyof WorkoutConfig, value: any): void {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      return;
    }

    // Type-check based on field
    switch (field) {
      case 'selectedStations':
        if (!Array.isArray(value)) return;
        this._config.selectedStations = value as StationId[];
        break;

      case 'selectedCardioTypes':
        if (!Array.isArray(value)) return;
        this._config.selectedCardioTypes = value as CardioType[];
        break;

      case 'effortScale':
        if (!['full', 'half', 'quarter'].includes(value)) return;
        this._config.effortScale = value as EffortScale;
        break;

      case 'pairingRule':
        if (!['before', 'after', 'random'].includes(value)) return;
        this._config.pairingRule = value as PairingRule;
        break;

      case 'runDistanceMode':
        if (!['fixed', 'range'].includes(value)) return;
        this._config.runDistanceMode = value as 'fixed' | 'range';
        break;

      case 'runDistanceFixed':
        if (typeof value !== 'number' || value <= 0) return;
        this._config.runDistanceFixed = value;
        break;

      case 'runDistanceMin':
        if (typeof value !== 'number' || value <= 0) return;
        this._config.runDistanceMin = value;
        break;

      case 'runDistanceMax':
        if (typeof value !== 'number' || value <= 0) return;
        this._config.runDistanceMax = value;
        break;

      case 'preset':
        // Allow any preset value or undefined
        this._config.preset = value as PresetId | undefined;
        break;

      default:
        return; // Ignore unknown fields
    }

    // Always validate after update
    this.validate();
  }

  /**
   * Toggle a station on/off.
   * Silently ignores toggle if it would make config invalid.
   */
  toggleStation(stationId: StationId): void {
    const idx = this._config.selectedStations.indexOf(stationId);
    const newStations = idx > -1
      ? this._config.selectedStations.filter(s => s !== stationId)
      : [...this._config.selectedStations, stationId];

    // Test new state before committing
    const testConfig = { ...this._config, selectedStations: newStations };
    const error = this.getValidationError(testConfig);

    if (error) {
      // Silently ignore - don't allow operations that would make config invalid
      return;
    }

    this._config.selectedStations = newStations;
  }

  /**
   * Toggle a cardio type on/off.
   * Silently ignores toggle if it would make config invalid.
   */
  toggleCardioType(cardioType: CardioType): void {
    const idx = this._config.selectedCardioTypes.indexOf(cardioType);
    const newCardioTypes = idx > -1
      ? this._config.selectedCardioTypes.filter(c => c !== cardioType)
      : [...this._config.selectedCardioTypes, cardioType];

    // Test new state before committing
    const testConfig = { ...this._config, selectedCardioTypes: newCardioTypes };
    const error = this.getValidationError(testConfig);

    if (error) {
      // Silently ignore - don't allow operations that would make config invalid
      return;
    }

    this._config.selectedCardioTypes = newCardioTypes;
  }

  /**
   * Apply a preset (beginner/intermediate/advanced).
   * Overwrites configuration with preset values and sets default cardio type.
   */
  applyPreset(presetId: PresetId): void {
    const preset = PRESETS[presetId];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    // Get recommended station count for this preset (random between min and max)
    const [minStations, maxStations] = PRESET_STATION_COUNTS[presetId];
    const stationCount = Math.floor(Math.random() * (maxStations - minStations + 1)) + minStations;

    // Apply preset config, select N stations, and default to 'run' cardio type
    this._config = {
      ...this._config,
      ...preset.config,
      selectedStations: STATION_IDS.slice(0, stationCount) as StationId[],
      selectedCardioTypes: ['run'],
      preset: presetId,
    };

    this.validate();
  }

  /**
   * Reset to default configuration.
   */
  reset(): void {
    this._config = {
      selectedStations: [],
      selectedCardioTypes: [],
      effortScale: 'full',
      pairingRule: 'random',
      runDistanceMode: 'fixed',
      runDistanceFixed: 400,
      runDistanceMin: 200,
      runDistanceMax: 800,
    };
    this.validate();
  }

  /**
   * Check if a config is valid and return the error message if invalid.
   * Pure function - no side effects.
   */
  private getValidationError(config: WorkoutConfig): string | null {
    // Must have at least 3 stations
    if (config.selectedStations.length < 3) {
      return 'Must select at least 3 stations';
    }

    // Must have at least 1 cardio type
    if (config.selectedCardioTypes.length === 0) {
      return 'Must select at least 1 cardio type';
    }

    // If using range mode, min < max
    if (
      config.runDistanceMode === 'range' &&
      config.runDistanceMin >= config.runDistanceMax
    ) {
      return 'Distance range: min must be less than max';
    }

    return null;
  }

  /**
   * Check if current configuration is valid.
   * Sets validationError. Returns true if valid.
   */
  private validate(): boolean {
    this._validationError = this.getValidationError(this._config);
    return this._validationError === null;
  }
}
