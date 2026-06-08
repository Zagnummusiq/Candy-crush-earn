import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { COLORS, WITHDRAWAL_THRESHOLD } from '../constants/Config';
import FirebaseService from '../services/FirebaseService';

const SERVER_URL = 'https://your-game-backend.onrender.com';

interface Transaction {
  id: string;
  amount: number;
  status: string;
  date: string;
}

const WalletScreen = ({ navigation }: any) => {
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Transaction[]>([]);

  useEffect(() => {
    loadPoints();
    // In a real app, we'd load history from Firebase/Server
    setHistory([
      { id: '1', amount: 5.00, status: 'Completed', date: '2026-06-01' },
      { id: '2', amount: 10.00, status: 'Processing', date: '2026-06-05' },
    ]);
  }, []);

  const loadPoints = async () => {
    const data = await FirebaseService.loadProgress();
    setPoints(data?.points || 0);
    setLevel(data?.level || 1);
  };

  const handleWithdraw = async (customAmount?: number) => {
    // Basic validation for points
    const withdrawalPoints = customAmount ? customAmount * 1000 : points;
    
    if (points < WITHDRAWAL_THRESHOLD || points < withdrawalPoints) {
      Alert.alert('Incomplete', `You need at least ${Math.max(WITHDRAWAL_THRESHOLD, withdrawalPoints)} points to withdraw this amount.`);
      return;
    }

    // Flexible phone number formatting
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.substring(1);
    } else if (formattedPhone.length === 9 && (formattedPhone.startsWith('7') || formattedPhone.startsWith('1'))) {
      formattedPhone = '254' + formattedPhone;
    }

    if (!/^254(7|1)\d{8}$/.test(formattedPhone)) {
      Alert.alert('Error', 'Please enter a valid M-Pesa phone number (e.g., 07XXXXXXXX or +2547XXXXXXXX).');
      return;
    }

    setLoading(true);
    const amountInUsd = withdrawalPoints / 1000;

    try {
      console.log(`[Withdraw] Sending request to ${SERVER_URL}/withdraw for ${formattedPhone}`);
      const response = await fetch(`${SERVER_URL}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'payhero',
          phoneNumber: formattedPhone,
          amount: amountInUsd,
          points: withdrawalPoints
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const remainingPoints = points - withdrawalPoints;
        await FirebaseService.saveProgress(remainingPoints, level);
        setPoints(remainingPoints);
        Alert.alert('Success!', result.message || `Withdrawal processed. Batch ID: ${result.batch_id}`);
        // Add to local history
        setHistory(prev => [{
          id: result.batch_id || Date.now().toString(),
          amount: amountInUsd,
          status: 'Processing',
          date: new Date().toISOString().split('T')[0]
        }, ...prev]);
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        const details = result.details ? `\n\nDetails: ${typeof result.details === 'string' ? result.details : JSON.stringify(result.details)}` : '';
        Alert.alert('Payout Failed', errorMsg + details);
      }
    } catch (error: any) {
      console.error('Withdrawal Request Failed:', error);
      Alert.alert('Network Error', 'Could not connect to the withdrawal service. Please check your internet connection or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const renderHistoryItem = ({ item }: { item: Transaction }) => (
    <View style={styles.historyItem}>
      <View>
        <Text style={styles.historyAmount}>${item.amount.toFixed(2)} USD</Text>
        <Text style={styles.historyDate}>{item.date}</Text>
      </View>
      <View style={[styles.statusBadge, item.status === 'Completed' ? styles.statusCompleted : styles.statusProcessing]}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>⬅️ Wallet</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.balance}>{points} Points</Text>
        <Text style={styles.subtext}>≈ ${(points / 1000).toFixed(2)} USD</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>M-Pesa Payout Settings</Text>
        <TextInput
          style={styles.input}
          placeholder="+2547XXXXXXXX"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholderTextColor="#888"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Withdraw</Text>
        <View style={styles.quickGrid}>
          {[5, 10, 20, 50].map(amt => (
            <TouchableOpacity 
              key={amt} 
              style={styles.quickBtn} 
              onPress={() => handleWithdraw(amt)}
              disabled={loading}
            >
              <Text style={styles.quickBtnText}>${amt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity
          style={[styles.withdrawButton, loading && { opacity: 0.7 }]}
          onPress={() => handleWithdraw()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.withdrawButtonText}>Withdraw All Points</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>
        {history.length > 0 ? (
          history.map(item => <View key={item.id}>{renderHistoryItem({ item })}</View>)
        ) : (
          <Text style={styles.emptyText}>No transactions yet.</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  backBtn: { marginTop: 50, marginLeft: 20, marginBottom: 20 },
  backBtnText: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT },
  card: { backgroundColor: COLORS.GOLD, margin: 20, padding: 30, borderRadius: 25, alignItems: 'center', elevation: 8 },
  label: { color: '#FFF', fontSize: 16, opacity: 0.9 },
  balance: { color: '#FFF', fontSize: 48, fontWeight: '900', marginVertical: 5 },
  subtext: { color: '#FFF', fontSize: 20, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.TEXT, marginBottom: 15 },
  input: { backgroundColor: '#FFF', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: '#EEE', fontSize: 16, color: '#000' },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  quickBtn: { backgroundColor: COLORS.SECONDARY, width: '22%', padding: 15, borderRadius: 12, alignItems: 'center' },
  quickBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  withdrawButton: { backgroundColor: COLORS.SUCCESS, padding: 20, borderRadius: 15, alignItems: 'center', height: 65, justifyContent: 'center', elevation: 3 },
  withdrawButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 15, borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  historyAmount: { fontSize: 16, fontWeight: 'bold', color: COLORS.TEXT },
  historyDate: { fontSize: 12, color: '#999', marginTop: 4 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusCompleted: { backgroundColor: '#E3F9E5' },
  statusProcessing: { backgroundColor: '#FFF4E5' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#AAA', marginTop: 20 },
});

export default WalletScreen;
