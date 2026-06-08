import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useAuthStore } from '../store/useAuthStore';
import { supabase } from '../lib/supabase';
import { stockfishEngine } from '../lib/stockfish';
import { BarChart3, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

type AnalysisMove = {
  moveNumber: number;
  san: string;
  fen: string;
  evaluation: number | null;
  isBestMove: boolean;
  isBlunder: boolean;
  isInaccuracy: boolean;
  classification: string;
};

function classifyMove(evalDiff: number): { classification: string; isBlunder: boolean; isBestMove: boolean; isInaccuracy: boolean } {
  if (Math.abs(evalDiff) < 15) return { classification: 'Best', isBlunder: false, isBestMove: true, isInaccuracy: false };
  if (Math.abs(evalDiff) < 50) return { classification: 'Good', isBlunder: false, isBestMove: false, isInaccuracy: false };
  if (Math.abs(evalDiff) < 100) return { classification: 'Inaccuracy', isBlunder: false, isBestMove: false, isInaccuracy: true };
  if (Math.abs(evalDiff) < 250) return { classification: 'Mistake', isBlunder: false, isBestMove: false, isInaccuracy: true };
  return { classification: 'Blunder', isBlunder: true, isBestMove: false, isInaccuracy: true };
}

export default function AnalysisPage() {
  const { moveHistory } = useGameStore();
  const { user } = useAuthStore();
  const [analysedMoves, setAnalysedMoves] = useState<AnalysisMove[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [recentGames, setRecentGames] = useState<Array<{ id: string; pgn: string; created_at: string }>>([]);

  useEffect(() => {
    if (user) loadRecentGames();
  }, [user]);

  const loadRecentGames = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('games')
      .select('id, pgn, created_at')
      .or(`white_player_id.eq.${user.id},black_player_id.eq.${user.id}`)
      .eq('status', 'completed')
      .not('pgn', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setRecentGames(data);
  };

  const analyzeGame = async () => {
    if (moveHistory.length === 0) return;
    setAnalyzing(true);
    setProgress(0);

    try {
      await stockfishEngine.init();
    } catch {
      console.error('Stockfish init failed');
      setAnalyzing(false);
      return;
    }

    const moves: AnalysisMove[] = [];
    const startingFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    for (let i = 0; i < moveHistory.length; i++) {
      const prevFen = i === 0 ? startingFen : moveHistory[i - 1].fen;
      const currFen = moveHistory[i].fen;

      try {
        const evalBefore = await stockfishEngine.evaluatePosition(prevFen);
        const evalAfter = await stockfishEngine.evaluatePosition(currFen);
        const evalDiff = evalAfter - evalBefore;
        const classification = classifyMove(evalDiff);

        moves.push({
          moveNumber: i + 1,
          san: moveHistory[i].san,
          fen: currFen,
          evaluation: evalAfter,
          ...classification,
        });
      } catch {
        moves.push({
          moveNumber: i + 1,
          san: moveHistory[i].san,
          fen: currFen,
          evaluation: null,
          isBestMove: false,
          isBlunder: false,
          isInaccuracy: false,
          classification: 'Unknown',
        });
      }
      setProgress(Math.round(((i + 1) / moveHistory.length) * 100));
    }

    setAnalysedMoves(moves);
    setAnalyzing(false);
  };

  const getClassColor = (classification: string) => {
    switch (classification) {
      case 'Best': return 'var(--accent-green)';
      case 'Good': return '#8bc34a';
      case 'Inaccuracy': return 'var(--accent-yellow)';
      case 'Mistake': return 'var(--accent-orange)';
      case 'Blunder': return 'var(--accent-red)';
      default: return 'var(--text-muted)';
    }
  };

  const blunders = analysedMoves.filter(m => m.isBlunder).length;
  const inaccuracies = analysedMoves.filter(m => m.isInaccuracy && !m.isBlunder).length;
  const bestMoves = analysedMoves.filter(m => m.isBestMove).length;

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-7 h-7" style={{ color: 'var(--accent-blue)' }} />
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Game Analysis</h1>
        </div>

        {/* Analyze current game */}
        {moveHistory.length > 0 && (
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Analyze Current Game</h3>
              <button onClick={analyzeGame} disabled={analyzing} className="btn-primary flex items-center gap-2 text-sm">
                {analyzing ? `Analyzing... ${progress}%` : 'Analyze Game'}
              </button>
            </div>

            {analyzing && (
              <div className="w-full h-2 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--accent-blue)' }} />
              </div>
            )}

            {/* Analysis summary */}
            {analysedMoves.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(244, 67, 54, 0.1)' }}>
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--accent-red)' }} />
                    <div className="text-lg font-bold" style={{ color: 'var(--accent-red)' }}>{blunders}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Blunders</div>
                  </div>
                  <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(255, 193, 7, 0.1)' }}>
                    <div className="text-lg font-bold" style={{ color: 'var(--accent-yellow)' }}>{inaccuracies}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Inaccuracies</div>
                  </div>
                  <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
                    <div className="text-lg font-bold" style={{ color: 'var(--accent-green)' }}>{bestMoves}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Best Moves</div>
                  </div>
                </div>

                {/* Evaluation chart */}
                <div className="mb-4">
                  <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Evaluation</h4>
                  <div className="flex items-end gap-0.5 h-24">
                    {analysedMoves.map((move, i) => {
                      const evalVal = move.evaluation || 0;
                      const height = Math.min(100, Math.abs(evalVal) / 10 + 10);
                      const isWhiteAdvantage = evalVal > 0;
                      return (
                        <div
                          key={i}
                          onClick={() => setSelectedMove(i)}
                          className="flex-1 cursor-pointer rounded-t transition-all hover:opacity-80 min-w-[4px]"
                          style={{
                            height: `${height}%`,
                            background: move.isBlunder ? 'var(--accent-red)' :
                              isWhiteAdvantage ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)',
                            outline: selectedMove === i ? '2px solid var(--accent-blue)' : 'none',
                          }}
                          title={`${move.san}: ${evalVal / 100} (${move.classification})`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>White +</span>
                    <span>Black +</span>
                  </div>
                </div>

                {/* Move list with classification */}
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1">
                    {analysedMoves.map((move, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedMove(i)}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors text-xs ${selectedMove === i ? 'ring-1' : ''}`}
                        style={{
                          background: selectedMove === i ? 'var(--bg-tertiary)' : 'transparent',
                          ringColor: selectedMove === i ? 'var(--accent-blue)' : 'transparent',
                        }}
                      >
                        <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '...'}</span>
                        <span className="font-mono font-medium" style={{ color: 'var(--text-primary)' }}>{move.san}</span>
                        <span className="text-[10px] font-semibold ml-auto px-1 rounded" style={{ background: `${getClassColor(move.classification)}20`, color: getClassColor(move.classification) }}>
                          {move.classification}
                        </span>
                        {move.evaluation !== null && (
                          <span className="text-[10px] font-mono" style={{ color: move.evaluation > 0 ? '#fff' : '#aaa' }}>
                            {move.evaluation > 0 ? '+' : ''}{(move.evaluation / 100).toFixed(1)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Recent games to analyze */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold uppercase mb-4" style={{ color: 'var(--text-muted)' }}>Analyze Past Games</h3>
          {recentGames.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No completed games to analyze. Play a game first!
            </div>
          ) : (
            <div className="space-y-2">
              {recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="text-sm" style={{ color: 'var(--text-primary)' }}>Game</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(game.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
