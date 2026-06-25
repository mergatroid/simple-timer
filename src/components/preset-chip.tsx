import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';

type PresetChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

export function PresetChip({ label, isSelected, onPress }: PresetChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.accent : theme.backgroundElement,
          borderColor: isSelected ? 'transparent' : '#BDBDBD',
          borderWidth: isSelected ? 0 : 1,
        },
      ]}
    >
      <ThemedText
        type="smallBold"
        themeColor={isSelected ? 'accentText' : 'text'}
        style={styles.label}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: Spacing.half,
  },
  label: {
    textAlign: 'center',
    flexShrink: 1,
  },
});
