export type BoardTheme = {
  id: string;
  name: string;
  lightSquare: string;
  darkSquare: string;
  borderColor: string;
};

export type PieceTheme = {
  id: string;
  name: string;
  prefix: string;
};

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'classic-green', name: 'Classic Green', lightSquare: '#ebecd0', darkSquare: '#779556', borderColor: '#5a7a3a' },
  { id: 'brown', name: 'Brown', lightSquare: '#f0d9b5', darkSquare: '#b58863', borderColor: '#8b6914' },
  { id: 'blue', name: 'Blue', lightSquare: '#dee3e6', darkSquare: '#8ca2ad', borderColor: '#5a7a8a' },
  { id: 'teal', name: 'Teal', lightSquare: '#d1e8e0', darkSquare: '#5d8a72', borderColor: '#3a6a4a' },
  { id: 'purple', name: 'Purple', lightSquare: '#e8dff5', darkSquare: '#8b72b8', borderColor: '#5a3d8a' },
  { id: 'red', name: 'Red', lightSquare: '#f5d5d5', darkSquare: '#c47070', borderColor: '#8a3030' },
  { id: 'orange', name: 'Orange', lightSquare: '#f5e6d0', darkSquare: '#c4944a', borderColor: '#8a6020' },
  { id: 'pink', name: 'Pink', lightSquare: '#f5d5e8', darkSquare: '#b8709a', borderColor: '#8a3050' },
  { id: 'wood', name: 'Wood', lightSquare: '#e6c89c', darkSquare: '#a67c52', borderColor: '#7a5030' },
  { id: 'marble', name: 'Marble', lightSquare: '#f0f0f0', darkSquare: '#9e9e9e', borderColor: '#606060' },
  { id: 'dark', name: 'Dark', lightSquare: '#8b8b8b', darkSquare: '#4a4a4a', borderColor: '#2a2a2a' },
  { id: 'neon', name: 'Neon', lightSquare: '#c0f0c0', darkSquare: '#30a030', borderColor: '#008000' },
  { id: 'ice', name: 'Ice', lightSquare: '#e0f0ff', darkSquare: '#70a0d0', borderColor: '#3060a0' },
  { id: 'cocoa', name: 'Cocoa', lightSquare: '#d4a574', darkSquare: '#6b3a2a', borderColor: '#3a1a0a' },
  { id: 'olive', name: 'Olive', lightSquare: '#d4d4a0', darkSquare: '#6b6b3a', borderColor: '#3a3a1a' },
  { id: 'coral', name: 'Coral', lightSquare: '#ffd5c2', darkSquare: '#d07050', borderColor: '#a04020' },
];

// Piece themes use the lichess/cburnett standard SVG piece sets
// We'll use CDN-hosted SVG pieces
export const PIECE_THEMES: PieceTheme[] = [
  { id: 'cburnett', name: 'Standard', prefix: 'cburnett' },
  { id: 'merida', name: 'Merida', prefix: 'merida' },
  { id: 'alpha', name: 'Alpha', prefix: 'alpha' },
  { id: 'spatial', name: 'Spatial', prefix: 'spatial' },
  { id: 'fresca', name: 'Fresca', prefix: 'fresca' },
  { id: 'tatiana', name: 'Tatiana', prefix: 'tatiana' },
  { id: 'maestro', name: 'Maestro', prefix: 'maestro' },
  { id: 'gioco', name: 'Gioco', prefix: 'gioco' },
  { id: 'pirate', name: 'Pirate', prefix: 'pirate' },
  { id: 'covid', name: 'Covid', prefix: 'covid' },
  { id: 'disguised', name: 'Disguised', prefix: 'disguised' },
  { id: 'fantasy', name: 'Fantasy', prefix: 'fantasy' },
  { id: 'horsey', name: 'Horsey', prefix: 'horsey' },
  { id: 'reilly', name: 'Reilly', prefix: 'reilly' },
  { id: 'kosal', name: 'Kosal', prefix: 'kosal' },
  { id: 'letter', name: 'Letter', prefix: 'letter' },
];

const PIECE_BASE_URL = 'https://lichess1.org/assets/piece';

export function getPieceSvgUrl(theme: PieceTheme, piece: string): string {
  const color = piece === piece.toUpperCase() ? 'w' : 'b';
  const type = piece.toLowerCase();
  const names: Record<string, string> = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' };
  return `${PIECE_BASE_URL}/${theme.prefix}/${color}${names[type]}.svg`;
}

export function createPieceImageMap(theme: PieceTheme): Record<string, React.CSSProperties> {
  const pieces = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
  const map: Record<string, React.CSSProperties> = {};
  for (const p of pieces) {
    const color = p[0] === 'w' ? 'w' : 'b';
    const type = p[1].toLowerCase();
    const names: Record<string, string> = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' };
    const url = `${PIECE_BASE_URL}/${theme.prefix}/${color}${names[type]}.svg`;
    map[p] = {
      backgroundImage: `url(${url})`,
      backgroundSize: '100%',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    };
  }
  return map;
}
