import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Modal,
  StyleSheet, Alert, Share, Clipboard
} from 'react-native';
import { router } from 'expo-router';
import { ProgressStepper } from '../components/ProgressStepper';
import { useAppStore } from '../store/useAppStore';
import { calculateSplit } from '../lib/calculateSplit';
import type { PersonResult } from '../lib/calculateSplit';

export default function ResultsScreen() {
  const { items, participants, assigned, tax, tip, covers, setCover, reset, setStep } = useAppStore();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [coverModal, setCoverModal] = useState<string | null>(null);

  const results = calculateSplit(items, participants, assigned, tax, tip);
  const grandTotal = results.reduce((sum, r) => sum + getDisplayTotal(r), 0);

  function getDisplayTotal(r: PersonResult): number {
    const coverer = covers[r.participant.id];
    if (coverer) return 0;
    const covering = participants
      .filter(p => covers[p.id] === r.participant.id)
      .map(p => results.find(x => x.participant.id === p.id)!.total);
    return r.total + covering.reduce((s, t) => s + t, 0);
  }

  function buildShareText(): string {
    const lines = ['💸 Bill Split', ''];
    results.forEach(r => {
      const total = getDisplayTotal(r);
      const coveredBy = covers[r.participant.id];
      const covering = participants.filter(p => covers[p.id] === r.participant.id).map(p => p.name);
      if (coveredBy) {
        const covererName = participants.find(p => p.id === coveredBy)?.name ?? '';
        lines.push(`${r.participant.name}: $0.00 (covered by ${covererName})`);
      } else if (covering.length > 0) {
        lines.push(`${r.participant.name}: $${total.toFixed(2)} (covering ${covering.join(', ')})`);
      } else {
        lines.push(`${r.participant.name}: $${total.toFixed(2)}`);
      }
    });
    return lines.join('\n');
  }

  async function handleShare() {
    const text = buildShareText();
    try {
      const result = await Share.share({ message: text, title: 'Bill Split Results' });
      if (result.action === Share.dismissedAction) return;
    } catch {
      // Fallback: copy to clipboard and alert the user
      Clipboard.setString(text);
      Alert.alert('Copied!', 'Results copied to clipboard — paste anywhere to share.');
    }
  }

  function showHelp() {
    Alert.alert(
      'How to read results',
      'Tap a person\'s name to see their full breakdown: each item they ordered, their share of tax and tip, and their total.',
      [{ text: 'Got it' }]
    );
  }

  function handleReset() {
    Alert.alert(
      'Start a new split?',
      'This will clear everything.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start over', style: 'destructive', onPress: () => { reset(); setStep(1); router.replace('/'); } },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressStepper current={6} />
      <FlatList
        data={results}
        keyExtractor={r => r.participant.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>Results</Text>
              <TouchableOpacity onPress={showHelp} style={styles.helpBtn}>
                <Text style={styles.helpBtnText}>?</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={handleShare}>
              <Text style={styles.shareBtn}>Share</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: r }) => {
          const isCovered = !!covers[r.participant.id];
          const covererName = participants.find(p => p.id === covers[r.participant.id])?.name;
          const isExpanded = expanded === r.participant.id;
          const displayTotal = getDisplayTotal(r);

          return (
            <View style={styles.card}>
              <TouchableOpacity
                onPress={() => setExpanded(isExpanded ? null : r.participant.id)}
                style={styles.cardHeader}
              >
                <Text style={styles.personName}>{r.participant.name}</Text>
                <Text style={[styles.personTotal, isCovered && styles.zeroed]}>
                  ${displayTotal.toFixed(2)}
                </Text>
              </TouchableOpacity>

              {isCovered && (
                <Text style={styles.coveredNote}>Covered by {covererName}</Text>
              )}

              {isExpanded && (
                <View style={styles.breakdown}>
                  {r.items.map(({ item, amount, fraction }) => (
                    <View key={item.id} style={styles.bRow}>
                      <Text style={styles.bName}>
                        {item.name}{fraction < 1 ? ` (÷${Math.round(1/fraction)})` : ''}
                      </Text>
                      <Text style={styles.bAmount}>${amount.toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={styles.divider} />
                  <View style={styles.bRow}>
                    <Text style={styles.bLabel}>Subtotal</Text>
                    <Text style={styles.bAmount}>${r.subtotal.toFixed(2)}</Text>
                  </View>
                  {tax > 0 && (
                    <View style={styles.bRow}>
                      <Text style={styles.bLabel}>Tax</Text>
                      <Text style={styles.bAmount}>${r.tax.toFixed(2)}</Text>
                    </View>
                  )}
                  {tip > 0 && (
                    <View style={styles.bRow}>
                      <Text style={styles.bLabel}>Tip</Text>
                      <Text style={styles.bAmount}>${r.tip.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={[styles.bRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${r.total.toFixed(2)}</Text>
                  </View>
                </View>
              )}

              {!isCovered && (
                <TouchableOpacity onPress={() => setCoverModal(r.participant.id)}>
                  <Text style={styles.coverLink}>Cover someone →</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <View style={{ gap: 12 }}>
            <View style={styles.grandTotalCard}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>${grandTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Text style={styles.resetBtnText}>Start over</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={!!coverModal} transparent animationType="slide" onRequestClose={() => setCoverModal(null)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setCoverModal(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {participants.find(p => p.id === coverModal)?.name} is covering:
            </Text>
            {results
              .filter(r => r.participant.id !== coverModal)
              .map(r => {
                const alreadyCoveredByOther = covers[r.participant.id] && covers[r.participant.id] !== coverModal;
                const isCovering = covers[r.participant.id] === coverModal;
                return (
                  <TouchableOpacity
                    key={r.participant.id}
                    style={[styles.coverRow, alreadyCoveredByOther && styles.coverRowDisabled]}
                    disabled={!!alreadyCoveredByOther}
                    onPress={() => setCover(r.participant.id, isCovering ? null : coverModal!)}
                  >
                    <View style={[styles.coverCheck, isCovering && styles.coverChecked]}>
                      {isCovering && <Text style={{ color: '#FFF' }}>✓</Text>}
                    </View>
                    <Text style={styles.coverName}>{r.participant.name}</Text>
                    <Text style={styles.coverAmount}>${r.total.toFixed(2)}</Text>
                  </TouchableOpacity>
                );
              })}
            <TouchableOpacity style={styles.modalDone} onPress={() => setCoverModal(null)}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  helpBtn: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5,
    borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center',
  },
  helpBtnText: { fontSize: 12, color: '#6B7280', fontWeight: '700', lineHeight: 14 },
  shareBtn: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  grandTotalCard: {
    backgroundColor: '#EFF6FF', borderRadius: 14, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#1D4ED8' },
  grandTotalValue: { fontSize: 22, fontWeight: '700', color: '#1D4ED8' },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  personName: { fontSize: 18, fontWeight: '600', color: '#111827' },
  personTotal: { fontSize: 22, fontWeight: '700', color: '#059669' },
  zeroed: { color: '#9CA3AF' },
  coveredNote: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  breakdown: { marginTop: 12, gap: 6 },
  bRow: { flexDirection: 'row', justifyContent: 'space-between' },
  bName: { fontSize: 14, color: '#374151', flex: 1 },
  bLabel: { fontSize: 14, color: '#6B7280' },
  bAmount: { fontSize: 14, color: '#111827', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  totalRow: { marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 15, fontWeight: '700', color: '#059669' },
  coverLink: { fontSize: 13, color: '#2563EB', marginTop: 10 },
  resetBtn: { marginTop: 8, padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: '#EF4444' },
  resetBtnText: { color: '#EF4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  coverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  coverRowDisabled: { opacity: 0.4 },
  coverCheck: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center',
  },
  coverChecked: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  coverName: { flex: 1, fontSize: 16, color: '#111827' },
  coverAmount: { fontSize: 15, fontWeight: '600', color: '#374151' },
  modalDone: { backgroundColor: '#2563EB', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  modalDoneText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
