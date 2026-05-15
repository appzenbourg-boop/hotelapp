import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function LinensScreen() {
  const insets = useSafeAreaInsets();

  const [items, setItems] = useState<Record<string, number>>({
    Pillow: 0,
    Bedsheet: 0,
    Blanket: 0,
  });

  const increase = (key: string) => {
    setItems(prev => ({
      ...prev,
      [key]: prev[key] + 1,
    }));
  };

  const decrease = (key: string) => {
    setItems(prev => ({
      ...prev,
      [key]: prev[key] > 0 ? prev[key] - 1 : 0,
    }));
  };

  return (
    <View style={styles.container}>

      {/* HEADER IMAGE */}
      <View style={styles.headerWrapper}>
        <Image
          source={require('../../assets/images/image17.png')}
          style={styles.headerImage}
        />
        <View style={styles.overlay} />

        {/* BACK */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* BOTTOM CARD */}
      <View style={[styles.bottomCard, { top: 200 + insets.top, paddingBottom: 20 + insets.bottom }]}>

        <Text style={styles.title}>Select Items</Text>

        {Object.keys(items).map((key) => (
          <View key={key} style={styles.row}>

            <Text style={styles.itemName}>{key}</Text>

            <View style={styles.qtyBox}>
              <TouchableOpacity onPress={() => decrease(key)}>
                <Ionicons name="remove" size={18} color="#000" />
              </TouchableOpacity>

              <Text style={styles.qtyText}>{items[key]}</Text>

              <TouchableOpacity onPress={() => increase(key)}>
                <Ionicons name="add" size={18} color="#000" />
              </TouchableOpacity>
            </View>

          </View>
        ))}

        {/* CONFIRM */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={() => router.push('/(services)/linens-confirmed')}
        >
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* HEADER */

  headerWrapper: {
    width: '100%',
    height: 334,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },

  headerImage: {
    width: '100%',
    height: 324,
  },

  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  backBtn: {
    position: 'absolute',
    left: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CARD */

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#ECE9E6',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: 24,
  },

  title: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 20,
  },

  /* ITEM ROW */

  row: {
    backgroundColor: '#FFFFFF',
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 20,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  itemName: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  qtyText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },

  /* CONFIRM */

  confirmBtn: {
    marginTop: 40,
    backgroundColor: '#2F2E2E',
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});
