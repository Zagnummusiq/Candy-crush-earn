import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

class FirebaseService {
  async signInAnonymously() {
    try {
      if (!auth().currentUser) {
        await auth().signInAnonymously();
      }
      return auth().currentUser?.uid;
    } catch (e) {
      console.error('Firebase Auth Error', e);
      return null;
    }
  }

  async saveProgress(points: number, level: number, gems: number = 0) {
    const uid = await this.signInAnonymously();
    if (uid) {
      await firestore().collection('users').doc(uid).set({
        points,
        level,
        gems,
        lastUpdated: firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    // Still keep local backup
    await AsyncStorage.multiSet([
      ['user_points', points.toString()],
      ['user_level', level.toString()],
      ['user_gems', gems.toString()],
    ]);
  }

  async loadProgress() {
    const uid = await this.signInAnonymously();
    if (uid) {
      const doc = await firestore().collection('users').doc(uid).get();
      if (typeof doc.exists === 'function' ? doc.exists() : doc.exists) {
        return doc.data();
      }
    }
    // Fallback to local
    const savedPoints = await AsyncStorage.getItem('user_points');
    const savedLevel = await AsyncStorage.getItem('user_level');
    const savedGems = await AsyncStorage.getItem('user_gems');
    return {
      points: savedPoints ? parseInt(savedPoints) : 0,
      level: savedLevel ? parseInt(savedLevel) : 1,
      gems: savedGems ? parseInt(savedGems) : 0,
    };
  }
}

export default new FirebaseService();
