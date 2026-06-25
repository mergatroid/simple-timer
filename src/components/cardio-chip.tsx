import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';

type CardioChipProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
};

export function CardioChip({ label, isSelected, onPress }: CardioChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: isSelected ? theme.accent : theme.backgroundElement,
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
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 8,
    marginHorizontal: Spacing.two,
    marginVertical: Spacing.one,
  },
  label: {
    textAlign: 'center',
  },
});
