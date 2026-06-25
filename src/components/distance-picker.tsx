import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';

type DistancePickerProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (metres: number) => void;
};

export function DistancePicker({ label, value, min, max, step, onChange }: DistancePickerProps) {
  const theme = useTheme();

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View
        style={[
          styles.picker,
          {
            backgroundColor: theme.backgroundElement,
          },
        ]}
      >
        <Pressable
          onPress={handleDecrement}
          style={[
            styles.button,
            {
              borderRightColor: theme.textSecondary,
            },
          ]}
        >
          <ThemedText type="title" themeColor="text">
            −
          </ThemedText>
        </Pressable>
        <View style={styles.display}>
          <ThemedText type="title" themeColor="text">
            {value}m
          </ThemedText>
        </View>
        <Pressable
          onPress={handleIncrement}
          style={[
            styles.button,
            {
              borderLeftColor: theme.textSecondary,
            },
          ]}
        >
          <ThemedText type="title" themeColor="text">
            +
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.two,
  },
  picker: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: Spacing.two,
  },
  button: {
    flex: 0.2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRightWidth: 1,
    borderLeftWidth: 1,
  },
  display: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
});
