import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { WorkoutStep } from '@/domain/types';

type WorkoutListProps = {
  steps: WorkoutStep[];
  currentIndex: number;
};

export function WorkoutList({ steps, currentIndex }: WorkoutListProps) {
  const theme = useTheme();

  // Group steps into pairs (each pair is 2 consecutive steps)
  const pairs = [];
  for (let i = 0; i < steps.length; i += 2) {
    pairs.push([steps[i], steps[i + 1]].filter(Boolean));
  }

  return (
    <ScrollView style={styles.container} scrollEnabled nestedScrollEnabled>
      <View style={styles.grid}>
        {pairs.map((pair, pairIndex) => (
          <View key={pairIndex} style={styles.row}>
            {pair.map((step, stepInPairIndex) => {
              const stepIndex = pairIndex * 2 + stepInPairIndex;
              const isCurrent = stepIndex === currentIndex;
              const isNext = stepIndex === currentIndex + 1;

              if (isCurrent) {
                return (
                  <ThemedView
                    key={step.id}
                    type="backgroundElement"
                    style={[
                      styles.stepCell,
                      {
                        backgroundColor: theme.accent,
                        borderWidth: 2,
                        borderColor: theme.accent,
                      },
                    ]}
                  >
                    <View style={styles.stepContent}>
                      {step.kind === 'cardio' && (
                        <Text style={[styles.icon, { color: theme.accentText, fontSize: 14 }]}>♥</Text>
                      )}
                      <View>
                        <ThemedText
                          type="smallBold"
                          themeColor="accentText"
                          style={styles.stepLabel}
                        >
                          {step.label}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          themeColor="accentText"
                          style={styles.stepValue}
                        >
                          {step.displayValue}
                        </ThemedText>
                      </View>
                    </View>
                  </ThemedView>
                );
              }

              if (isNext) {
                return (
                  <ThemedView
                    key={step.id}
                    type="backgroundElement"
                    style={[
                      styles.stepCell,
                      {
                        borderWidth: 2,
                        borderColor: theme.accent,
                        borderStyle: 'dashed',
                      },
                    ]}
                  >
                    <View style={styles.stepContent}>
                      {step.kind === 'cardio' && (
                        <Text style={[styles.icon, { color: theme.accent, fontSize: 14 }]}>♥</Text>
                      )}
                      <View>
                        <ThemedText
                          type="smallBold"
                          style={[styles.stepLabel, { color: theme.accent }]}
                        >
                          {step.label}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          themeColor="textSecondary"
                          style={styles.stepValue}
                        >
                          {step.displayValue}
                        </ThemedText>
                      </View>
                    </View>
                  </ThemedView>
                );
              }

              return (
                <ThemedView
                  key={step.id}
                  type="backgroundElement"
                  style={[
                    styles.stepCell,
                    {
                      borderWidth: 1,
                      borderColor: theme.inactive,
                    },
                  ]}
                >
                  <View style={styles.stepContent}>
                    {step.kind === 'cardio' && (
                      <Text style={[styles.icon, { color: theme.inactive, fontSize: 14 }]}>♥</Text>
                    )}
                    <View>
                      <ThemedText type="small" themeColor="text" style={styles.stepLabel}>
                        {step.label}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.stepValue}>
                        {step.displayValue}
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  stepCell: {
    flex: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 60,
  },
  stepContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  icon: {
    marginTop: 2,
    flexShrink: 0,
  },
  stepLabel: {
    marginBottom: Spacing.one,
  },
  stepValue: {
    fontSize: 12,
  },
});
