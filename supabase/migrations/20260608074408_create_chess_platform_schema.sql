-- Chess Platform Database Schema

-- Profiles table (extends Supabase auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  elo_rapid INTEGER DEFAULT 1200,
  elo_blitz INTEGER DEFAULT 1200,
  elo_bullet INTEGER DEFAULT 1200,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  games_lost INTEGER DEFAULT 0,
  games_drawn INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  black_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  game_mode TEXT NOT NULL DEFAULT 'rapid' CHECK (game_mode IN ('bullet', 'blitz', 'rapid', 'ai')),
  ai_difficulty TEXT CHECK (ai_difficulty IN ('beginner', 'intermediate', 'advanced', 'master')),
  time_control_white INTEGER DEFAULT 600, -- seconds remaining
  time_control_black INTEGER DEFAULT 600, -- seconds remaining
  initial_time INTEGER DEFAULT 600, -- initial time in seconds
  increment INTEGER DEFAULT 0, -- increment per move in seconds
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
  result TEXT CHECK (result IN ('white_wins', 'black_wins', 'draw', 'abandoned')),
  result_reason TEXT,
  pgn TEXT,
  current_fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  move_count INTEGER DEFAULT 0,
  is_ai_game BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Moves table
CREATE TABLE moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  move_number INTEGER NOT NULL,
  san TEXT NOT NULL,
  from_square TEXT NOT NULL,
  to_square TEXT NOT NULL,
  fen_after TEXT NOT NULL,
  time_spent INTEGER DEFAULT 0, -- milliseconds
  evaluation INTEGER, -- centipawns from white perspective
  is_blunder BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_quick_message BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchmaking queue
CREATE TABLE matchmaking_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_mode TEXT NOT NULL DEFAULT 'rapid' CHECK (game_mode IN ('bullet', 'blitz', 'rapid')),
  elo_range INTEGER DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friends system
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('friend_request', 'game_invite', 'game_result', 'achievement')),
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "select_profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Games policies
CREATE POLICY "select_games" ON games FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_games" ON games FOR INSERT TO authenticated WITH CHECK (auth.uid() = white_player_id OR auth.uid() = black_player_id);
CREATE POLICY "update_own_games" ON games FOR UPDATE TO authenticated USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);
CREATE POLICY "delete_own_games" ON games FOR DELETE TO authenticated USING (auth.uid() = white_player_id OR auth.uid() = black_player_id);

-- Moves policies
CREATE POLICY "select_moves" ON moves FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_moves" ON moves FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM games WHERE games.id = moves.game_id AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())));
CREATE POLICY "delete_own_moves" ON moves FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM games WHERE games.id = moves.game_id AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())));

-- Chat messages policies
CREATE POLICY "select_chat" ON chat_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM games WHERE games.id = chat_messages.game_id AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())));
CREATE POLICY "insert_chat" ON chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id AND EXISTS (SELECT 1 FROM games WHERE games.id = chat_messages.game_id AND (games.white_player_id = auth.uid() OR games.black_player_id = auth.uid())));

-- Matchmaking policies
CREATE POLICY "select_matchmaking" ON matchmaking_queue FOR SELECT TO authenticated USING (auth.uid() = player_id OR status = 'searching');
CREATE POLICY "insert_own_matchmaking" ON matchmaking_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);
CREATE POLICY "update_own_matchmaking" ON matchmaking_queue FOR UPDATE TO authenticated USING (auth.uid() = player_id);
CREATE POLICY "delete_own_matchmaking" ON matchmaking_queue FOR DELETE TO authenticated USING (auth.uid() = player_id);

-- Friendships policies
CREATE POLICY "select_friendships" ON friendships FOR SELECT TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "insert_own_friendship" ON friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "update_own_friendship" ON friendships FOR UPDATE TO authenticated USING (auth.uid() = addressee_id OR auth.uid() = requester_id);
CREATE POLICY "delete_own_friendship" ON friendships FOR DELETE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Notifications policies
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_games_white_player ON games(white_player_id);
CREATE INDEX idx_games_black_player ON games(black_player_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_moves_game_id ON moves(game_id);
CREATE INDEX idx_chat_game_id ON chat_messages(game_id);
CREATE INDEX idx_matchmaking_status ON matchmaking_queue(status, game_mode);
CREATE INDEX idx_friendships_users ON friendships(requester_id, addressee_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
