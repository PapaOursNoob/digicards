-- Migration: Add security_effect column to cards table
-- Some Digimon cards (Option, Tamer) have a Security Effect instead of an Inherited Effect.
-- The API stores Security Effects in the 'source_effect' field for these card types.

ALTER TABLE cards ADD COLUMN security_effect TEXT;
