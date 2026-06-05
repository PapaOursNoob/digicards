-- Indexes for cards table filter columns
CREATE INDEX idx_cards_set_name ON cards(set_name);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_card_type ON cards(card_type);
CREATE INDEX idx_cards_color ON cards(color);
CREATE INDEX idx_cards_level ON cards(level);
CREATE INDEX idx_cards_name ON cards(name);
