import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface Props {
  message: string;
  visible: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoSnackbar({ message, visible, onUndo, onDismiss }: Props) {
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={onUndo}>
        <Text style={styles.undo}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    backgroundColor: '#1F2937', borderRadius: 8, padding: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  message: { color: '#FFF', flex: 1, fontSize: 14 },
  undo:    { color: '#60A5FA', fontWeight: '600', fontSize: 14, marginLeft: 12 },
});
