import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { createInitialGrid, checkMatches, applyCascading, Grid, Candy, hasPossibleMoves, shuffleGrid, SpecialType, getAffectedCandies, clearPosition } from '../engine/Match3Engine';
import { COLORS, POINTS_PER_CANDY, POINTS_PER_SWAP } from '../constants/Config';
import AdManager from '../services/AdManager';
import FirebaseService from '../services/FirebaseService';
import CandyTile from '../components/CandyTile';

const GameScreen = ({ navigation, route }: any) => {
  const { levelId } = route.params || { levelId: 1 };
  const [grid, setGrid] = useState<Grid>(createInitialGrid());
  const [points, setPoints] = useState(0);
  const [moves, setMoves] = useState(25);
  const [selectedCandy, setSelectedCandy] = useState<Candy | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [winModalVisible, setWinModalVisible] = useState(false);
  
  // Power-up States
  const [hammers, setHammers] = useState(1);
  const [colorBombs, setColorBombs] = useState(0);
  const [activePowerUp, setActivePowerUp] = useState<'HAMMER' | 'COLOR_BOMB' | null>(null);

  const targetPoints = levelId * 1500;

  useEffect(() => {
    loadProgress();
    AdManager.init();
  }, []);

  const loadProgress = async () => {
    const data = await FirebaseService.loadProgress();
    setPoints(data?.points || 0);
  };

  const onGestureEvent = (row: number, col: number) => ({ nativeEvent }: any) => {
    if (isProcessing || moves <= 0) return;
    
    const { translationX, translationY, state } = nativeEvent;

    if (state === State.END) {
      const absX = Math.abs(translationX);
      const absY = Math.abs(translationY);

      if (absX < 20 && absY < 20) {
        handlePress(row, col);
        return;
      }

      let targetRow = row;
      let targetCol = col;

      if (absX > absY) {
        // Horizontal swipe
        targetCol = translationX > 0 ? col + 1 : col - 1;
      } else {
        // Vertical swipe
        targetRow = translationY > 0 ? row + 1 : row - 1;
      }

      if (targetRow >= 0 && targetRow < grid.length && targetCol >= 0 && targetCol < grid[0].length) {
        const c1 = grid[row][col];
        const c2 = grid[targetRow][targetCol];
        if (c1 && c2) {
          executeMove(c1, c2);
        }
      }
    }
  };

  const handlePress = (row: number, col: number) => {
    if (activePowerUp === 'HAMMER') {
      useHammer(row, col);
      return;
    }
    
    if (activePowerUp === 'COLOR_BOMB') {
      useColorBomb(row, col);
      return;
    }

    const candy = grid[row][col];
    if (!candy) return;

    if (!selectedCandy) {
      setSelectedCandy(candy);
    } else {
      const isAdjacent = Math.abs(selectedCandy.row - row) + Math.abs(selectedCandy.col - col) === 1;
      if (isAdjacent) {
        executeMove(selectedCandy, candy);
        setSelectedCandy(null);
      } else {
        setSelectedCandy(candy);
      }
    }
  };

  const useHammer = async (row: number, col: number) => {
    if (hammers <= 0) return;
    setIsProcessing(true);
    setHammers(h => h - 1);
    setActivePowerUp(null);
    
    // Award points for the action
    const nextPoints = points + POINTS_PER_SWAP;
    setPoints(nextPoints);

    const affected = clearPosition(grid, row, col);
    await processMatches(grid, affected.map(a => ({ ...a })), nextPoints);
    setIsProcessing(false);
  };

  const useColorBomb = async (row: number, col: number) => {
    if (colorBombs <= 0) return;
    const candy = grid[row][col];
    if (!candy) return;

    setIsProcessing(true);
    setColorBombs(cb => cb - 1);
    setActivePowerUp(null);

    // Award points for the action
    const nextPoints = points + POINTS_PER_SWAP;
    setPoints(nextPoints);

    const affected: { row: number; col: number }[] = [];
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]?.type === candy.type) {
          affected.push({ row: r, col: c });
        }
      }
    }

    await processMatches(grid, affected, nextPoints);
    setIsProcessing(false);
  };

  const executeMove = async (c1: Candy, c2: Candy) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // Award points for the swap itself (turn over)
    const nextPointsWithSwap = points + POINTS_PER_SWAP;
    setPoints(nextPointsWithSwap);
    
    const newGrid = grid.map(row => [...row]);
    const t1 = { ...c1, row: c2.row, col: c2.col };
    const t2 = { ...c2, row: c1.row, col: c1.col };
    newGrid[c1.row][c1.col] = t2;
    newGrid[c2.row][c2.col] = t1;
    setGrid(newGrid);

    await new Promise(resolve => setTimeout(resolve, 200));

    const matches = checkMatches(newGrid);
    if (matches.length > 0) {
      setMoves(m => m - 1);
      await processMatches(newGrid, matches, nextPointsWithSwap);
    } else {
      // Save points even for unsuccessful swaps
      const data = await FirebaseService.loadProgress();
      FirebaseService.saveProgress(nextPointsWithSwap, data?.level || 1);
      
      const backGrid = grid.map(row => [...row]);
      backGrid[c1.row][c1.col] = { ...c1 };
      backGrid[c2.row][c2.col] = { ...c2 };
      setGrid(backGrid);
    }
    setIsProcessing(false);
  };

  const processMatches = async (currentGrid: Grid, initialMatches: { row: number; col: number; specialToCreate?: SpecialType }[], currentPoints?: number, comboCount: number = 0) => {
    let newGrid = currentGrid.map(row => [...row]);
    const affected = getAffectedCandies(newGrid, initialMatches);
    
    affected.forEach((m: { row: number; col: number }) => {
      const matchConfig = initialMatches.find(im => im.row === m.row && im.col === m.col);
      if (matchConfig?.specialToCreate) {
        newGrid[m.row][m.col] = {
          ...newGrid[m.row][m.col]!,
          special: matchConfig.specialToCreate,
          id: `candy-special-${m.row}-${m.col}-${Math.random()}`,
        };
      } else {
        newGrid[m.row][m.col] = null;
      }
    });

    const basePoints = currentPoints !== undefined ? currentPoints : points;
    // Award bonus points for combos
    const comboMultiplier = 1 + (comboCount * 0.5);
    const earnedPoints = Math.round(affected.length * POINTS_PER_CANDY * comboMultiplier);
    const nextPoints = basePoints + earnedPoints;
    setPoints(nextPoints);

    const data = await FirebaseService.loadProgress();
    FirebaseService.saveProgress(nextPoints, data?.level || 1);

    setGrid(newGrid);
    await new Promise(resolve => setTimeout(resolve, 250));

    newGrid = applyCascading(newGrid);
    setGrid(newGrid);

    await new Promise(resolve => setTimeout(resolve, 400));
    const nextMatches = checkMatches(newGrid);
    if (nextMatches.length > 0) {
      await processMatches(newGrid, nextMatches, nextPoints, comboCount + 1);
    } else {
      checkGameEnd(nextPoints);
    }
  };

  const checkGameEnd = async (currentPoints: number) => {
    if (currentPoints >= targetPoints) {
      const data = await FirebaseService.loadProgress();
      if (levelId >= (data?.level || 1)) {
        FirebaseService.saveProgress(currentPoints, levelId + 1);
      }
      setWinModalVisible(true);
    } else if (moves <= 0) {
      setGameOverVisible(true);
    } else if (!hasPossibleMoves(grid)) {
      setGrid(shuffleGrid(grid));
    }
  };

  const getExtraMoves = () => {
    AdManager.showRewarded(() => {
      setMoves(m => m + 10);
      setGameOverVisible(false);
    });
  };

  const watchAdForHammer = () => {
    AdManager.showRewarded(() => {
      setHammers(h => h + 1);
    });
  };

  const watchAdForColorBomb = () => {
    AdManager.showRewarded(() => {
      setColorBombs(cb => cb + 1);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={{ fontSize: 22, color: '#FFF' }}>🏠</Text>
        </TouchableOpacity>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>GOAL</Text>
            <Text style={styles.statValue}>{targetPoints}</Text>
          </View>
          <View style={[styles.statBox, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.statLabel}>SCORE</Text>
            <Text style={styles.statValue}>{points}</Text>
            <Text style={styles.cashText}>${(points / 1000).toFixed(2)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>MOVES</Text>
            <Text style={[styles.statValue, moves < 5 && { color: COLORS.ERROR }]}>{moves}</Text>
          </View>
        </View>
      </View>

      <View style={styles.board}>
        {grid.map((row, r) => (
          <View key={r} style={styles.row}>
            {row.map((candy, c) => (
              <PanGestureHandler
                key={candy ? candy.id : `empty-${r}-${c}`}
                onHandlerStateChange={onGestureEvent(r, c)}
              >
                <View>
                  <CandyTile
                    candy={candy}
                    isSelected={selectedCandy?.row === r && selectedCandy?.col === c}
                  />
                </View>
              </PanGestureHandler>
            ))}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.powerUp, activePowerUp === 'HAMMER' && styles.powerUpActive]}
          onPress={() => hammers > 0 ? setActivePowerUp('HAMMER') : watchAdForHammer()}
        >
          <Text style={styles.puIcon}>🔨</Text>
          <View style={styles.puBadge}><Text style={styles.puCount}>{hammers > 0 ? hammers : '+'}</Text></View>
          <Text style={styles.puLabel}>Hammer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.powerUp, activePowerUp === 'COLOR_BOMB' && styles.powerUpActive]}
          onPress={() => colorBombs > 0 ? setActivePowerUp('COLOR_BOMB') : watchAdForColorBomb()}
        >
          <Text style={styles.puIcon}>🔮</Text>
          <View style={styles.puBadge}><Text style={styles.puCount}>{colorBombs > 0 ? colorBombs : '+'}</Text></View>
          <Text style={styles.puLabel}>Magic</Text>
        </TouchableOpacity>
      </View>

      {activePowerUp && (
        <View style={styles.hintBox}>
          <Text style={styles.hintText}>Mode: Use {activePowerUp}</Text>
          <TouchableOpacity onPress={() => setActivePowerUp(null)}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={winModalVisible} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.winTitle}>WINNER!</Text>
            <Text style={styles.winScore}>Score: {points}</Text>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Map')}>
              <Text style={styles.btnText}>NEXT LEVEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={gameOverVisible} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={[styles.winTitle, { color: COLORS.ERROR }]}>GAME OVER</Text>
            <TouchableOpacity style={styles.btn} onPress={getExtraMoves}>
              <Text style={styles.btnText}>FREE +10 MOVES (AD)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: '#666' }]} onPress={() => navigation.navigate('Map')}>
              <Text style={styles.btnText}>QUIT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  header: { width: '95%', marginBottom: 20 },
  backButton: { padding: 10 },
  statsContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 15 },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#AAA', fontSize: 10, fontWeight: 'bold' },
  statValue: { color: '#FFF', fontSize: 22, fontWeight: '900' },
  cashText: { color: COLORS.SUCCESS, fontSize: 12, fontWeight: 'bold' },
  board: { padding: 8, backgroundColor: '#16213E', borderRadius: 20, elevation: 10 },
  row: { flexDirection: 'row' },
  footer: { flexDirection: 'row', marginTop: 40, width: '90%', justifyContent: 'space-around' },
  floatingAd: { position: 'absolute', right: 20, top: '45%', backgroundColor: '#FFF', padding: 10, borderRadius: 20, elevation: 5, alignItems: 'center' },
  floatingAdEmoji: { fontSize: 30 },
  floatingAdBadge: { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 6, borderRadius: 8, marginTop: -5 },
  floatingAdText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  powerUp: { backgroundColor: '#0F3460', width: 100, padding: 12, borderRadius: 20, alignItems: 'center' },
  powerUpActive: { backgroundColor: COLORS.GOLD, borderColor: '#FFF', borderWIdth: 2 },
  puIcon: { fontSize: 32, marginBottom: 5 },
  puBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.PRIMARY, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  puCount: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  puLabel: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  hintBox: { position: 'absolute', bottom: 150, backgroundColor: 'rgba(0,0,0,0.9)', padding: 15, borderRadius: 25, alignItems: 'center' },
  hintText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  cancelText: { color: COLORS.GOLD, fontWeight: 'bold' },
  modal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', width: '85%', padding: 40, borderRadius: 30, alignItems: 'center' },
  winTitle: { fontSize: 36, fontWeight: '900', color: COLORS.GOLD, marginBottom: 15 },
  winScore: { fontSize: 20, color: '#333', marginBottom: 30 },
  btn: { backgroundColor: COLORS.PRIMARY, width: '100%', padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 }
});

export default GameScreen;
