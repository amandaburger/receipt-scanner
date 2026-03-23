import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ActivityIndicator,
  Alert, StyleSheet
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ProgressStepper } from '../components/ProgressStepper';
import { useAppStore } from '../store/useAppStore';
import { parseReceipt } from '../lib/parseReceipt';

const OCR_URL = (process.env.EXPO_PUBLIC_OCR_API_URL ?? '') + '/api/ocr';

const OCR_ERRORS: Record<string, string> = {
  image_too_large: 'Image is too large — try a lower resolution photo.',
  timeout:         'Scan timed out — check your connection and try again.',
  quota:           'Too many scans right now — try again in a moment.',
  no_text:         'No text found on this image.',
  no_api_key:      'Server config error: Google Vision API key not set.',
  vision_error:    'Google Vision API error — check your API key.',
  default:         'Scan failed — you can enter items manually.',
};

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setItems, setTax, setTip, setStep } = useAppStore();

  async function pickImage(useCamera: boolean) {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need camera access to scan your receipt.');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'We need photo library access to choose an image.');
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  }

  async function scanReceipt() {
    if (!imageUri) return;
    setLoading(true);

    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const res = await fetch(OCR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const rawText = await res.text();
      let json: Record<string, unknown>;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new Error(`Non-JSON response (HTTP ${res.status}): ${rawText.slice(0, 200)}`);
      }

      if (!res.ok) {
        const msg = OCR_ERRORS[json.error] ?? OCR_ERRORS.default;
        Alert.alert('Scan failed', `${msg}\n\nCode: ${json.error ?? 'unknown'} (HTTP ${res.status})`, [
          { text: 'Enter manually', onPress: goManual },
          { text: 'Try again' },
        ]);
        return;
      }

      const parsed = parseReceipt(json.text, json.words ?? []);
      setItems(parsed.items);
      setTax(parsed.tax);
      setTip(parsed.tip);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep(2);
      router.push('/review');
    } catch (err) {
      const debug = err instanceof Error ? err.message : String(err);
      Alert.alert('Scan failed', `${OCR_ERRORS.default}\n\nDebug: ${debug}`, [
        { text: 'Enter manually', onPress: goManual },
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function goManual() {
    setItems([]);
    setTax(0);
    setTip(0);
    setStep(2);
    router.push('/review');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ProgressStepper current={1} />
      <View style={styles.content}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>Take a photo or upload from your library</Text>

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>📷</Text>
            <Text style={styles.placeholderLabel}>No image selected</Text>
          </View>
        )}

        <TouchableOpacity style={styles.btnPrimary} onPress={() => pickImage(true)}>
          <Text style={styles.btnPrimaryText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => pickImage(false)}>
          <Text style={styles.btnSecondaryText}>Choose from Library</Text>
        </TouchableOpacity>

        {imageUri && !loading && (
          <TouchableOpacity style={styles.btnScan} onPress={scanReceipt}>
            <Text style={styles.btnPrimaryText}>Scan Receipt →</Text>
          </TouchableOpacity>
        )}
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Reading your receipt…</Text>
          </View>
        )}

        <TouchableOpacity onPress={goManual}>
          <Text style={styles.manualLink}>Enter items manually instead</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { flex: 1, padding: 16, alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginTop: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  preview: { width: '100%', height: 320, borderRadius: 12, resizeMode: 'contain', marginVertical: 8, backgroundColor: '#E5E7EB' },
  placeholder: {
    width: '100%', height: 220, borderRadius: 12, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center', marginVertical: 8,
  },
  placeholderText: { fontSize: 48 },
  placeholderLabel: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  btnPrimary: {
    width: '100%', backgroundColor: '#2563EB', padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  btnSecondary: {
    width: '100%', backgroundColor: '#FFF', padding: 16,
    borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: '#D1D5DB',
  },
  btnSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  btnScan: {
    width: '100%', backgroundColor: '#059669', padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  loading: { alignItems: 'center', gap: 8, marginVertical: 8 },
  loadingText: { fontSize: 15, color: '#6B7280' },
  manualLink: { color: '#2563EB', fontSize: 14, marginTop: 8, textDecorationLine: 'underline' },
});
