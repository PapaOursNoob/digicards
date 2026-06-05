import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { extractCardNumbers } from '../utils/cardNumberParser';
import { supabase } from '../lib/supabase';

export function useCardScanner(ownedCards = new Set()) {
  const [status, setStatus] = useState('idle');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [scannedCards, setScannedCards] = useState([]);
  const [error, setError] = useState(null);

  const scanImage = useCallback(async (file, worker) => {
    const result = await worker.recognize(file);
    const cardNumbers = extractCardNumbers(result.data.text);

    const foundCards = [];
    for (const num of cardNumbers) {
      if (scannedCards.some(c => c.card_number === num)) continue;

      const { data } = await supabase
        .from('cards')
        .select('card_number, name, image_url, set_name, rarity')
        .eq('card_number', num)
        .single();

      if (data) {
        foundCards.push({ ...data, owned: ownedCards.has(num) });
      }
    }
    return foundCards;
  }, [scannedCards, ownedCards]);

  const startScan = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    setStatus('processing');
    setProcessedCount(0);
    setTotalCount(files.length);
    setError(null);

    try {
      const worker = await createWorker('eng');
      const allFound = [];

      for (let i = 0; i < files.length; i++) {
        setProcessedCount(i + 1);
        const found = await scanImage(files[i], worker);
        allFound.push(...found);
        setScannedCards(prev => {
          const existing = new Set(prev.map(c => c.card_number));
          const newCards = found.filter(c => !existing.has(c.card_number));
          return [...prev, ...newCards];
        });
      }

      await worker.terminate();
      setStatus('results');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [scanImage]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProcessedCount(0);
    setTotalCount(0);
    setScannedCards([]);
    setError(null);
  }, []);

  const toggleCard = useCallback((cardNumber) => {
    setScannedCards(prev =>
      prev.map(c => c.card_number === cardNumber ? { ...c, owned: !c.owned } : c)
    );
  }, []);

  const removeCard = useCallback((cardNumber) => {
    setScannedCards(prev => prev.filter(c => c.card_number !== cardNumber));
  }, []);

  return {
    status,
    processedCount,
    totalCount,
    scannedCards,
    error,
    startScan,
    reset,
    toggleCard,
    removeCard,
  };
}
