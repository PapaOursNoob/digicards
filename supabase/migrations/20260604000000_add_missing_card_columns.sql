-- Add missing columns from digimoncard.io API
ALTER TABLE cards ADD COLUMN stage TEXT;
ALTER TABLE cards ADD COLUMN artist TEXT;
ALTER TABLE cards ADD COLUMN digi_type2 TEXT;
ALTER TABLE cards ADD COLUMN digi_type3 TEXT;
ALTER TABLE cards ADD COLUMN digi_type4 TEXT;
ALTER TABLE cards ADD COLUMN evolution_color TEXT;
ALTER TABLE cards ADD COLUMN evolution_level TEXT;
ALTER TABLE cards ADD COLUMN xros_req TEXT;
ALTER TABLE cards ADD COLUMN link_requirements TEXT;
ALTER TABLE cards ADD COLUMN link_dp INTEGER;
ALTER TABLE cards ADD COLUMN alt_effect TEXT;
ALTER TABLE cards ADD COLUMN date_added TIMESTAMP;

-- Indexes for new filterable columns
CREATE INDEX idx_cards_stage ON cards(stage);
CREATE INDEX idx_cards_artist ON cards(artist);
