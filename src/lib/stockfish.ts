type StockfishCallback = (bestMove: string, evaluation: number) => void;

class StockfishEngine {
  private worker: Worker | null = null;
  private onMessage: ((msg: string) => void) | null = null;
  private bestMoveCallback: StockfishCallback | null = null;
  private currentEvaluation: number = 0;
  private isReady = false;

  async init(): Promise<void> {
    if (this.isReady && this.worker) return;
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker('/stockfish.js');
        this.onMessage = (msg: string) => {
          if (msg.includes('readyok')) {
            this.isReady = true;
            resolve();
          }
          if (msg.startsWith('info') && msg.includes('score cp')) {
            const match = msg.match(/score cp (-?\d+)/);
            if (match) this.currentEvaluation = parseInt(match[1]);
          }
          if (msg.startsWith('bestmove')) {
            const moveMatch = msg.match(/bestmove (\w+)/);
            if (moveMatch && this.bestMoveCallback) {
              this.bestMoveCallback(moveMatch[1], this.currentEvaluation);
              this.bestMoveCallback = null;
            }
          }
        };
        this.worker.onmessage = (e: MessageEvent) => {
          if (this.onMessage) this.onMessage(e.data);
        };
        this.worker.onerror = (e: ErrorEvent) => {
          reject(e);
        };
        this.sendCommand('uci');
        this.sendCommand('isready');
      } catch (err) {
        reject(err);
      }
    });
  }

  private sendCommand(cmd: string) {
    if (this.worker) this.worker.postMessage(cmd);
  }

  setDifficulty(level: 'beginner' | 'intermediate' | 'advanced' | 'master') {
    const skillMap = { beginner: 1, intermediate: 5, advanced: 10, master: 20 };
    this.sendCommand(`setoption name Skill Level value ${skillMap[level]}`);
  }

  async getBestMove(fen: string, thinkTime: number = 500): Promise<{ move: string; evaluation: number }> {
    return new Promise((resolve) => {
      this.bestMoveCallback = (bestMove: string, evaluation: number) => {
        resolve({ move: bestMove, evaluation });
      };
      this.sendCommand('ucinewgame');
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand(`go movetime ${thinkTime}`);
    });
  }

  async evaluatePosition(fen: string): Promise<number> {
    return new Promise((resolve) => {
      this.bestMoveCallback = (_move: string, evaluation: number) => {
        resolve(evaluation);
      };
      this.sendCommand('ucinewgame');
      this.sendCommand(`position fen ${fen}`);
      this.sendCommand('go depth 15');
    });
  }

  destroy() {
    if (this.worker) {
      this.sendCommand('quit');
      this.worker.terminate();
      this.worker = null;
      this.isReady = false;
    }
  }
}

export const stockfishEngine = new StockfishEngine();
