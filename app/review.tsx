import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { router } from 'expo-router';
import { ProgressStepper } from '../components/ProgressStepper';
import { useAppStore } from '../store/useAppStore';
import { getSubtotal } from '../lib/calculateSplit';

function ItemPriceInput({ itemId, initialPrice, updateItem }: {
  itemId: string;
  initialPrice: number;
  updateItem: (id: string, patch: { price: number }) => void;
}) {
  const [text, setText] = React.useState(initialPrice > 0 ? String(initialPrice) : '');

  function handleChange(val: string) {
    // Allow digits, one decimal point, max 2 decimal places
    if (!/^\d*\.?\d{0,2}$/.test(val)) return;
    setText(val);
    const parsed = parseFloat(val);
    updateItem(itemId, { price: isNaN(parsed) ? 0 : parsed });
  }

  return (
    <TextInput
      style={styles.priceInput}
      value={text}
      onChangeText={handleChange}
      keyboardType="decimal-pad"
      placeholder="0.00"
    />
  );
}

export default function ReviewScreen() {
  const { items, tax, tip, setTax, setTip, updateItem, addItem, removeItem, setStep } = useAppStore();
  const subtotal = getSubtotal(items);
  const total = subtotal + (tax || 0) + (tip || 0);
  const canProceed = subtotal > 0;

  function proceed() {
    setStep(3);
    router.push('/participants');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressStepper current={2} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.title}>Review Receipt</Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.itemRow, item.confidence < 0.75 && styles.lowConf]}>
              <TextInput
                style={[styles.nameInput, item.confidence < 0.75 && styles.lowConfText]}
                value={item.name}
                onChangeText={(t) => updateItem(item.id, { name: t })}
                placeholder="Item name"
              />
              <ItemPriceInput
                itemId={item.id}
                initialPrice={item.price}
                updateItem={updateItem}
              />
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={
            <View style={styles.footer}>
              <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                <Text style={styles.addBtnText}>+ Add item</Text>
              </TouchableOpacity>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <TextInput
                  style={styles.summaryInput}
                  value={String(tax || '')}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  onChangeText={(t) => setTax(parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.tipLabelRow}>
                  <Text style={styles.summaryLabel}>Tip (from receipt)</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Tip',
                        "You'll set or adjust the tip on the next page. If your receipt already included a tip, it's shown here for reference.",
                        [{ text: 'Got it' }]
                      )
                    }
                    style={styles.tipHelp}
                  >
                    <Text style={styles.tipHelpText}>?</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.summaryValue}>
                  {tip > 0 ? `$${tip.toFixed(2)}` : '—'}
                </Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
                onPress={proceed}
                disabled={!canProceed}
              >
                <Text style={styles.nextBtnText}>
                  {canProceed ? 'Looks good →' : 'Add at least one item to continue'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  list: { padding: 16, gap: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  lowConf: { borderColor: '#FCD34D', backgroundColor: '#FFFBEB' },
  lowConfText: { color: '#92400E' },
  nameInput: { flex: 1, fontSize: 15, color: '#111827' },
  priceInput: {
    width: 70, fontSize: 15, textAlign: 'right', color: '#111827',
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, padding: 4,
  },
  removeBtn: { fontSize: 18, color: '#EF4444', paddingHorizontal: 4 },
  addBtn: {
    borderWidth: 1.5, borderColor: '#2563EB', borderStyle: 'dashed',
    borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 16,
  },
  addBtnText: { color: '#2563EB', fontWeight: '600' },
  footer: { marginTop: 8, gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 15, color: '#374151' },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  summaryInput: {
    width: 80, textAlign: 'right', fontSize: 15, borderBottomWidth: 1,
    borderColor: '#D1D5DB', paddingVertical: 2,
  },
  tipLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipHelp: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
    borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center',
  },
  tipHelpText: { fontSize: 11, color: '#6B7280', fontWeight: '700', lineHeight: 13 },
  nextBtn: {
    marginTop: 16, backgroundColor: '#2563EB', padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  nextBtnDisabled: { backgroundColor: '#9CA3AF' },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 4, paddingTop: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#111827' },
});
