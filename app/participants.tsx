import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { ProgressStepper } from '../components/ProgressStepper';
import { BackHint } from '../components/BackHint';
import { useAppStore } from '../store/useAppStore';

export default function ParticipantsScreen() {
  const [name, setName] = useState('');
  const { participants, addParticipant, removeParticipant, setStep } = useAppStore();
  const canProceed = participants.length >= 2;

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    addParticipant(trimmed);
    setName('');
  }

  function proceed() {
    setStep(4);
    router.push('/assign');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressStepper current={3} />
      <BackHint />
      <View style={styles.content}>
        <Text style={styles.title}>Who's splitting?</Text>
        <Text style={styles.subtitle}>Add everyone at the table (min. 2)</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Name"
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!name.trim()}
          >
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={participants}
          keyExtractor={(p) => p.id}
          style={styles.list}
          renderItem={({ item: p }) => (
            <Swipeable
              renderRightActions={() => (
                <TouchableOpacity
                  style={styles.deleteAction}
                  onPress={() => removeParticipant(p.id)}
                >
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              )}
            >
              <View style={styles.chip}>
                <Text style={styles.chipText}>{p.name}</Text>
                <TouchableOpacity onPress={() => removeParticipant(p.id)}>
                  <Text style={styles.chipRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            </Swipeable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No one added yet</Text>
          }
        />

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
          onPress={proceed}
          disabled={!canProceed}
        >
          <Text style={styles.nextBtnText}>
            {canProceed ? 'Assign Items →' : 'Add at least 2 people'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 16 },
  inputRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  input: {
    flex: 1, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#D1D5DB',
    borderRadius: 10, padding: 12, fontSize: 15,
  },
  addBtn: {
    backgroundColor: '#2563EB', borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#9CA3AF' },
  addBtnText: { color: '#FFF', fontWeight: '600' },
  list: { flex: 1 },
  chip: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipText: { fontSize: 16, color: '#111827' },
  chipRemove: { fontSize: 18, color: '#9CA3AF' },
  deleteAction: {
    backgroundColor: '#EF4444', justifyContent: 'center',
    alignItems: 'center', width: 80, borderRadius: 10, marginBottom: 8,
  },
  deleteText: { color: '#FFF', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 32, fontSize: 15 },
  nextBtn: {
    backgroundColor: '#2563EB', padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 16,
  },
  nextBtnDisabled: { backgroundColor: '#9CA3AF' },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
