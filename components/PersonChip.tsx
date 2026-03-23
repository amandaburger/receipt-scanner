import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { Participant } from '../lib/types';

interface Props {
  participant: Participant;
  selected?: boolean;
  onPress: () => void;
}

export function PersonChip({ participant, selected, onPress }: Props) {
  const initials = participant.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.initials, selected && styles.selectedText]}>{initials}</Text>
      <Text style={[styles.name, selected && styles.selectedText]} numberOfLines={1}>
        {participant.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1.5, borderColor: 'transparent',
    marginRight: 8,
  },
  selected: { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
  initials: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#D1D5DB',
    textAlign: 'center', lineHeight: 24, fontSize: 11, fontWeight: '600', color: '#374151',
  },
  selectedText: { color: '#1D4ED8' },
  name: { fontSize: 14, color: '#374151', maxWidth: 80 },
});
