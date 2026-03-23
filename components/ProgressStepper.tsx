import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  current: number; // 1–6
  total?: number;
}

const LABELS = ['Scan', 'Review', 'People', 'Assign', 'Tip', 'Results'];

export function ProgressStepper({ current, total = 6 }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[styles.segment, i < current ? styles.filled : styles.empty]}
          />
        ))}
      </View>
      <Text style={styles.label}>Step {current} of {total} — {LABELS[current - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  track: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  filled: { backgroundColor: '#2563EB' },
  empty:  { backgroundColor: '#E5E7EB' },
  label:  { fontSize: 12, color: '#6B7280', textAlign: 'center' },
});
