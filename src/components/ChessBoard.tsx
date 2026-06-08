import { useCallback, useState, useRef, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../store/useGameStore';
import { useThemeStore } from '../store/useThemeStore';
import type { Square } from 'chess.js';

function CustomPiece({ pieceCode, pieceTheme }: { pieceCode: string; pieceTheme: { prefix: string } }) {
  const color = pieceCode[0] === 'w' ? 'w' : 'b';
  const type = pieceCode[1].toLowerCase();
  const names: Record<string, string> = { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N', p: 'P' };
  const url = `https://lichess1.org/assets/piece/${pieceTheme.prefix}/${color}${names[type]}.svg`;
  return (
    <img
      src={url}
      alt={pieceCode}
      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
      draggable={false}
    />
  );
}

export default function ChessBoard() {
  const {
    chess, playerColor, isAIGame, status, tryMove, makeMove,
    lastMoveFrom, lastMoveTo, isCheck,
  } = useGameStore();
  const { boardTheme, pieceTheme } = useThemeStore();
  const [rightClickedSquares, setRightClickedSquares] = useState<Record<string, React.CSSProperties>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const [boardWidth, setBoardWidth] = useState(480);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setBoardWidth(Math.min(560, w));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // onPieceDrop must return boolean SYNCHRONOUSLY for the board to animate correctly
  const onPieceDrop = useCallback((
    piece: { isSparePiece: boolean; pieceType: string; position: string },
    sourceSquare: string,
    targetSquare: string | null,
  ): boolean => {
    if (status !== 'active' || !targetSquare) return false;

    const moveColor = piece.pieceType[0];
    const isCorrectColor = (moveColor === 'w' && playerColor === 'white') || (moveColor === 'b' && playerColor === 'black');
    if (!isCorrectColor) return false;

    const from = sourceSquare as Square;
    const to = targetSquare as Square;

    // Check for pawn promotion - auto-promote to queen
    const isPawn = piece.pieceType[1] === 'P';
    const isPromotionRank = (moveColor === 'w' && to[1] === '8') || (moveColor === 'b' && to[1] === '1');
    const promotion = (isPawn && isPromotionRank) ? 'q' : undefined;

    // Validate synchronously - must return boolean immediately
    const isValid = tryMove(from, to, promotion);
    if (isValid) {
      // Apply the move (updates state asynchronously but that's fine)
      makeMove(from, to, promotion);
    }
    return isValid;
  }, [playerColor, isAIGame, status, tryMove, makeMove]);

  const getSquareStyles = useCallback((): Record<string, React.CSSProperties> => {
    const styles: Record<string, React.CSSProperties> = {};
    if (lastMoveFrom) {
      styles[lastMoveFrom] = { background: 'rgba(255, 255, 0, 0.3)' };
    }
    if (lastMoveTo) {
      styles[lastMoveTo] = { background: 'rgba(255, 255, 0, 0.4)' };
    }
    if (isCheck) {
      const board = chess.board();
      for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
          const piece = board[r][f];
          if (piece && piece.type === 'k' && piece.color === chess.turn()) {
            const file = String.fromCharCode(97 + f);
            const rank = 8 - r;
            styles[`${file}${rank}`] = { background: 'radial-gradient(circle, rgba(255,0,0,0.6) 0%, rgba(255,0,0,0.3) 50%, transparent 70%)' };
          }
        }
      }
    }
    return { ...styles, ...rightClickedSquares };
  }, [lastMoveFrom, lastMoveTo, isCheck, chess, rightClickedSquares]);

  const getCustomPieces = useCallback(() => {
    const pieceCodes = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP', 'bK', 'bQ', 'bR', 'bB', 'bN', 'bP'];
    const map: Record<string, (props?: { square?: string }) => JSX.Element> = {};
    for (const code of pieceCodes) {
      map[code] = () => <CustomPiece pieceCode={code} pieceTheme={pieceTheme} />;
    }
    return map;
  }, [pieceTheme]);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <Chessboard
        options={{
          position: chess.fen(),
          onPieceDrop,
          boardOrientation: playerColor === 'black' ? 'black' : 'white',
          squareStyles: getSquareStyles(),
          onSquareRightClick: ({ square }: { piece: unknown; square: string }) => {
            setRightClickedSquares(prev => ({
              ...prev,
              [square]: { backgroundColor: 'rgba(0, 0, 255, 0.3)' },
            }));
          },
          darkSquareStyle: { backgroundColor: boardTheme.darkSquare },
          lightSquareStyle: { backgroundColor: boardTheme.lightSquare },
          allowDragging: status === 'active',
          boardStyle: {
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          },
          animationDurationInMs: 200,
          showAnimations: true,
          pieces: getCustomPieces(),
          showNotation: true,
        }}
      />
    </div>
  );
}
