import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const GRID_SIZE = 8;
export const TILE_SIZE = (width - 40) / GRID_SIZE;

export const AD_UNIT_IDS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  NATIVE: 'ca-app-pub-3940256099942544/2247696110',
};

export const COLORS = {
  PRIMARY: '#FF6B6B',
  SECONDARY: '#4ECDC4',
  BACKGROUND: '#F7F7F7',
  TEXT: '#2D3436',
  GOLD: '#F1C40F',
  SUCCESS: '#2ECC71',
  ERROR: '#E74C3C',
};

export const CANDY_TYPES = 6;
export const MIN_MATCH = 3;
export const POINTS_PER_CANDY = 10;
export const POINTS_PER_SWAP = 5;
export const WITHDRAWAL_THRESHOLD = 5000;
