import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const useCards = (filters = {}) => {
  return useQuery({
    queryKey: ['cards', JSON.stringify(filters)],
    queryFn: async () => {
      let baseQuery = supabase.from('cards').select('*').order('card_number');

      if (filters.setName) baseQuery = baseQuery.eq('set_name', filters.setName);
      if (filters.color) baseQuery = baseQuery.ilike('color', `%${filters.color.replace(/[%_]/g, '\\$&')}%`);
      if (filters.rarity) baseQuery = baseQuery.eq('rarity', filters.rarity);
      if (filters.cardType) baseQuery = baseQuery.eq('card_type', filters.cardType);
      if (filters.level) baseQuery = baseQuery.eq('level', filters.level);
      if (filters.form) baseQuery = baseQuery.eq('form', filters.form);
      if (filters.attribute) baseQuery = baseQuery.eq('attribute', filters.attribute);
      if (filters.search) {
        const escapedSearch = filters.search.replace(/[%_]/g, '\\$&');
        baseQuery = baseQuery.or(`name.ilike.%${escapedSearch}%,card_number.ilike.%${escapedSearch}%`);
      }

      let allData = [];
      let start = 0;
      const pageSize = 1000;
      const maxPages = 50;

      for (let page = 0; page < maxPages; page++) {
        const { data, error } = await baseQuery.range(start, start + pageSize - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        start += pageSize;
      }

      return allData;
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCard = (cardNumber) => {
  return useQuery({
    queryKey: ['card', cardNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('card_number', cardNumber)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!cardNumber,
  });
};

export const useCardsBySet = (setName) => {
  return useQuery({
    queryKey: ['cardsBySet', setName],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      const maxPages = 50;
      for (let page = 0; page < maxPages; page++) {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('set_name', setName)
          .order('card_number', { ascending: true })
          .range(start, start + pageSize - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        start += pageSize;
      }
      return allData;
    },
    enabled: !!setName,
  });
};

// ── Collection ──────────────────────────────────────────

export const useCollection = (userId) => {
  return useQuery({
    queryKey: ['collection', userId],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      const maxPages = 10;
      for (let page = 0; page < maxPages; page++) {
        const { data, error } = await supabase
          .from('collection')
          .select('*, cards(*)')
          .eq('user_id', userId)
          .order('card_number')
          .range(start, start + pageSize - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        start += pageSize;
      }
      return allData;
    },
    enabled: !!userId,
  });
};

export const useAddToCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cardNumber, qtyNormal, qtyFoil, condition, purchasePrice }) => {
      const { data, error } = await supabase
        .from('collection')
        .upsert({
          user_id: userId,
          card_number: cardNumber,
          qty_normal: qtyNormal || 0,
          qty_foil: qtyFoil || 0,
          condition: condition || 'NM',
          purchase_price: purchasePrice || null,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,card_number' })
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

export const useUpdateCollectionItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cardNumber, updates }) => {
      const { data, error } = await supabase
        .from('collection')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('card_number', cardNumber)
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
};

export const useRemoveFromCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cardNumber }) => {
      const { error } = await supabase
        .from('collection')
        .delete()
        .eq('user_id', userId)
        .eq('card_number', cardNumber);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

// ── Wishlist ────────────────────────────────────────────

export const useWishlist = (userId) => {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      const maxPages = 10;
      for (let page = 0; page < maxPages; page++) {
        const { data, error } = await supabase
          .from('wishlist')
          .select('*, cards(*)')
          .eq('user_id', userId)
          .order('card_number')
          .range(start, start + pageSize - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        start += pageSize;
      }
      return allData;
    },
    enabled: !!userId,
  });
};

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cardNumber, targetPrice, priority }) => {
      const { data, error } = await supabase
        .from('wishlist')
        .upsert({
          user_id: userId,
          card_number: cardNumber,
          target_price: targetPrice || null,
          priority: priority || 1,
          added_at: new Date().toISOString()
        }, { onConflict: 'user_id,card_number' })
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, cardNumber }) => {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('card_number', cardNumber);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
};

// ── Decks (N+1 fixed: single query with joins) ──────────

export const useDecks = (userId) => {
  return useQuery({
    queryKey: ['decks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decks')
        .select('*, deck_cards(cards(card_number, image_url))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);

      return (data || []).map(deck => {
        const deckCards = deck.deck_cards || [];
        const cards = deckCards.map(dc => dc.cards).filter(Boolean);
        let coverUrl = null;
        if (deck.cover_card) {
          const cover = cards.find(c => c.card_number === deck.cover_card);
          coverUrl = cover?.image_url || null;
        } else if (cards.length > 0) {
          coverUrl = cards[0].image_url;
        }
        return { ...deck, cardCount: deckCards.length, coverUrl, cards: undefined };
      });
    },
    enabled: !!userId,
  });
};

export const useDeck = (deckId) => {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('decks')
        .select('*, deck_cards(*, cards(*))')
        .eq('id', deckId)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!deckId,
  });
};

export const useCreateDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, deck }) => {
      const { data, error } = await supabase
        .from('decks')
        .insert({
          ...deck,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};

export const useUpdateDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId, updates }) => {
      const { data, error } = await supabase
        .from('decks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', deckId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['deck'] });
    },
  });
};

export const useDeleteDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (deckId) => {
      const { error } = await supabase
        .from('decks')
        .delete()
        .eq('id', deckId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};

export const useAddCardToDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId, cardNumber, quantity }) => {
      const { data, error } = await supabase
        .from('deck_cards')
        .upsert({
          deck_id: deckId,
          card_number: cardNumber,
          quantity: quantity || 1
        }, { onConflict: 'deck_id,card_number' })
        .select();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deck', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};

export const useRemoveCardFromDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deckId, cardNumber }) => {
      const { error } = await supabase
        .from('deck_cards')
        .delete()
        .eq('deck_id', deckId)
        .eq('card_number', cardNumber);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['deck', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};
