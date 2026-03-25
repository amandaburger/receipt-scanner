import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  FlatList, StyleSheet, Modal
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ProgressStepper } from '../components/ProgressStepper';
import { BackHint } from '../components/BackHint';
import { PersonChip } from '../components/PersonChip';
import { ItemRow } from '../components/ItemRow';
import { UndoSnackbar } from '../components/UndoSnackbar';
import { useAppStore } from '../store/useAppStore';
import { calculateSplit, getUnassignedItems } from '../lib/calculateSplit';

export default function AssignScreen() {
  const { items, participants, assigned, tax, tip, tipMode, toggleAssignment, splitEvenly, setStep } = useAppStore();
  const [selectedPersonId, setSelectedPersonId] = useState(participants[0]?.id ?? '');
  const [snackbar, setSnackbar] = useState<{ message: string; undo: () => void } | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [peekItem, setPeekItem] = useState<string | null>(null);

  const unassigned = getUnassignedItems(items, assigned);
  const canProceed = unassigned.length === 0;
  const selectedPerson = participants.find(p => p.id === selectedPersonId);

  const splitResults = calculateSplit(items, participants, assigned, tax, tip, tipMode);
  const personTotal = splitResults.find(r => r.participant.id === selectedPersonId)?.subtotal ?? 0;

  function handleToggle(itemId: string) {
    const wasAssigned = assigned[selectedPersonId]?.has(itemId);
    toggleAssignment(selectedPersonId, itemId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (wasAssigned) {
      const undo = () => toggleAssignment(selectedPersonId, itemId);
      setSnackbar({ message: `Removed from ${selectedPerson?.name} · `, undo });
      setShowSnackbar(true);
    }
  }

  function getAssigneeCount(itemId: string) {
    return Object.values(assigned).filter(s => s.has(itemId)).length;
  }

  function getAssigneeNames(itemId: string) {
    return participants
      .filter(p => assigned[p.id]?.has(itemId))
      .map(p => p.name)
      .join(', ');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressStepper current={4} />
      <BackHint />

      <View style={styles.header}>
        <Text style={styles.title}>Assign Items</Text>
        {unassigned.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unassigned.length} unassigned</Text>
          </View>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ padding: 12, gap: 8 }}>
        {participants.map(p => (
          <PersonChip
            key={p.id}
            participant={p}
            selected={p.id === selectedPersonId}
            onPress={() => setSelectedPersonId(p.id)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            isAssigned={assigned[selectedPersonId]?.has(item.id) ?? false}
            assigneeCount={getAssigneeCount(item.id)}
            onToggle={() => handleToggle(item.id)}
            onLongPress={() => setPeekItem(item.id)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{selectedPerson?.name ?? ''}'s subtotal</Text>
          <Text style={styles.totalValue}>${personTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.splitBtn}
          onPress={() => { splitEvenly(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
          disabled={participants.length < 2}
        >
          <Text style={styles.splitBtnText}>Split everything evenly</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={() => { setStep(5); router.push('/tip'); }}
          disabled={!canProceed}
        >
          <Text style={styles.nextBtnText}>
            {canProceed ? 'Choose tip →' : `${unassigned.length} item${unassigned.length > 1 ? 's' : ''} unassigned`}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={!!peekItem} transparent animationType="fade" onRequestClose={() => setPeekItem(null)}>
        <TouchableOpacity style={styles.peekOverlay} onPress={() => setPeekItem(null)}>
          <View style={styles.peekCard}>
            <Text style={styles.peekTitle}>
              {items.find(i => i.id === peekItem)?.name}
            </Text>
            <Text style={styles.peekBody}>
              {peekItem && getAssigneeNames(peekItem)
                ? `Assigned to: ${getAssigneeNames(peekItem)}`
                : 'Not assigned to anyone yet'}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <UndoSnackbar
        message={snackbar?.message ?? ''}
        visible={showSnackbar}
        onUndo={() => { snackbar?.undo(); setShowSnackbar(false); }}
        onDismiss={() => setShowSnackbar(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  badge: { backgroundColor: '#EF4444', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  chips: { maxHeight: 64, flexGrow: 0 },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  footer: { padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 15, color: '#6B7280' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  splitBtn: {
    borderWidth: 1.5, borderColor: '#2563EB', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  splitBtnText: { color: '#2563EB', fontWeight: '600' },
  nextBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#9CA3AF' },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  peekOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  peekCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '80%' },
  peekTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  peekBody: { fontSize: 15, color: '#374151' },
});
