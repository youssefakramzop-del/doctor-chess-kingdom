import { create } from 'zustand';
import { Chess, type Square } from 'chess.js';
import { stockfishEngine } from '../lib/stockfish';
import { playMoveSound, playCaptureSound, playCheckSound, playCastlingSound, playIllegalSound, playGameEndSound, playPromotionSound } from '../lib/sounds';

type GameMode = 'bullet' | 'blitz' | 'rapid' | 'ai';
type AIDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'master';
type PlayerColor = 'white' | 'black';

export interface TimeControlConfig {
  time: number;
  increment: number;
}

interface GameState {
  chess: Chess;
  gameId: string | null;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  playerColor: PlayerColor;
  isAIGame: boolean;
  status: 'idle' | 'waiting' | 'active' | 'completed';
  result: string | null;
  resultReason: string | null;
  whiteTime: number;
  blackTime: number;
  increment: number;
  moveHistory: Array<{ san: string; from: string; to: string; fen: string; time: number }>;
  evaluations: number[];
  lastMoveFrom: Square | null;
  lastMoveTo: Square | null;
  isCheck: boolean;
  pendingPromotion: { from: Square; to: Square; color: string } | null;
  soundEnabled: boolean;
  timeConfig: TimeControlConfig;

  newGame: (mode: GameMode, timeConfig: TimeControlConfig, difficulty?: AIDifficulty, color?: PlayerColor) => Promise<void>;
  tryMove: (from: Square, to: Square, promotion?: string) => boolean;
  makeMove: (from: Square, to: Square, promotion?: string) => void;
  resign: () => void;
  offerDraw: () => void;
  acceptDraw: () => void;
  tickTimer: () => void;
  resetGame: () => void;
  aiMove: () => void;
  toggleSound: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  chess: new Chess(),
  gameId: null,
  gameMode: 'rapid',
  aiDifficulty: 'intermediate',
  playerColor: 'white',
  isAIGame: false,
  status: 'idle',
  result: null,
  resultReason: null,
  whiteTime: 600,
  blackTime: 600,
  increment: 5,
  moveHistory: [],
  evaluations: [],
  lastMoveFrom: null,
  lastMoveTo: null,
  isCheck: false,
  pendingPromotion: null,
  soundEnabled: true,
  timeConfig: { time: 600, increment: 5 },

  newGame: async (mode, timeConfig, difficulty, color) => {
    const chess = new Chess();
    const isAI = mode === 'ai';
    const playerColorFinal = color || (Math.random() > 0.5 ? 'white' : 'black');

    set({
      chess,
      gameMode: mode,
      aiDifficulty: difficulty || 'intermediate',
      playerColor: playerColorFinal,
      isAIGame: isAI,
      status: 'active',
      result: null,
      resultReason: null,
      whiteTime: timeConfig.time,
      blackTime: timeConfig.time,
      increment: timeConfig.increment,
      moveHistory: [],
      evaluations: [],
      lastMoveFrom: null,
      lastMoveTo: null,
      isCheck: false,
      pendingPromotion: null,
      timeConfig,
    });

    if (isAI) {
      try {
        await stockfishEngine.init();
        stockfishEngine.setDifficulty(difficulty || 'intermediate');
      } catch (e) {
        console.error('Stockfish init failed:', e);
      }
      if (playerColorFinal === 'black') {
        setTimeout(() => get().aiMove(), 500);
      }
    }
  },

  // Synchronous move validation - returns true/false immediately
  // The chess board library requires a synchronous boolean response
  tryMove: (from, to, promotion) => {
    const state = get();
    if (state.status !== 'active') return false;

    const chess = state.chess;
    const turn = chess.turn();
    const isPlayerTurn = (turn === 'w' && state.playerColor === 'white') || (turn === 'b' && state.playerColor === 'black');
    if (state.isAIGame && !isPlayerTurn) return false;

    // Validate the move without modifying the board
    const testChess = new Chess(chess.fen());
    const testResult = testChess.move({ from, to, promotion });
    if (!testResult) {
      if (state.soundEnabled) playIllegalSound();
      return false;
    }

    // Move is valid - apply it synchronously and return true
    // The actual chess state is updated in makeMove which is called separately
    return true;
  },

  // Apply the move and update all state (called after tryMove returns true)
  makeMove: (from, to, promotion) => {
    const state = get();
    const chess = state.chess;

    const moveResult = chess.move({ from, to, promotion });
    if (!moveResult) return;

    const isCheck = chess.inCheck();
    const isGameOver = chess.isGameOver();
    let result: string | null = null;
    let resultReason: string | null = null;

    if (isGameOver) {
      if (chess.isCheckmate()) {
        result = chess.turn() === 'w' ? 'black_wins' : 'white_wins';
        resultReason = 'checkmate';
      } else if (chess.isStalemate()) {
        result = 'draw';
        resultReason = 'stalemate';
      } else if (chess.isDraw()) {
        result = 'draw';
        resultReason = chess.isThreefoldRepetition() ? 'threefold_repetition' :
          chess.isInsufficientMaterial() ? 'insufficient_material' : 'fifty_move_rule';
      }
    }

    // Play sounds
    if (state.soundEnabled) {
      if (isGameOver) playGameEndSound();
      else if (isCheck) playCheckSound();
      else if (moveResult.captured) playCaptureSound();
      else if (moveResult.san.includes('O-O')) playCastlingSound();
      else if (moveResult.promotion) playPromotionSound();
      else playMoveSound();
    }

    const newHistory = [...state.moveHistory, {
      san: moveResult.san,
      from: moveResult.from,
      to: moveResult.to,
      fen: chess.fen(),
      time: Date.now(),
    }];

    // Add increment to the moving player's time
    const movingColor = moveResult.color === 'w' ? 'white' : 'black';
    const whiteTimeUpdate = movingColor === 'white' ? state.whiteTime + state.increment : state.whiteTime;
    const blackTimeUpdate = movingColor === 'black' ? state.blackTime + state.increment : state.blackTime;

    set({
      chess,
      moveHistory: newHistory,
      lastMoveFrom: moveResult.from as Square,
      lastMoveTo: moveResult.to as Square,
      isCheck,
      status: isGameOver ? 'completed' : 'active',
      result,
      resultReason,
      whiteTime: whiteTimeUpdate,
      blackTime: blackTimeUpdate,
    });

    // Trigger AI move after state update
    if (state.isAIGame && !isGameOver) {
      const aiColor = state.playerColor === 'white' ? 'black' : 'white';
      const isAITurn = (chess.turn() === 'w' && aiColor === 'white') ||
                       (chess.turn() === 'b' && aiColor === 'black');
      if (isAITurn) {
        setTimeout(() => get().aiMove(), 300);
      }
    }
  },

  aiMove: () => {
    const state = get();
    const chess = state.chess;
    if (chess.isGameOver()) return;

    stockfishEngine.getBestMove(chess.fen(), 500).then((result) => {
      if (!result.move || result.move.length < 4) {
        // Fallback: random legal move
        const moves = chess.moves({ verbose: true });
        if (moves.length > 0) {
          const m = moves[Math.floor(Math.random() * moves.length)];
          const valid = get().tryMove(m.from as Square, m.to as Square, m.promotion);
          if (valid) get().makeMove(m.from as Square, m.to as Square, m.promotion);
        }
        return;
      }
      const from = result.move.substring(0, 2) as Square;
      const to = result.move.substring(2, 4) as Square;
      const promotion = result.move.length > 4 ? result.move[4] : undefined;
      const valid = get().tryMove(from, to, promotion);
      if (valid) get().makeMove(from, to, promotion);
    }).catch(() => {
      // Fallback: random legal move
      const moves = chess.moves({ verbose: true });
      if (moves.length > 0) {
        const m = moves[Math.floor(Math.random() * moves.length)];
        const valid = get().tryMove(m.from as Square, m.to as Square, m.promotion);
        if (valid) get().makeMove(m.from as Square, m.to as Square, m.promotion);
      }
    });
  },

  resign: () => {
    const state = get();
    const result = state.playerColor === 'white' ? 'black_wins' : 'white_wins';
    if (state.soundEnabled) playGameEndSound();
    set({ status: 'completed', result, resultReason: 'resignation' });
  },

  offerDraw: () => {
    const state = get();
    if (state.isAIGame) {
      if (state.soundEnabled) playGameEndSound();
      set({ status: 'completed', result: 'draw', resultReason: 'agreement' });
    }
  },

  acceptDraw: () => {
    const state = get();
    if (state.soundEnabled) playGameEndSound();
    set({ status: 'completed', result: 'draw', resultReason: 'agreement' });
  },

  tickTimer: () => {
    const state = get();
    if (state.status !== 'active') return;
    const turn = state.chess.turn();
    if (turn === 'w') {
      const newTime = Math.max(0, state.whiteTime - 1);
      if (newTime <= 0) {
        if (state.soundEnabled) playGameEndSound();
        set({ whiteTime: 0, status: 'completed', result: 'black_wins', resultReason: 'timeout' });
      } else {
        set({ whiteTime: newTime });
      }
    } else {
      const newTime = Math.max(0, state.blackTime - 1);
      if (newTime <= 0) {
        if (state.soundEnabled) playGameEndSound();
        set({ blackTime: 0, status: 'completed', result: 'white_wins', resultReason: 'timeout' });
      } else {
        set({ blackTime: newTime });
      }
    }
  },

  resetGame: () => {
    stockfishEngine.destroy();
    set({
      chess: new Chess(),
      gameId: null,
      gameMode: 'rapid',
      aiDifficulty: 'intermediate',
      playerColor: 'white',
      isAIGame: false,
      status: 'idle',
      result: null,
      resultReason: null,
      whiteTime: 600,
      blackTime: 600,
      increment: 5,
      moveHistory: [],
      evaluations: [],
      lastMoveFrom: null,
      lastMoveTo: null,
      isCheck: false,
      pendingPromotion: null,
      timeConfig: { time: 600, increment: 5 },
    });
  },

  toggleSound: () => {
    set((s) => ({ soundEnabled: !s.soundEnabled }));
  },
}));
