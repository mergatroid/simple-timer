import { WorkoutConfig, PresetId, EffortScale, PairingRule, StationId, CardioType } from './types';
import { PRESETS, PRESET_STATION_COUNTS } from './presets';
import { STATION_IDS } from './stations';
import { CARDIO_TYPES } from './cardio';

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
      ...initialConfig,
    };

    this.validate(); // Check initial state
  }

  /**
   * Current configuration (immutable snapshot).
   */
  get config(): WorkoutConfig {
    return { ...this._config };
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
   * Validates immediately. Throws on invalid state.
   */
  updateConfig(field: keyof WorkoutConfig, value: any): void {
    // Type-check based on field
    switch (field) {
      case 'selectedStations':
        if (!Array.isArray(value)) throw new Error('selectedStations must be an array');
        this._config.selectedStations = value as StationId[];
        break;

      case 'selectedCardioTypes':
        if (!Array.isArray(value)) throw new Error('selectedCardioTypes must be an array');
        this._config.selectedCardioTypes = value as CardioType[];
        break;

      case 'effortScale':
        if (!['full', 'half', 'quarter'].includes(value))
          throw new Error('Invalid effort scale');
        this._config.effortScale = value as EffortScale;
        break;

      case 'pairingRule':
        if (!['before', 'after', 'random'].includes(value))
          throw new Error('Invalid pairing rule');
        this._config.pairingRule = value as PairingRule;
        break;

      case 'runDistanceMode':
        if (!['fixed', 'range'].includes(value)) throw new Error('Invalid distance mode');
        this._config.runDistanceMode = value as 'fixed' | 'range';
        break;

      case 'runDistanceFixed':
        if (typeof value !== 'number' || value <= 0)
          throw new Error('runDistanceFixed must be positive');
        this._config.runDistanceFixed = value;
        break;

      case 'runDistanceMin':
        if (typeof value !== 'number' || value <= 0)
          throw new Error('runDistanceMin must be positive');
        this._config.runDistanceMin = value;
        break;

      case 'runDistanceMax':
        if (typeof value !== 'number' || value <= 0)
          throw new Error('runDistanceMax must be positive');
        this._config.runDistanceMax = value;
        break;

      default:
        throw new Error(`Unknown config field: ${field}`);
    }

    // Validate after update
    this.validate();

    if (!this.isValid) {
      throw new Error(`Config validation failed: ${this._validationError}`);
    }
  }

  /**
   * Toggle a station on/off.
   */
  toggleStation(stationId: StationId): void {
    const idx = this._config.selectedStations.indexOf(stationId);
    if (idx > -1) {
      this._config.selectedStations.splice(idx, 1);
    } else {
      this._config.selectedStations.push(stationId);
    }
    this.validate();
    if (!this.isValid) {
      throw new Error(`Config validation failed: ${this._validationError}`);
    }
  }

  /**
   * Toggle a cardio type on/off.
   */
  toggleCardioType(cardioType: CardioType): void {
    const idx = this._config.selectedCardioTypes.indexOf(cardioType);
    if (idx > -1) {
      this._config.selectedCardioTypes.splice(idx, 1);
    } else {
      this._config.selectedCardioTypes.push(cardioType);
    }
    this.validate();
    if (!this.isValid) {
      throw new Error(`Config validation failed: ${this._validationError}`);
    }
  }

  /**
   * Apply a preset (beginner/intermediate/advanced).
   * Overwrites configuration with preset values.
   */
  applyPreset(presetId: PresetId): void {
    const preset = PRESETS[presetId];
    if (!preset) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    // Get recommended station count for this preset
    const stationCount = PRESET_STATION_COUNTS[presetId];

    // Select first N stations
    this._config.selectedStations = STATION_IDS.slice(0, stationCount) as StationId[];
    this._config.effortScale = preset.effortScale;
    this._config.selectedCardioTypes = [preset.cardioType];
    this._config.pairingRule = preset.pairingRule;

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
   * Check if current configuration is valid.
   * Sets validationError. Returns true if valid.
   */
  private validate(): boolean {
    // Must have at least 3 stations
    if (this._config.selectedStations.length < 3) {
      this._validationError = 'Must select at least 3 stations';
      return false;
    }

    // Must have at least 1 cardio type
    if (this._config.selectedCardioTypes.length === 0) {
      this._validationError = 'Must select at least 1 cardio type';
      return false;
    }

    // If using range mode, min < max
    if (
      this._config.runDistanceMode === 'range' &&
      this._config.runDistanceMin >= this._config.runDistanceMax
    ) {
      this._validationError = 'Distance range: min must be less than max';
      return false;
    }

    this._validationError = null;
    return true;
  }
}
