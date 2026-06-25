import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { WorkoutStep } from '@/domain/types';

type WorkoutStepDisplayProps = {
  step: WorkoutStep;
  variant: 'current' | 'upcoming';
};

export function WorkoutStepDisplay({ step, variant }: WorkoutStepDisplayProps) {
  const theme = useTheme();

  if (variant === 'current') {
    return (
      <ThemedView
        type="backgroundElement"
        style={[
          styles.currentCard,
          {
            borderWidth: 2,
            borderColor: theme.accent,
          },
        ]}
      >
        <View style={styles.badge}>
          <ThemedText
            type="small"
            themeColor="accentText"
            style={{
              backgroundColor: theme.accent,
              paddingHorizontal: Spacing.two,
              paddingVertical: Spacing.one,
              borderRadius: 4,
            }}
          >
            {step.kind === 'station' ? 'STATION' : 'CARDIO'}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" themeColor="text" style={styles.label}>
          {step.label}
        </ThemedText>
        <ThemedText type="title" themeColor="text" style={styles.value}>
          {step.displayValue}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.upcomingCard, { marginBottom: Spacing.two }]}
    >
      <View style={styles.upcomingBadge}>
        <ThemedText
          type="small"
          themeColor="accentText"
          style={{
            backgroundColor: theme.accent,
            paddingHorizontal: Spacing.two,
            paddingVertical: Spacing.one,
            borderRadius: 4,
          }}
        >
          {step.kind === 'station' ? 'STATION' : 'CARDIO'}
        </ThemedText>
      </View>
      <ThemedText type="subtitle" themeColor="text" style={styles.upcomingLabel}>
        {step.label}
      </ThemedText>
      <ThemedText type="body" themeColor="text" style={styles.upcomingValue}>
        {step.displayValue}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  currentCard: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    borderRadius: 12,
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    alignItems: 'center',
  },
  badge: {
    marginBottom: Spacing.three,
  },
  label: {
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  value: {
    textAlign: 'center',
  },
  upcomingCard: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 8,
    marginHorizontal: Spacing.three,
    alignItems: 'flex-start',
  },
  upcomingBadge: {
    marginBottom: Spacing.two,
  },
  upcomingLabel: {
    marginBottom: Spacing.one,
  },
  upcomingValue: {
    marginTop: Spacing.one,
  },
});
