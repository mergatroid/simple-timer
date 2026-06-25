import { describe, it, expect, beforeEach } from 'vitest';
import { WorkoutConfigManager } from '../workout-config-manager';

describe('WorkoutConfigManager', () => {
  let manager: WorkoutConfigManager;

  beforeEach(() => {
    manager = new WorkoutConfigManager();
  });

  describe('Initial State', () => {
    it('should start with empty config', () => {
      expect(manager.config.selectedStations).toEqual([]);
      expect(manager.config.selectedCardioTypes).toEqual([]);
    });

    it('should start invalid (no stations or cardio)', () => {
      expect(manager.isValid).toBe(false);
      expect(manager.validationError).toContain('Must select at least 3 stations');
    });

    it('should allow initialization with partial config', () => {
      const m = new WorkoutConfigManager({
        selectedStations: ['ski-erg', 'sled-push', 'rowing'],
        selectedCardioTypes: ['run'],
      });

      expect(m.isValid).toBe(true);
      expect(m.config.selectedStations).toHaveLength(3);
    });
  });

  describe('updateConfig', () => {
    it('should update a single field', () => {
      manager.updateConfig('effortScale', 'half');
      expect(manager.config.effortScale).toBe('half');
    });

    it('should throw on invalid effort scale', () => {
      expect(() => manager.updateConfig('effortScale', 'invalid')).toThrow(
        'Invalid effort scale'
      );
    });

    it('should throw on invalid pairingRule', () => {
      expect(() => manager.updateConfig('pairingRule', 'invalid')).toThrow(
        'Invalid pairing rule'
      );
    });

    it('should throw on invalid runDistanceMode', () => {
      expect(() => manager.updateConfig('runDistanceMode', 'invalid')).toThrow(
        'Invalid distance mode'
      );
    });

    it('should reject non-positive distance values', () => {
      expect(() => manager.updateConfig('runDistanceFixed', 0)).toThrow(
        'runDistanceFixed must be positive'
      );
      expect(() => manager.updateConfig('runDistanceFixed', -100)).toThrow(
        'runDistanceFixed must be positive'
      );
    });

    it('should reject invalid array types', () => {
      expect(() => manager.updateConfig('selectedStations', 'not-an-array')).toThrow(
        'selectedStations must be an array'
      );
    });
  });

  describe('toggleStation', () => {
    it('should add station when not present', () => {
      manager.toggleStation('ski-erg');
      expect(manager.config.selectedStations).toContain('ski-erg');
    });

    it('should remove station when present', () => {
      manager.toggleStation('ski-erg');
      manager.toggleStation('ski-erg');
      expect(manager.config.selectedStations).not.toContain('ski-erg');
    });

    it('should throw on invalid state after toggle', () => {
      manager.toggleStation('ski-erg');
      manager.toggleStation('sled-push');
      manager.toggleStation('rowing');

      // Valid now with 3 stations
      expect(manager.isValid).toBe(false); // No cardio type

      // Removing station should fail validation
      expect(() => manager.toggleStation('ski-erg')).toThrow('Config validation failed');
    });
  });

  describe('toggleCardioType', () => {
    it('should add cardio type when not present', () => {
      manager.toggleCardioType('run');
      expect(manager.config.selectedCardioTypes).toContain('run');
    });

    it('should remove cardio type when present', () => {
      manager.toggleCardioType('run');
      manager.toggleCardioType('run');
      expect(manager.config.selectedCardioTypes).not.toContain('run');
    });
  });

  describe('applyPreset', () => {
    it('should apply beginner preset', () => {
      manager.applyPreset('beginner');

      expect(manager.config.selectedStations).toHaveLength(4);
      expect(manager.config.selectedCardioTypes).toHaveLength(1);
      expect(manager.config.effortScale).toBe('quarter');
      expect(manager.isValid).toBe(true);
    });

    it('should apply intermediate preset', () => {
      manager.applyPreset('intermediate');

      expect(manager.config.selectedStations).toHaveLength(5);
      expect(manager.config.effortScale).toBe('half');
      expect(manager.isValid).toBe(true);
    });

    it('should apply advanced preset', () => {
      manager.applyPreset('advanced');

      expect(manager.config.selectedStations).toHaveLength(6);
      expect(manager.config.effortScale).toBe('full');
      expect(manager.isValid).toBe(true);
    });

    it('should throw on unknown preset', () => {
      expect(() => manager.applyPreset('unknown' as any)).toThrow('Unknown preset');
    });
  });

  describe('Validation Rules', () => {
    it('should require at least 3 stations', () => {
      manager.toggleStation('ski-erg');
      manager.toggleStation('sled-push');

      expect(manager.isValid).toBe(false);
      expect(manager.validationError).toContain('at least 3 stations');

      manager.toggleStation('rowing');
      // Still invalid without cardio
      expect(manager.isValid).toBe(false);
    });

    it('should require at least 1 cardio type', () => {
      manager.toggleStation('ski-erg');
      manager.toggleStation('sled-push');
      manager.toggleStation('rowing');

      expect(manager.isValid).toBe(false);
      expect(manager.validationError).toContain('at least 1 cardio type');
    });

    it('should validate distance range (min < max)', () => {
      manager.applyPreset('beginner');

      // Set invalid range
      expect(() =>
        manager.updateConfig('runDistanceMin', 800)
      ).toThrow('distance range');

      // Set valid range
      manager.updateConfig('runDistanceMin', 200);
      manager.updateConfig('runDistanceMax', 800);
      expect(manager.isValid).toBe(true);
    });

    it('should be valid when all constraints met', () => {
      manager.applyPreset('beginner');

      expect(manager.isValid).toBe(true);
      expect(manager.validationError).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to default empty config', () => {
      manager.applyPreset('advanced');
      expect(manager.config.selectedStations).toHaveLength(6);

      manager.reset();

      expect(manager.config.selectedStations).toEqual([]);
      expect(manager.config.selectedCardioTypes).toEqual([]);
      expect(manager.isValid).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should return immutable config snapshot', () => {
      manager.applyPreset('beginner');
      const config1 = manager.config;
      const config2 = manager.config;

      expect(config1).not.toBe(config2); // Different objects
      expect(config1).toEqual(config2); // But equal values

      // Modifying returned config shouldn't affect manager
      config1.selectedStations.push('burpee-broad-jumps');
      expect(manager.config.selectedStations).toHaveLength(4); // Unchanged
    });
  });

  describe('Complex Workflows', () => {
    it('should handle preset → manual tweaks → validation', () => {
      manager.applyPreset('beginner');
      expect(manager.isValid).toBe(true);

      manager.toggleStation('burpee-broad-jumps');
      expect(manager.config.selectedStations).toHaveLength(5);
      expect(manager.isValid).toBe(true);

      manager.toggleCardioType('bike');
      expect(manager.config.selectedCardioTypes).toHaveLength(2);
      expect(manager.isValid).toBe(true);
    });

    it('should handle edge case: valid → invalid → valid', () => {
      manager.applyPreset('intermediate');
      expect(manager.isValid).toBe(true);

      // Try to make invalid (too few cardio types) — should throw
      expect(() => manager.toggleCardioType(manager.config.selectedCardioTypes[0])).toThrow();

      // Should still be valid
      expect(manager.isValid).toBe(true);
    });
  });
});
