import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useWorkoutTimer } from '@/hooks/use-workout-timer';
import { formatTime } from '@/utils/workout-timer';

const PRESETS = [30, 60, 90, 120];

export default function HomeScreen() {
  const theme = useTheme();
  const [durationInput, setDurationInput] = useState('60');
  const [inputError, setInputError] = useState<string | null>(null);

  const { remainingSeconds, status, isRunning, start, pause, reset, setDuration, setDurationFromInput } =
    useWorkoutTimer({ initialSeconds: 60 });

  function handleApplyDuration() {
    const applied = setDurationFromInput(durationInput);
    if (!applied) {
      setInputError('Enter seconds (e.g. 90) or mm:ss (e.g. 1:30)');
      return;
    }

    setInputError(null);
  }

  function handlePreset(seconds: number) {
    setDuration(seconds);
    setDurationInput(String(seconds));
    setInputError(null);
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Workout Timer
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Set your rest interval and start the countdown
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.timerCard}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {status === 'finished' ? 'Done' : isRunning ? 'Resting' : 'Ready'}
          </ThemedText>
          <ThemedText style={styles.timerDisplay}>{formatTime(remainingSeconds)}</ThemedText>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Custom time
          </ThemedText>
          <ThemedView style={styles.durationRow}>
            <ThemedView type="backgroundElement" style={styles.durationInputWrap}>
              <TextInput
                value={durationInput}
                onChangeText={setDurationInput}
                placeholder="60 or 1:30"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numbers-and-punctuation"
                style={[styles.input, { color: theme.text }]}
                editable={!isRunning}
              />
            </ThemedView>
            <Pressable
              onPress={handleApplyDuration}
              disabled={isRunning}
              style={({ pressed }) => [
                styles.secondaryButton,
                { backgroundColor: theme.backgroundSelected },
                isRunning && styles.buttonDisabled,
                pressed && !isRunning && styles.buttonPressed,
              ]}>
              <ThemedText type="smallBold">Set</ThemedText>
            </Pressable>
          </ThemedView>
          {inputError ? (
            <ThemedText type="small" style={styles.errorText}>
              {inputError}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            Quick presets
          </ThemedText>
          <ThemedView style={styles.presets}>
            {PRESETS.map((seconds) => (
              <Pressable
                key={seconds}
                onPress={() => handlePreset(seconds)}
                disabled={isRunning}
                style={({ pressed }) => [
                  styles.presetButton,
                  { backgroundColor: theme.backgroundSelected },
                  isRunning && styles.buttonDisabled,
                  pressed && !isRunning && styles.buttonPressed,
                ]}>
                <ThemedText type="smallBold">{formatTime(seconds)}</ThemedText>
              </Pressable>
            ))}
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.controls}>
          {!isRunning ? (
            <Pressable
              onPress={start}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                {status === 'finished' ? 'Restart' : status === 'paused' ? 'Resume' : 'Start'}
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={pause}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}>
              <ThemedText type="smallBold" style={styles.primaryButtonText}>
                Pause
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={reset}
            style={({ pressed }) => [
              styles.secondaryButton,
              styles.resetButton,
              { backgroundColor: theme.backgroundSelected },
              pressed && styles.buttonPressed,
            ]}>
            <ThemedText type="smallBold">Reset</ThemedText>
          </Pressable>
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    gap: Spacing.three,
    justifyContent: 'center',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  title: {
    fontSize: 36,
    lineHeight: 40,
  },
  subtitle: {
    marginBottom: Spacing.one,
  },
  timerCard: {
    alignItems: 'center',
    borderRadius: Spacing.four,
    gap: Spacing.two,
    paddingVertical: Spacing.five,
  },
  timerDisplay: {
    fontSize: 72,
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    lineHeight: 80,
  },
  section: {
    gap: Spacing.two,
  },
  durationRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  durationInputWrap: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  presetButton: {
    borderRadius: Spacing.three,
    minWidth: 72,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  controls: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: Spacing.three,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  resetButton: {
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#E5484D',
  },
});
