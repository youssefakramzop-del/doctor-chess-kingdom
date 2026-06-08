import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  elo_rapid: number;
  elo_blitz: number;
  elo_bullet: number;
  games_played: number;
  games_won: number;
  games_lost: number;
  games_drawn: number;
  created_at: string;
  updated_at: string;
};

export type Game = {
  id: string;
  white_player_id: string | null;
  black_player_id: string | null;
  game_mode: 'bullet' | 'blitz' | 'rapid' | 'ai';
  ai_difficulty: 'beginner' | 'intermediate' | 'advanced' | 'master' | null;
  time_control_white: number;
  time_control_black: number;
  initial_time: number;
  increment: number;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  result: 'white_wins' | 'black_wins' | 'draw' | 'abandoned' | null;
  result_reason: string | null;
  pgn: string | null;
  current_fen: string;
  move_count: number;
  is_ai_game: boolean;
  created_at: string;
  updated_at: string;
};

export type Move = {
  id: string;
  game_id: string;
  move_number: number;
  san: string;
  from_square: string;
  to_square: string;
  fen_after: string;
  time_spent: number;
  evaluation: number | null;
  is_blunder: boolean;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  game_id: string;
  player_id: string;
  message: string;
  is_quick_message: boolean;
  created_at: string;
};

export type MatchmakingEntry = {
  id: string;
  player_id: string;
  game_mode: 'bullet' | 'blitz' | 'rapid';
  elo_range: number;
  status: 'searching' | 'matched' | 'cancelled';
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'friend_request' | 'game_invite' | 'game_result' | 'achievement';
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};
