import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { COLORS } from '../constants/Config';

const InvitationScreen = ({ navigation }: any) => {
  const onShare = async () => {
    try {
      await Share.share({
        message: 'Join me in Candy Crush Earner and win real cash! Download now: https://example.com/download',
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backText}>← BACK</Text>
      </TouchableOpacity>
      <Text style={styles.title}>INVITE FRIENDS</Text>
      <Text style={styles.subtitle}>Earn 500 Gems for every friend who joins!</Text>
      <View style={styles.card}>
        <Text style={styles.cardEmoji}>🎁</Text>
        <Text style={styles.cardText}>Sharing is caring (and earning!)</Text>
      </View>
      <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
        <Text style={styles.shareBtnText}>SHARE INVITE LINK</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', padding: 20, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginTop: 40 },
  backText: { color: '#FFF', fontWeight: 'bold' },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.GOLD, marginTop: 40 },
  subtitle: { color: '#CCC', textAlign: 'center', marginTop: 10, fontSize: 16 },
  card: { backgroundColor: '#16213E', width: '100%', padding: 40, borderRadius: 30, alignItems: 'center', marginVertical: 40 },
  cardEmoji: { fontSize: 80 },
  cardText: { color: '#FFF', marginTop: 20, fontSize: 18, fontWeight: 'bold' },
  shareBtn: { backgroundColor: COLORS.PRIMARY, width: '100%', padding: 20, borderRadius: 15, alignItems: 'center' },
  shareBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
});

export default InvitationScreen;
