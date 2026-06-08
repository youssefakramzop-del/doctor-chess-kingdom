export function calculateElo(
  playerElo: number,
  opponentElo: number,
  result: 'win' | 'loss' | 'draw',
  kFactor: number = 32
): number {
  const expectedScore = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const actualScore = result === 'win' ? 1 : result === 'loss' ? 0 : 0.5;
  const newElo = Math.round(playerElo + kFactor * (actualScore - expectedScore));
  return Math.max(100, newElo);
}

export function getEloTitle(elo: number): { title: string; color: string } {
  if (elo >= 2400) return { title: 'Grandmaster', color: '#ff9800' };
  if (elo >= 2200) return { title: 'Master', color: '#f44336' };
  if (elo >= 2000) return { title: 'Expert', color: '#9c27b0' };
  if (elo >= 1800) return { title: 'Class A', color: '#2196f3' };
  if (elo >= 1600) return { title: 'Class B', color: '#4caf50' };
  if (elo >= 1400) return { title: 'Class C', color: '#009688' };
  if (elo >= 1200) return { title: 'Class D', color: '#607d8b' };
  if (elo >= 1000) return { title: 'Class E', color: '#795548' };
  return { title: 'Beginner', color: '#9e9e9e' };
}

export function getTimeControl(mode: 'bullet' | 'blitz' | 'rapid'): { time: number; increment: number } {
  switch (mode) {
    case 'bullet': return { time: 60, increment: 1 };
    case 'blitz': return { time: 300, increment: 3 };
    case 'rapid': return { time: 600, increment: 5 };
  }
}
