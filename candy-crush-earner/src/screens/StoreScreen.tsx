import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../constants/Config';

const bundles = [
  { id: '1', name: 'Starter Pack', price: '100 KSH', items: '5 Hammers + 2 Magic', icon: '🚀' },
  { id: '2', name: 'Pro Bundle', price: '250 KSH', items: '15 Hammers + 10 Magic', icon: '💎' },
  { id: '3', name: 'Unlimited Pack', price: '500 KSH', items: '50 Hammers + 40 Magic', icon: '🔥' },
];

const StoreScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>POWER-UP STORE</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>SPECIAL OFFERS</Text>
        <TouchableOpacity style={styles.mainOffer}>
          <Text style={styles.offerBadge}>BEST VALUE</Text>
          <Text style={styles.offerTitle}>SUPER BUNDLE</Text>
          <Text style={styles.offerItems}>100 Hammers + 100 Magic</Text>
          <Text style={styles.offerPrice}>ONLY 1000 KSH</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>BUNDLES</Text>
        {bundles.map(b => (
          <TouchableOpacity key={b.id} style={styles.bundleCard}>
            <Text style={styles.bundleIcon}>{b.icon}</Text>
            <View style={styles.bundleInfo}>
              <Text style={styles.bundleName}>{b.name}</Text>
              <Text style={styles.bundleItems}>{b.items}</Text>
            </View>
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>{b.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50, backgroundColor: '#16213E' },
  backText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  title: { color: COLORS.GOLD, fontSize: 20, fontWeight: '900' },
  scroll: { padding: 20 },
  sectionTitle: { color: '#AAA', fontWeight: 'bold', marginBottom: 15, marginTop: 10 },
  mainOffer: { backgroundColor: COLORS.GOLD, padding: 25, borderRadius: 25, alignItems: 'center', marginBottom: 30 },
  offerBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  offerTitle: { fontSize: 24, fontWeight: '900', color: '#000' },
  offerItems: { fontSize: 16, color: '#333', marginTop: 5 },
  offerPrice: { fontSize: 20, fontWeight: 'bold', color: '#000', marginTop: 15 },
  bundleCard: { backgroundColor: '#16213E', flexDirection: 'row', padding: 15, borderRadius: 20, alignItems: 'center', marginBottom: 15 },
  bundleIcon: { fontSize: 32, marginRight: 15 },
  bundleInfo: { flex: 1 },
  bundleName: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  bundleItems: { color: '#AAA', fontSize: 12 },
  priceTag: { backgroundColor: COLORS.SUCCESS, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  priceText: { color: '#FFF', fontWeight: 'bold' },
});

export default StoreScreen;
