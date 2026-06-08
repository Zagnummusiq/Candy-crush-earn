import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withSequence, 
  withTiming
} from 'react-native-reanimated';
import { SpecialType, Candy } from '../engine/Match3Engine';
import { TILE_SIZE } from '../constants/Config';

interface Props {
  candy: Candy | null;
  isSelected: boolean;
}

const CANDY_COLORS = ['#FF4757', '#2E90FF', '#2ED573', '#FFA502', '#A29BFE', '#FF7F50'];
const GLOSS_COLORS = ['#FF6B81', '#54A0FF', '#7BED9F', '#FFBE76', '#C7CEEA', '#FF9F43'];

const CandyTile = ({ candy, isSelected }: Props) => {
  const scale = useSharedValue(0);
  const selectScale = useSharedValue(1);

  useEffect(() => {
    if (candy) {
      scale.value = withSpring(1, { damping: 12 });
    } else {
      scale.value = withTiming(0, { duration: 150 });
    }
  }, [candy]);

  useEffect(() => {
    if (isSelected) {
      selectScale.value = withSequence(
        withTiming(1.15, { duration: 100 }),
        withTiming(1.05, { duration: 100 })
      );
    } else {
      selectScale.value = withTiming(1, { duration: 200 });
    }
  }, [isSelected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * selectScale.value }
    ],
    opacity: scale.value,
  }));

  const renderSpecial = () => {
    if (!candy?.special) {return null;}
    
    let label = '';
    switch (candy.special) {
      case SpecialType.LINE_HORIZONTAL: label = '↔️'; break;
      case SpecialType.LINE_VERTICAL: label = '↕️'; break;
      case SpecialType.BOMB: label = '💥'; break;
      case SpecialType.COLOR_BOMB: label = '🔮'; break;
    }

    return (
      <View style={styles.specialContainer}>
        <Text style={styles.specialText}>{label}</Text>
      </View>
    );
  };

  if (!candy) return <View style={styles.empty} />;

  return (
    <Animated.View style={[
      styles.tile,
      { backgroundColor: CANDY_COLORS[candy.type] },
      isSelected && styles.selectedTile,
      animatedStyle,
    ]}>
      {/* Gloss effect */}
      <View style={[styles.gloss, { backgroundColor: GLOSS_COLORS[candy.type] }]} />
      {renderSpecial()}
    </Animated.View>
  );
};

// Internal Text component for Animated compatibility if needed, 
// but standard Text works inside Animated.View
import { Text } from 'react-native';

const styles = StyleSheet.create({
  tile: {
    width: TILE_SIZE - 4,
    height: TILE_SIZE - 4,
    borderRadius: TILE_SIZE * 0.3,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  gloss: {
    position: 'absolute',
    top: '10%',
    left: '15%',
    width: '35%',
    height: '25%',
    borderRadius: 10,
    opacity: 0.6,
  },
  selectedTile: {
    borderWidth: 3,
    borderColor: '#FFF',
    elevation: 12,
  },
  specialContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  specialText: {
    fontSize: TILE_SIZE * 0.45,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  empty: {
    width: TILE_SIZE,
    height: TILE_SIZE,
  }
});

export default CandyTile;
