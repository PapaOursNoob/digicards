import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { naturalSort } from '../utils/cardUtils';

export const useSets = (collection = [], wishlist = []) => {
  return useQuery({
    queryKey: ['sets', collection.length, wishlist.length],
    queryFn: async () => {
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      const maxPages = 50;
      for (let page = 0; page < maxPages; page++) {
        const { data, error } = await supabase
          .from('cards')
          .select('set_name, card_number')
          .order('set_name')
          .range(start, start + pageSize - 1);
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        start += pageSize;
      }

      const ownedSet = new Set(collection.map(item => item.card_number));
      const wishlistSet = new Set(wishlist.map(item => item.card_number));

      const setsMap = {};
      for (const card of allData) {
        if (!card.set_name) continue;
        if (!setsMap[card.set_name]) {
          setsMap[card.set_name] = {
            name: card.set_name,
            totalCards: 0,
            ownedCards: 0,
            wishlistCards: 0,
          };
        }
        setsMap[card.set_name].totalCards += 1;
        if (ownedSet.has(card.card_number)) setsMap[card.set_name].ownedCards += 1;
        if (wishlistSet.has(card.card_number)) setsMap[card.set_name].wishlistCards += 1;
      }

      return Object.values(setsMap).sort((a, b) => naturalSort(a.name, b.name));
    },
    staleTime: 1000 * 60 * 5,
  });
};
