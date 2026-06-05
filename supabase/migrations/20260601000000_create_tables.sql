-- Table de cache du référentiel officiel
CREATE TABLE cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number TEXT UNIQUE NOT NULL,       -- ex: BT1-001
  name TEXT NOT NULL,
  set_name TEXT NOT NULL,                 -- ex: BT-01
  set_release_date DATE,
  color TEXT,                             -- Red/Blue/Yellow/Green/Black/Purple/White/Multi
  card_type TEXT,                         -- Digimon/Tamer/Option/Digi-Egg
  level TEXT,
  form TEXT,
  attribute TEXT,
  type TEXT,
  dp INTEGER,
  play_cost INTEGER,
  evolution_cost INTEGER,
  rarity TEXT,                            -- C/U/R/SR/SEC/P
  effect TEXT,
  inherited_effect TEXT,
  image_url TEXT,
  last_synced_at TIMESTAMP DEFAULT NOW()
);

-- Collection de l'utilisateur
CREATE TABLE collection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number TEXT REFERENCES cards(card_number),
  qty_normal INTEGER DEFAULT 0,
  qty_foil INTEGER DEFAULT 0,
  condition TEXT DEFAULT 'NM',            -- NM/LP/MP/HP/D
  purchase_price DECIMAL(6,2),
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_number)
);

-- Wishlist
CREATE TABLE wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number TEXT REFERENCES cards(card_number),
  target_price DECIMAL(6,2),
  priority INTEGER DEFAULT 1,             -- 1/2/3
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_number)
);

-- Decks
CREATE TABLE decks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  cover_card TEXT REFERENCES cards(card_number),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cartes dans les decks
CREATE TABLE deck_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  card_number TEXT REFERENCES cards(card_number),
  quantity INTEGER DEFAULT 1,
  UNIQUE(deck_id, card_number)
);

-- Prices cache
CREATE TABLE prices_cache (
  card_number TEXT PRIMARY KEY,
  price_low DECIMAL(6,2),
  price_trend DECIMAL(6,2),
  price_avg DECIMAL(6,2),
  currency TEXT DEFAULT 'EUR',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices_cache ENABLE ROW LEVEL SECURITY;

-- Policies for cards table (public read access)
CREATE POLICY "Cards are viewable by everyone" ON cards
  FOR SELECT USING (true);

-- Policies for collection table
CREATE POLICY "Users can view their own collection" ON collection
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collection items" ON collection
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collection items" ON collection
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collection items" ON collection
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for wishlist table
CREATE POLICY "Users can view their own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlist items" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlist items" ON wishlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlist items" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for decks table
CREATE POLICY "Users can view their own decks" ON decks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own decks" ON decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks" ON decks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks" ON decks
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for deck_cards table
CREATE POLICY "Users can view cards in their decks" ON deck_cards
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert cards in their decks" ON deck_cards
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can update cards in their decks" ON deck_cards
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete cards in their decks" ON deck_cards
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM decks WHERE decks.id = deck_cards.deck_id AND decks.user_id = auth.uid()
  ));

-- Policies for prices_cache table (public read access)
CREATE POLICY "Prices are viewable by everyone" ON prices_cache
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX idx_collection_user_id ON collection(user_id);
CREATE INDEX idx_collection_card_number ON collection(card_number);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX idx_wishlist_card_number ON wishlist(card_number);
CREATE INDEX idx_decks_user_id ON decks(user_id);
CREATE INDEX idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_card_number ON deck_cards(card_number);
CREATE INDEX idx_prices_cache_card_number ON prices_cache(card_number);