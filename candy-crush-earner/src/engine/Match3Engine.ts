import { GRID_SIZE, CANDY_TYPES } from '../constants/Config';

export enum SpecialType {
  NONE = 0,
  STRIPED_HORIZONTAL = 1,
  STRIPED_VERTICAL = 2,
  WRAPPED = 3,
  COLOR_BOMB = 4,
  MEGA_BOMB = 5,
  BIRD = 6,
}

export interface Candy {
  id: string;
  type: number;
  row: number;
  col: number;
  special?: SpecialType;
}

export type Grid = (Candy | null)[][];

export const createInitialGrid = (): Grid => {
  let grid: Grid = [];
  do {
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        grid[r][c] = {
          id: `candy-${r}-${c}-${Math.random()}`,
          type: Math.floor(Math.random() * CANDY_TYPES),
          row: r,
          col: c,
          special: SpecialType.NONE,
        };
      }
    }
  } while (checkMatches(grid).length > 0 || !hasPossibleMoves(grid));
  return grid;
};

export const checkMatches = (grid: Grid): { row: number; col: number; specialToCreate?: SpecialType }[] => {
  const matches: Map<string, SpecialType> = new Map();
  const toRemove: Set<string> = new Set();

  // Horizontal check
  for (let r = 0; r < GRID_SIZE; r++) {
    let matchLen = 1;
    for (let c = 0; c < GRID_SIZE; c++) {
      const current = grid[r][c]?.type;
      const next = grid[r][c + 1]?.type;

      if (current !== undefined && current === next) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          let special = SpecialType.NONE;
          if (matchLen === 4) special = SpecialType.STRIPED_HORIZONTAL;
          if (matchLen === 5) special = SpecialType.WRAPPED;
          if (matchLen >= 6) special = SpecialType.MEGA_BOMB;

          for (let i = 0; i < matchLen; i++) {
            const pos = `${r},${c - i}`;
            toRemove.add(pos);
            if (i === Math.floor(matchLen / 2) && special !== SpecialType.NONE) {
              matches.set(pos, special);
            }
          }
        }
        matchLen = 1;
      }
    }
  }

  // Vertical check
  for (let c = 0; c < GRID_SIZE; c++) {
    let matchLen = 1;
    for (let r = 0; r < GRID_SIZE; r++) {
      const current = grid[r][c]?.type;
      const next = grid[r + 1]?.[c]?.type;

      if (current !== undefined && current === next) {
        matchLen++;
      } else {
        if (matchLen >= 3) {
          let special = SpecialType.NONE;
          if (matchLen === 4) special = SpecialType.STRIPED_VERTICAL;
          if (matchLen === 5) special = SpecialType.WRAPPED;
          if (matchLen >= 6) special = SpecialType.MEGA_BOMB;

          for (let i = 0; i < matchLen; i++) {
            const pos = `${r - i},${c}`;
            toRemove.add(pos);
            if (i === Math.floor(matchLen / 2) && special !== SpecialType.NONE) {
              matches.set(pos, special);
            }
          }
        }
        matchLen = 1;
      }
    }
  }

  // Square Check (2x2) for BIRD
  for (let r = 0; r < GRID_SIZE - 1; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      const t1 = grid[r][c]?.type;
      const t2 = grid[r][c + 1]?.type;
      const t3 = grid[r + 1][c]?.type;
      const t4 = grid[r + 1][c + 1]?.type;

      if (t1 !== undefined && t1 === t2 && t1 === t3 && t1 === t4) {
        toRemove.add(`${r},${c}`);
        toRemove.add(`${r},${c + 1}`);
        toRemove.add(`${r + 1},${c}`);
        toRemove.add(`${r + 1},${c + 1}`);
        matches.set(`${r},${c}`, SpecialType.BIRD);
      }
    }
  }

  return Array.from(toRemove).map(s => {
    const [r, c] = s.split(',').map(Number);
    return { row: r, col: c, specialToCreate: matches.get(s) };
  });
};

export const getAffectedCandies = (grid: Grid, initialMatches: { row: number; col: number }[]): { row: number; col: number }[] => {
  const toRemove = new Set<string>();
  const queue = [...initialMatches];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const posKey = `${current.row},${current.col}`;
    
    if (toRemove.has(posKey)) continue;
    toRemove.add(posKey);

    const candy = grid[current.row][current.col];
    if (candy?.special) {
      switch (candy.special) {
        case SpecialType.STRIPED_HORIZONTAL:
          for (let c = 0; c < GRID_SIZE; c++) queue.push({ row: current.row, col: c });
          break;
        case SpecialType.STRIPED_VERTICAL:
          for (let r = 0; r < GRID_SIZE; r++) queue.push({ row: r, col: current.col });
          break;
        case SpecialType.WRAPPED:
          for (let r = Math.max(0, current.row - 1); r <= Math.min(GRID_SIZE - 1, current.row + 1); r++) {
            for (let c = Math.max(0, current.col - 1); c <= Math.min(GRID_SIZE - 1, current.col + 1); c++) {
              queue.push({ row: r, col: c });
            }
          }
          break;
        case SpecialType.MEGA_BOMB:
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              queue.push({ row: r, col: c });
            }
          }
          break;
        case SpecialType.COLOR_BOMB:
          const randomType = Math.floor(Math.random() * CANDY_TYPES);
          for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
              if (grid[r][c]?.type === randomType) queue.push({ row: r, col: c });
            }
          }
          break;
        case SpecialType.BIRD:
          // Bird clears a random color and small area
          for (let r = Math.max(0, current.row - 1); r <= Math.min(GRID_SIZE - 1, current.row + 1); r++) {
            for (let c = Math.max(0, current.col - 1); c <= Math.min(GRID_SIZE - 1, current.col + 1); c++) {
              queue.push({ row: r, col: c });
            }
          }
          break;
      }
    }
  }

  return Array.from(toRemove).map(s => {
    const [r, c] = s.split(',').map(Number);
    return { row: r, col: c };
  });
};

export const hasPossibleMoves = (grid: Grid): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      // Try swap right
      if (c < GRID_SIZE - 1) {
        if (checkPotentialMatch(grid, r, c, r, c + 1)) {return true;}
      }
      // Try swap down
      if (r < GRID_SIZE - 1) {
        if (checkPotentialMatch(grid, r, c, r + 1, c)) {return true;}
      }
    }
  }
  return false;
};

const checkPotentialMatch = (grid: Grid, r1: number, c1: number, r2: number, c2: number): boolean => {
  const tempGrid = grid.map(row => [...row]);
  const t1 = tempGrid[r1][c1];
  const t2 = tempGrid[r2][c2];
  if (!t1 || !t2) {return false;}

  tempGrid[r1][c1] = { ...t2, row: r1, col: c1 };
  tempGrid[r2][c2] = { ...t1, row: r2, col: c2 };

  return checkMatches(tempGrid).length > 0;
};

export const shuffleGrid = (grid: Grid): Grid => {
  let newGrid: Grid;
  do {
    const flat = grid.flat().filter(c => c !== null) as Candy[];
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i].type, flat[j].type] = [flat[j].type, flat[i].type];
    }
    newGrid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      newGrid[r] = flat.slice(r * GRID_SIZE, (r + 1) * GRID_SIZE).map((c, cIdx) => ({
        ...c,
        row: r,
        col: cIdx,
      }));
    }
  } while (checkMatches(newGrid).length > 0 || !hasPossibleMoves(newGrid));
  return newGrid;
};

export const applyCascading = (grid: Grid): Grid => {
  const newGrid: Grid = grid.map(row => [...row]);

  for (let c = 0; c < GRID_SIZE; c++) {
    let emptySlots = 0;
    for (let r = GRID_SIZE - 1; r >= 0; r--) {
      if (newGrid[r][c] === null) {
        emptySlots++;
      } else if (emptySlots > 0) {
        newGrid[r + emptySlots][c] = { ...newGrid[r][c]!, row: r + emptySlots, col: c };
        newGrid[r][c] = null;
      }
    }

    for (let r = 0; r < emptySlots; r++) {
      newGrid[r][c] = {
        id: `candy-new-${r}-${c}-${Math.random()}`,
        type: Math.floor(Math.random() * CANDY_TYPES),
        row: r,
        col: c,
        special: SpecialType.NONE,
      };
    }
  }
  return newGrid;
};

export const clearPosition = (grid: Grid, row: number, col: number): { row: number; col: number }[] => {
  const candy = grid[row][col];
  if (!candy) return [];
  
  // If it's a special candy, use the existing logic to get all affected
  if (candy.special && candy.special !== SpecialType.NONE) {
    return getAffectedCandies(grid, [{ row, col }]);
  }
  
  // Otherwise just clear this one
  return [{ row, col }];
};
