import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Item } from '../lib/types';

interface Props {
  item: Item;
  isAssigned: boolean;
  assigneeCount: number;
  onToggle: () => void;
  onLongPress: () => void;
}

export function ItemRow({ item, isAssigned, assigneeCount, onToggle, onLongPress }: Props) {
  const isLowConfidence = item.confidence < 0.75;
  const swipeableRef = React.useRef<Swipeable>(null);

  function handleSwipe() {
    onToggle();
    setTimeout(() => swipeableRef.current?.close(), 300);
  }

  const renderRightActions = () =>
    !isAssigned ? (
      <View style={[styles.swipeAction, styles.swipeAssign]}>
        <Text style={styles.swipeText}>Assign</Text>
      </View>
    ) : null;

  const renderLeftActions = () =>
    isAssigned ? (
      <View style={[styles.swipeAction, styles.swipeUnassign]}>
        <Text style={styles.swipeText}>Remove</Text>
      </View>
    ) : null;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      onSwipeableOpen={handleSwipe}
      friction={2}
    >
      <TouchableOpacity
        onPress={onToggle}
        onLongPress={onLongPress}
        style={[styles.row, isLowConfidence && styles.lowConfidence]}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isAssigned && styles.checkboxChecked]}>
          {isAssigned && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>{item.name || 'Item'}</Text>
          {assigneeCount > 1 && (
            <Text style={styles.shared}>÷ {assigneeCount} people</Text>
          )}
          {isLowConfidence && (
            <Text style={styles.confidenceWarning}>Review — low confidence</Text>
          )}
        </View>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, backgroundColor: '#FFF', gap: 12,
  },
  lowConfidence: { backgroundColor: '#FFFBEB' },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  checkmark: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  nameCol: { flex: 1 },
  name: { fontSize: 15, color: '#111827' },
  shared: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  confidenceWarning: { fontSize: 11, color: '#D97706', marginTop: 2 },
  price: { fontSize: 15, fontWeight: '600', color: '#111827' },
  swipeAction: {
    justifyContent: 'center', alignItems: 'center',
    width: 80, marginVertical: 1,
  },
  swipeAssign:   { backgroundColor: '#16A34A' },
  swipeUnassign: { backgroundColor: '#DC2626' },
  swipeText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
});
