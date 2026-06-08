import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../constants/Config';
import FirebaseService from '../services/FirebaseService';
import AdManager from '../services/AdManager';

const TOTAL_LEVELS = 50;

const MapScreen = ({ navigation }: any) => {
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProgress();
      AdManager.init();
    });
    return unsubscribe;
  }, [navigation]);

  const loadProgress = async () => {
    const data = await FirebaseService.loadProgress();
    setUnlockedLevel(data?.level || 1);
    setPoints(data?.points || 0);
  };

  const startLevel = (levelId: number) => {
    if (levelId <= unlockedLevel) {
      navigation.navigate('Game', { levelId });
    }
  };

  const renderLevel = (id: number) => {
    const isLocked = id > unlockedLevel;
    const isCompleted = id < unlockedLevel;

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.levelNode,
          isLocked && styles.levelLocked,
          isCompleted && styles.levelCompleted,
          id % 2 === 0 ? { marginLeft: 60 } : { marginRight: 60 },
        ]}
        onPress={() => startLevel(id)}
        disabled={isLocked}
      >
        <Text style={styles.levelText}>{id}</Text>
        {isLocked && <Text style={styles.lockIcon}>🔒</Text>}
        {isCompleted && <Text style={styles.starIcon}>⭐⭐⭐</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>TOTAL POINTS</Text>
          <Text style={styles.headerVal}>{points}</Text>
          <Text style={styles.cashLabel}>≈ ${(points / 1000).toFixed(2)} USD</Text>
        </View>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Store')}>
            <Text style={styles.iconBtnText}>🛒</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Invitation')}>
            <Text style={styles.iconBtnText}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.walletBtnText}>WALLET 💰</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        ref={(ref) => { this.scrollView = ref; }}
      >
        <View style={styles.path} />
        {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(id => renderLevel(id))}
      </ScrollView>

      <TouchableOpacity 
        style={styles.floatingBubble} 
        onPress={() => {
          // Logic to scroll to current level could go here
          startLevel(unlockedLevel);
        }}
      >
        <Text style={styles.bubbleText}>LVL</Text>
        <Text style={styles.bubbleVal}>{unlockedLevel}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>CLIMB TO THE TOP TO WITHDRAW CASH!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e272e' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#2f3542',
    borderBottomWidth: 1,
    borderBottomColor: '#3e444e',
  },
  headerLabel: { color: '#CED4DA', fontSize: 12, fontWeight: 'bold' },
  headerVal: { color: COLORS.GOLD, fontSize: 24, fontWeight: '900' },
  cashLabel: { color: COLORS.SUCCESS, fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  headerBtns: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 15, marginLeft: 10 },
  iconBtnText: { fontSize: 20 },
  walletBtn: { backgroundColor: COLORS.SUCCESS, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginLeft: 10 },
  walletBtnText: { color: '#FFF', fontWeight: 'bold' },
  scrollContent: { paddingVertical: 50, alignItems: 'center' },
  path: {
    position: 'absolute',
    width: 10,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
  },
  levelNode: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  levelLocked: { backgroundColor: '#57606f', opacity: 0.7, borderColor: '#2f3542' },
  levelCompleted: { backgroundColor: COLORS.SECONDARY },
  levelText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  lockIcon: { position: 'absolute', bottom: -5, right: -5, fontSize: 20 },
  starIcon: { position: 'absolute', top: -15, fontSize: 14 },
  floatingBubble: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.GOLD,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  bubbleText: { color: '#000', fontSize: 10, fontWeight: 'bold' },
  bubbleVal: { color: '#000', fontSize: 20, fontWeight: '900' },
  footer: { padding: 15, backgroundColor: '#2f3542', alignItems: 'center' },
  footerText: { color: COLORS.GOLD, fontWeight: 'bold', fontSize: 12 },
});

export default MapScreen;
