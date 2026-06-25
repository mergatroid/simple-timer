import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { ThemedText } from './themed-text';
import { StationId } from '@/domain/types';

type StationCardProps = {
  stationId: StationId;
  label: string;
  metric: string;
  isSelected: boolean;
  onPress: () => void;
};

export function StationCard({ label, metric, isSelected, onPress }: StationCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? '#B2DFDB' : theme.backgroundElement,
          borderColor: isSelected ? 'transparent' : '#BDBDBD',
          borderWidth: isSelected ? 0 : 2,
        },
      ]}
    >
      <View style={styles.content}>
        <ThemedText
          type="smallBold"
          themeColor="text"
          style={styles.label}
        >
          {label}
        </ThemedText>
        <ThemedText
          type="small"
          themeColor={isSelected ? 'text' : 'textSecondary'}
        >
          {metric}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    padding: Spacing.three,
    borderRadius: 8,
    marginHorizontal: '1%',
    marginVertical: Spacing.two,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    marginBottom: Spacing.one,
    textAlign: 'center',
    flexShrink: 1,
  },
});
