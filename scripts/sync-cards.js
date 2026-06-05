import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const API_BASE = 'https://digimoncard.io/api-public';

function extractSecurityEffect(text) {
  if (!text) return { effect: null, securityEffect: null };
  const secIdx = text.search(/\[Security\]/i);
  if (secIdx === -1) return { effect: text, securityEffect: null };

  const keywords = "On Play|When Digivolving|All Turns|Start of Your Turn|Start of Your Main Phase|Opponent's Turn|Main|Your Turn|When Attacking|On Deletion|When This Digimon|When Deleted|Security Check|Delay|Retaliation|When a|When your|When an|When this|Your Opponent|Your opponent";
  const afterSec = text.slice(secIdx);
  const regex = new RegExp(`\\[Security\\]\\s*([\\s\\S]*?)(?=\\[(?:${keywords})\\]|$)`, 'i');
  const match = afterSec.match(regex);

  if (match) {
    const security = ('[Security] ' + match[1].trim()).trim();
    const before = text.slice(0, secIdx).trim();
    const after = afterSec.slice(match[0].length).trim();
    const effect = [before, after].filter(Boolean).join(' ') || null;
    return { effect, securityEffect: security };
  }
  return { effect: text, securityEffect: null };
}

function parseSetName(raw, cardNumber) {
  if (!raw) return '';
  const arr = Array.isArray(raw) ? raw : [raw];
  const setPattern = /^(BT|EX|ST|RB|AD|RE|P|LM)-\d+/i;

  // Extract prefix from card number (e.g. "BT18" from "BT18-009")
  const cardPrefix = cardNumber?.match(/^(BT|EX|ST|RB|AD|RE|P|LM)\d+/i)?.[0]?.toUpperCase() || '';

  // First pass: prefer the set that matches the card number prefix
  if (cardPrefix) {
    const cardPrefixLetter = cardPrefix.replace(/\d+$/, '').toUpperCase();
    const cardPrefixNum = parseInt(cardPrefix.match(/\d+$/)?.[0] || '0', 10);
    for (const s of arr) {
      if (s && typeof s === 'string') {
        const candidate = s.split(':')[0].trim();
        const setMatch = candidate.match(/^(BT|EX|ST|RB|AD|RE|P|LM)-(\d+)/i);
        if (setMatch && setMatch[1].toUpperCase() === cardPrefixLetter && parseInt(setMatch[2], 10) === cardPrefixNum) {
          return candidate;
        }
      }
    }
  }

  // Second pass: first set matching the pattern
  for (const s of arr) {
    if (s && typeof s === 'string') {
      const candidate = s.split(':')[0].trim();
      if (setPattern.test(candidate)) return candidate;
    }
  }

  const first = arr[0];
  if (!first || typeof first !== 'string') return '';
  return first.split(':')[0].trim();
}

async function syncCards() {
  console.log('Fetching all cards from digimoncard.io API...');
  const res = await fetch(`${API_BASE}/search?series=${encodeURIComponent('Digimon Card Game')}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text.slice(0, 200)}`);
  }
  const cards = await res.json();
  if (!Array.isArray(cards)) throw new Error('API did not return an array');
  console.log(`Fetched ${cards.length} cards`);

  let inserted = 0;
  const batchSize = 250;

  // Deduplicate by card_number (keep last occurrence)
  const seen = new Map();
  for (const c of cards) {
    seen.set(c.id, c);
  }
  const unique = [...seen.values()];
  console.log(`After dedup: ${unique.length} unique cards`);

  for (let i = 0; i < unique.length; i += batchSize) {
    const batch = unique.slice(i, i + batchSize).map(c => {
      let effect, securityEffect, inheritedEffect;
      if (c.type === 'Option') {
        effect = c.main_effect || null;
        securityEffect = c.source_effect || null;
        inheritedEffect = null;
      } else {
        // Digimon and Tamer: extract [Security] from main_effect
        const extracted = extractSecurityEffect(c.main_effect);
        effect = extracted.effect;
        securityEffect = extracted.securityEffect;
        inheritedEffect = c.source_effect || null;

        // Override: if source_effect is itself a Security Effect, move it
        if (c.source_effect && /^(Security Effect\s*)?\[Security\]/i.test(c.source_effect)) {
          securityEffect = c.source_effect;
          inheritedEffect = null;
        }
      }
      return {
        card_number: c.id,
        name: c.name || '',
        set_name: parseSetName(c.set_name, c.id) || '',
        color: c.color2 ? `${c.color},${c.color2}` : (c.color || null),
        card_type: c.type || null,
        level: c.level != null ? String(c.level) : null,
        form: c.form || null,
        attribute: c.attribute || null,
        type: c.digi_type || null,
        digi_type2: c.digi_type2 || null,
        digi_type3: c.digi_type3 || null,
        digi_type4: c.digi_type4 || null,
        stage: c.stage || null,
        dp: c.dp ? parseInt(c.dp) : null,
        play_cost: c.play_cost ? parseInt(c.play_cost) : null,
        evolution_cost: c.evolution_cost ? parseInt(c.evolution_cost) : null,
        evolution_color: c.evolution_color || null,
        evolution_level: c.evolution_level != null ? String(c.evolution_level) : null,
        rarity: c.rarity?.toUpperCase() || null,
        artist: c.artist || null,
        effect,
        inherited_effect: inheritedEffect,
        security_effect: securityEffect,
        alt_effect: c.alt_effect || null,
        xros_req: c.xros_req || null,
        link_requirements: c.link_requirements || null,
        link_dp: c.link_dp ? parseInt(c.link_dp) : null,
        image_url: `https://world.digimoncard.com/images/cardlist/card/${c.id}.png`,
        date_added: c.date_added || null
      };
    });

    const { error } = await supabase.from('cards').upsert(batch, {
      onConflict: 'card_number',
      ignoreDuplicates: false
    });

    if (error) {
      console.error(`Batch error at ${i}:`, error);
    } else {
      inserted += batch.length;
    }

    const pct = ((i + batch.length) / unique.length * 100).toFixed(1);
    console.log(`Progress: ${pct}% (${inserted}/${cards.length})`);
  }

  console.log(`Sync complete. ${inserted} cards inserted/updated.`);
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  syncCards().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
  });
}

export default syncCards;
