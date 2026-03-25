import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  Switch, StyleSheet
} from 'react-native';
import { router } from 'expo-router';
import { ProgressStepper } from '../components/ProgressStepper';
import { BackHint } from '../components/BackHint';
import { useAppStore } from '../store/useAppStore';
import { getSubtotal } from '../lib/calculateSplit';

const TIP_PRESETS = [15, 18, 20, 25];

export default function TipScreen() {
  const { items, setTip, setTipMode, setStep } = useAppStore();
  const tipMode = useAppStore(s => s.tipMode);
  const liveTip = useAppStore(s => s.tip);
  const subtotal = getSubtotal(items);
  const [customPct, setCustomPct] = useState('');
  const [customDollar, setCustomDollar] = useState('');
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const receiptTip = React.useRef(liveTip).current;
  const hasReceiptTip = receiptTip > 0;

  function selectPreset(pct: number) {
    setSelectedPct(pct);
    setCustomPct('');
    setCustomDollar('');
    setTip(subtotal * (pct / 100));
  }

  function handleCustomPct(val: string) {
    setCustomPct(val);
    setCustomDollar('');
    setSelectedPct(null);
    const pct = parseFloat(val);
    if (!isNaN(pct)) setTip(subtotal * (pct / 100));
  }

  function handleCustomDollar(val: string) {
    setCustomDollar(val);
    setCustomPct('');
    setSelectedPct(null);
    const dollars = parseFloat(val);
    if (!isNaN(dollars)) setTip(dollars);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressStepper current={5} />
      <BackHint />
      <View style={styles.content}>
        <Text style={styles.title}>Add a Tip?</Text>
        <Text style={styles.subtitle}>Subtotal: ${subtotal.toFixed(2)}</Text>

        <View style={styles.presets}>
          {TIP_PRESETS.map(pct => (
            <TouchableOpacity
              key={pct}
              style={[styles.preset, selectedPct === pct && styles.presetSelected]}
              onPress={() => selectPreset(pct)}
            >
              <Text style={[styles.presetPct, selectedPct === pct && styles.presetTextSelected]}>
                {pct}%
              </Text>
              <Text style={[styles.presetDollar, selectedPct === pct && styles.presetTextSelected]}>
                ${(subtotal * pct / 100).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.customRow}>
          <Text style={styles.customLabel}>Custom %</Text>
          <TextInput
            style={styles.customInput}
            value={customPct}
            onChangeText={handleCustomPct}
            placeholder="0"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.customRow}>
          <Text style={styles.customLabel}>Custom $ amount</Text>
          <View style={styles.dollarInputWrapper}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.customInput}
              value={customDollar}
              onChangeText={handleCustomDollar}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {hasReceiptTip && (
          <TouchableOpacity
            style={styles.receiptTipBtn}
            onPress={() => { setSelectedPct(null); setCustomPct(''); setTip(receiptTip); }}
          >
            <Text style={styles.receiptTipText}>Use tip from receipt (${receiptTip.toFixed(2)})</Text>
          </TouchableOpacity>
        )}

        <View style={styles.splitToggle}>
          <Text style={styles.splitLabel}>Split tip evenly</Text>
          <Switch
            value={tipMode === 'even'}
            onValueChange={(v) => setTipMode(v ? 'even' : 'proportional')}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={tipMode === 'even' ? '#2563EB' : '#F3F4F6'}
          />
        </View>
        <Text style={styles.splitHint}>
          {tipMode === 'even' ? 'Tip split equally per person' : 'Tip split based on what each person ordered'}
        </Text>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>Tip: ${liveTip.toFixed(2)}</Text>
          {subtotal > 0 && liveTip > 0 && (
            <Text style={styles.summaryPct}>({(liveTip / subtotal * 100).toFixed(0)}%)</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => { setStep(6); router.push('/results'); }}
        >
          <Text style={styles.nextBtnText}>See Results →</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setTip(0); setStep(6); router.push('/results'); }}>
          <Text style={styles.skipLink}>No tip — skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6B7280' },
  presets: { flexDirection: 'row', gap: 8 },
  preset: {
    flex: 1, backgroundColor: '#FFF', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  presetSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  presetPct: { fontSize: 18, fontWeight: '700', color: '#111827' },
  presetDollar: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  presetTextSelected: { color: '#1D4ED8' },
  customRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customLabel: { fontSize: 15, color: '#374151' },
  dollarInputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  dollarSign: { fontSize: 16, color: '#374151' },
  customInput: {
    width: 80, textAlign: 'right', fontSize: 16, borderBottomWidth: 1.5,
    borderColor: '#D1D5DB', paddingVertical: 4,
  },
  splitToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFF', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4,
  },
  splitLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  splitHint: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  receiptTipBtn: {
    borderWidth: 1.5, borderColor: '#D97706', borderRadius: 10,
    padding: 12, alignItems: 'center', backgroundColor: '#FFFBEB',
  },
  receiptTipText: { color: '#92400E', fontWeight: '600' },
  summary: { flexDirection: 'row', gap: 8, alignItems: 'baseline' },
  summaryText: { fontSize: 20, fontWeight: '700', color: '#111827' },
  summaryPct: { fontSize: 15, color: '#6B7280' },
  nextBtn: {
    backgroundColor: '#2563EB', padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 8,
  },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  skipLink: { textAlign: 'center', color: '#6B7280', textDecorationLine: 'underline', fontSize: 14 },
});
