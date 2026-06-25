import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardioChip } from '@/components/cardio-chip';
import { DistancePicker } from '@/components/distance-picker';
import { PresetChip } from '@/components/preset-chip';
import { StationCard } from '@/components/station-card';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { CARDIO_DEFS, CARDIO_TYPES } from '@/domain/cardio';
import { STATION_DEFS, STATION_IDS } from '@/domain/stations';
import { setCurrentWorkout } from '@/domain/workout-store';
import { useTheme } from '@/hooks/use-theme';
import { useWodWorkout } from '@/hooks/use-wod-workout';

export default function ConfigureScreen() {
  const theme = useTheme();
  const {
    config,
    isValid,
    validationError,
    applyPreset,
    toggleStation,
    toggleCardio,
    setEffortScale,
    setPairingRule,
    setRunDistanceMode,
    setRunDistanceFixed,
    setRunDistanceRange,
    generate,
  } = useWodWorkout();


  const handleGenerate = () => {
    if (!isValid) return;
    const workout = generate();
    setCurrentWorkout(workout);
    router.push('/workout');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleWrapper}>
          <ThemedText type="title" style={styles.title}>
            wod
          </ThemedText>
          <ThemedText type="title" style={[styles.title, { color: theme.accent }]}>
            fish
          </ThemedText>
        </View>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Hyrox Workout Generator
        </ThemedText>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Difficulty
          </ThemedText>
          <View style={styles.presetRow}>
            <PresetChip
              label="Beginner"
              isSelected={config.preset === 'beginner'}
              onPress={() => applyPreset('beginner')}
            />
            <PresetChip
              label="Intermediate"
              isSelected={config.preset === 'intermediate'}
              onPress={() => applyPreset('intermediate')}
            />
            <PresetChip
              label="Advanced"
              isSelected={config.preset === 'advanced'}
              onPress={() => applyPreset('advanced')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Metrics Scale
          </ThemedText>
          <View style={styles.presetRow}>
            <PresetChip
              label="Full"
              isSelected={config.effortScale === 'full'}
              onPress={() => setEffortScale('full')}
            />
            <PresetChip
              label="1/2"
              isSelected={config.effortScale === 'half'}
              onPress={() => setEffortScale('half')}
            />
            <PresetChip
              label="1/4"
              isSelected={config.effortScale === 'quarter'}
              onPress={() => setEffortScale('quarter')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Stations (min 3)
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {config.selectedStations.length} selected
            </ThemedText>
          </View>
          <View style={styles.stationGrid}>
            {STATION_IDS.map((stationId) => {
              const def = STATION_DEFS[stationId];
              const multiplier = config.effortScale === 'full' ? 1.0 : config.effortScale === 'half' ? 0.5 : 0.25;
              const scaledValue = Math.ceil((def.fullValue * multiplier) / 5) * 5;
              const metricDisplay = `${scaledValue}${def.unit}`;
              return (
                <StationCard
                  key={stationId}
                  stationId={stationId}
                  label={def.label}
                  metric={metricDisplay}
                  isSelected={config.selectedStations.includes(stationId)}
                  onPress={() => toggleStation(stationId)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Cardio Elements
          </ThemedText>
          <View style={styles.cardioRow}>
            {CARDIO_TYPES.map((type) => {
              const def = CARDIO_DEFS[type];
              return (
                <CardioChip
                  key={type}
                  label={def.label}
                  isSelected={config.selectedCardioTypes.includes(type)}
                  onPress={() => toggleCardio(type)}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Run Distance
          </ThemedText>
          <View style={styles.segmentControl}>
            <Pressable
              onPress={() => setRunDistanceMode('fixed')}
              style={[
                styles.segmentButton,
                styles.segmentButtonLeft,
                {
                  backgroundColor: config.runDistanceMode === 'fixed' ? theme.accent : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText themeColor={config.runDistanceMode === 'fixed' ? 'accentText' : 'text'}>
                Fixed
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setRunDistanceMode('range')}
              style={[
                styles.segmentButton,
                styles.segmentButtonRight,
                {
                  backgroundColor: config.runDistanceMode === 'range' ? theme.accent : theme.backgroundElement,
                },
              ]}
            >
              <ThemedText themeColor={config.runDistanceMode === 'range' ? 'accentText' : 'text'}>
                Range
              </ThemedText>
            </Pressable>
          </View>
          {config.runDistanceMode === 'fixed' ? (
            <DistancePicker
              label="Distance"
              value={config.runDistanceFixed}
              min={100}
              max={2000}
              step={100}
              onChange={setRunDistanceFixed}
            />
          ) : (
            <>
              <DistancePicker
                label="Min Distance"
                value={config.runDistanceMin}
                min={100}
                max={config.runDistanceMax}
                step={100}
                onChange={(min) => setRunDistanceRange(min, config.runDistanceMax)}
              />
              <DistancePicker
                label="Max Distance"
                value={config.runDistanceMax}
                min={config.runDistanceMin}
                max={2000}
                step={100}
                onChange={(max) => setRunDistanceRange(config.runDistanceMin, max)}
              />
            </>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Pairing
          </ThemedText>
          <View style={styles.presetRow}>
            <PresetChip
              label="Before"
              isSelected={config.pairingRule === 'before'}
              onPress={() => setPairingRule('before')}
            />
            <PresetChip
              label="After"
              isSelected={config.pairingRule === 'after'}
              onPress={() => setPairingRule('after')}
            />
            <PresetChip
              label="Random"
              isSelected={config.pairingRule === 'random'}
              onPress={() => setPairingRule('random')}
            />
          </View>
        </View>

        {validationError && (
          <ThemedText style={[styles.errorText, { color: theme.danger }]}>
            {validationError}
          </ThemedText>
        )}

        <Pressable
          onPress={handleGenerate}
          disabled={!isValid}
          style={({ pressed }) => [
            styles.generateButton,
            {
              backgroundColor: isValid ? theme.accent : theme.backgroundElement,
              opacity: pressed && isValid ? 0.9 : 1,
            },
          ]}
        >
          <ThemedText
            type="smallBold"
            themeColor={isValid ? 'accentText' : 'textSecondary'}
            style={styles.generateButtonText}
          >
            GENERATE WORKOUT
          </ThemedText>
        </Pressable>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five,
  },
  titleWrapper: {
    flexDirection: 'row',
  },
  title: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  subtitle: {
    marginBottom: Spacing.four,
  },
  section: {
    marginBottom: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 0,
  },
  stationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  segmentControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: Spacing.two,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  errorText: {
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  generateButton: {
    paddingVertical: Spacing.three,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  generateButtonText: {
    letterSpacing: 1,
  },
  spacer: {
    height: Spacing.five,
  },
});
