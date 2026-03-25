import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export function BackHint() {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.back()}
      accessibilityLabel="Go back"
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.chevron}>‹</Text>
      <Text style={styles.label}>Back</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  chevron: {
    fontSize: 28,
    color: '#007AFF',
    lineHeight: 28,
    marginRight: 2,
  },
  label: {
    fontSize: 16,
    color: '#007AFF',
  },
});
