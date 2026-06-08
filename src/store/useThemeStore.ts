import { create } from 'zustand';
import { BOARD_THEMES, PIECE_THEMES, type BoardTheme, type PieceTheme } from '../lib/themes';

type Theme = 'dark' | 'light';

interface ThemeState {
  theme: Theme;
  boardTheme: BoardTheme;
  pieceTheme: PieceTheme;
  toggleTheme: () => void;
  setBoardTheme: (theme: BoardTheme) => void;
  setPieceTheme: (theme: PieceTheme) => void;
}

const savedBoard = localStorage.getItem('boardTheme');
const savedPiece = localStorage.getItem('pieceTheme');

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
  boardTheme: BOARD_THEMES.find(t => t.id === savedBoard) || BOARD_THEMES[0],
  pieceTheme: PIECE_THEMES.find(t => t.id === savedPiece) || PIECE_THEMES[0],

  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    });
  },

  setBoardTheme: (theme: BoardTheme) => {
    localStorage.setItem('boardTheme', theme.id);
    set({ boardTheme: theme });
  },

  setPieceTheme: (theme: PieceTheme) => {
    localStorage.setItem('pieceTheme', theme.id);
    set({ pieceTheme: theme });
  },
}));
