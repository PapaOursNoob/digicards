import React, { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useCards } from '../hooks/useCards';
import Card from './Card';
import CardModal from './CardModal';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useWishlist, useAddToCollection, useRemoveFromCollection, useAddToWishlist, useRemoveFromWishlist } from '../hooks/useCards';
import { getRarityClass, naturalSort } from '../utils/cardUtils';
import useStore from '../store/useStore.jsx';
import { supabase } from '../lib/supabase';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { t } from '../i18n';

const CardSearch = ({ initialSet = '' }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    setName: '', color: '', rarity: '', cardType: '',
    level: '', form: '', attribute: '', collectionStatus: 'all'
  });
  const [selectedSets, setSelectedSets] = useState([]);
  const [sets, setSets] = useState([]);
  const [setSearch, setSetSearch] = useState('');
  const [setOpen, setSetOpen] = useState(false);
  const setRef = useRef();
  const [selectedCard, setSelectedCard] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const hideWishlistOnOwned = settings.hideWishlistOnOwned || false;
  const grayscaleNonOwned = settings.grayscaleNonOwned ?? true;

  const { data: collection = [] } = useCollection(user?.id);
  const { data: wishlist = [] } = useWishlist(user?.id);
  const addToCollection = useAddToCollection();
  const removeFromCollection = useRemoveFromCollection();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const ownedSet = useMemo(() => new Set(collection.map(item => item.card_number)), [collection]);
  const wishlistSet = useMemo(() => new Set(wishlist.map(item => item.card_number)), [wishlist]);

  const queryFilters = useMemo(() => {
    const base = { ...filters, search: searchTerm };
    if (initialSet && !base.setName) base.setName = initialSet;
    if (selectedSets.length === 1 && !base.setName) base.setName = selectedSets[0];
    return base;
  }, [filters, searchTerm, initialSet, selectedSets]);
  const { data: cards, isLoading, error } = useCards(queryFilters);

  const viewMode = settings.displayMode || 'grid';
  const [sortField, setSortField] = useState('card_number');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    let cancelled = false;
    const fetchSets = async () => {
      let allData = [];
      let start = 0;
      const pageSize = 1000;
      const maxPages = 50;
      for (let page = 0; page < maxPages; page++) {
        const { data, error } = await supabase
          .from('cards')
          .select('set_name')
          .order('set_name')
          .range(start, start + pageSize - 1);
        if (error) { console.error('Failed to fetch sets:', error); break; }
        if (!data || data.length === 0) break;
        allData = allData.concat(data);
        if (data.length < pageSize) break;
        start += pageSize;
      }
      if (cancelled) return;
      const unique = [...new Set(allData.map(item => item.set_name).filter(Boolean))];
      setSets(unique);
      if (initialSet && unique.includes(initialSet)) setSelectedSets([initialSet]);
    };
    fetchSets();
    return () => { cancelled = true; };
  }, [initialSet]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (setRef.current && !setRef.current.contains(e.target)) setSetOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleSet = (set) => {
    setSelectedSets(prev => prev.includes(set) ? prev.filter(s => s !== set) : [...prev, set]);
  };

  const filteredSets = sets.filter(s => s.toLowerCase().includes(setSearch.toLowerCase()));

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const applyFilters = (cards) => {
    let result = cards;
    if (selectedSets.length > 0) result = result.filter(c => selectedSets.includes(c.set_name));
    if (filters.collectionStatus === 'owned') result = result.filter(c => ownedSet.has(c.card_number));
    else if (filters.collectionStatus === 'missing') result = result.filter(c => !ownedSet.has(c.card_number));
    return result;
  };

  const resetFilters = () => {
    setFilters({ setName: '', color: '', rarity: '', cardType: '', level: '', form: '', attribute: '', collectionStatus: 'all' });
    setSelectedSets([]);
    setSearchTerm('');
    setSetSearch('');
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortCards = (cards) => {
    if (!cards) return [];
    return [...cards].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'card_number': cmp = naturalSort(a.card_number, b.card_number); break;
        case 'name': cmp = (a.name || '').localeCompare(b.name || ''); break;
        case 'set_name': cmp = (a.set_name || '').localeCompare(b.set_name || ''); break;
        case 'rarity': cmp = (a.rarity || '').localeCompare(b.rarity || ''); break;
        case 'card_type': cmp = (a.card_type || '').localeCompare(b.card_type || ''); break;
        case 'level': cmp = (parseInt(a.level) || 0) - (parseInt(b.level) || 0); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const filteredCards = sortCards(applyFilters(cards || []));

  if (error) {
    return <div className="text-center py-10"><p className="text-red-500">{t('errorLoadingCards')}: {error.message}</p></div>;
  }

  const zoomLevel = settings.zoomLevel || 3;
  const ZOOM_GRID = { 1: 'lg:grid-cols-6', 2: 'lg:grid-cols-5', 3: 'lg:grid-cols-4', 4: 'lg:grid-cols-3', 5: 'lg:grid-cols-2' };
  const gridCols = ZOOM_GRID[zoomLevel] || ZOOM_GRID[3];

  return (
    <div className="space-y-6">
      <CardModal
        card={selectedCard}
        isOpen={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        onAddToCollection={(data) => {
          if (selectedCard && user) {
            addToCollection.mutate({
              userId: user.id,
              cardNumber: selectedCard.card_number,
              qtyNormal: data.qty_normal,
              qtyFoil: data.qty_foil,
              condition: data.condition,
              purchasePrice: data.purchase_price
            });
          }
          setSelectedCard(null);
        }}
        onAddToWishlist={(cardNumber) => {
          if (user) addToWishlist.mutate({ userId: user.id, cardNumber });
          setSelectedCard(null);
        }}
      />
      <div className="relative">
        <input
          type="text"
          placeholder={t('searchCardsPlaceholderLong')}
          className="w-full p-4 rounded-lg bg-bg-card text-text-primary border border-border-color focus:border-accent-primary focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary" onClick={resetFilters}>
          {t('clear')}
        </button>
      </div>

      <div className="bg-bg-card rounded-lg border border-border-color">
        <button
          className="w-full flex justify-between items-center p-4 text-left"
          onClick={() => setShowFilters(!showFilters)}
        >
          <h3 className="text-lg font-semibold">{t('filters')}</h3>
          <div className="flex items-center gap-3">
            <button className="text-sm text-accent-primary hover:underline" onClick={(e) => { e.stopPropagation(); resetFilters(); }}>{t('resetAll')}</button>
            <ChevronDownIcon className={`h-5 w-5 text-text-secondary transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 pt-0">
          <div ref={setRef} className="relative">
            <label className="block text-sm font-medium mb-1">{t('set')}</label>
            <button className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color flex items-center justify-between" onClick={() => setSetOpen(!setOpen)}>
              <span className="truncate">{selectedSets.length === 0 ? t('allSets') : `${selectedSets.length} ${selectedSets.length > 1 ? t('setsSelected') : t('setSelected')}`}</span>
              <ChevronDownIcon className="h-4 w-4 shrink-0" />
            </button>
            {selectedSets.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedSets.map(s => (
                  <span key={s} className="bg-accent-primary text-bg-primary text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                    {s}
                    <XMarkIcon className="h-3 w-3 cursor-pointer" onClick={() => toggleSet(s)} />
                  </span>
                ))}
              </div>
            )}
            {setOpen && (
              <div className="absolute z-10 mt-1 w-full bg-bg-card border border-border-color rounded-lg shadow-xl max-h-60 flex flex-col">
                <input type="text" placeholder={t('searchSets')} className="p-2 bg-bg-elevated text-text-primary border-b border-border-color outline-none" value={setSearch} onChange={(e) => setSetSearch(e.target.value)} autoFocus />
                <div className="overflow-y-auto flex-1">
                  {filteredSets.map(set => (
                    <label key={set} className="flex items-center gap-2 px-3 py-1.5 hover:bg-bg-elevated cursor-pointer text-sm">
                      <input type="checkbox" checked={selectedSets.includes(set)} onChange={() => toggleSet(set)} className="accent-accent-primary" />
                      {set}
                    </label>
                  ))}
                  {filteredSets.length === 0 && <p className="text-text-secondary text-sm px-3 py-2">{t('noSetsFound')}</p>}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('color')}</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.color} onChange={(e) => handleFilterChange('color', e.target.value)}>
              <option value="">{t('allColors')}</option>
              <option value="Red">{t('red')}</option><option value="Blue">{t('blue')}</option><option value="Yellow">{t('yellow')}</option>
              <option value="Green">{t('green')}</option><option value="Black">{t('black')}</option><option value="Purple">{t('purple')}</option>
              <option value="White">{t('white')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('rarity')}</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.rarity} onChange={(e) => handleFilterChange('rarity', e.target.value)}>
              <option value="">{t('allRarities')}</option>
              <option value="C">{t('common')}</option><option value="U">{t('uncommon')}</option><option value="R">{t('rareLabel')}</option>
              <option value="SR">{t('superRare')}</option><option value="SEC">{t('secretRare')}</option><option value="P">{t('promo')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Card Type</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.cardType} onChange={(e) => handleFilterChange('cardType', e.target.value)}>
              <option value="">{t('allTypes')}</option>
              <option value="Digimon">{t('digimon')}</option><option value="Tamer">{t('tamer')}</option>
              <option value="Option">{t('option')}</option><option value="Digi-Egg">{t('digiEgg')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.level} onChange={(e) => handleFilterChange('level', e.target.value)}>
              <option value="">{t('allLevels')}</option>
              <option value="2">{t('level2')}</option><option value="3">{t('level3')}</option><option value="4">{t('level4')}</option>
              <option value="5">{t('level5')}</option><option value="6">{t('level6')}</option><option value="7">{t('level7')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Form</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.form} onChange={(e) => handleFilterChange('form', e.target.value)}>
              <option value="">{t('allForms')}</option>
              <option value="In-Training">{t('inTraining')}</option><option value="Rookie">{t('rookie')}</option>
              <option value="Champion">{t('champion')}</option><option value="Ultimate">{t('ultimate')}</option>
              <option value="Mega">{t('mega')}</option><option value="Ultra">{t('ultra')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Attribute</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.attribute} onChange={(e) => handleFilterChange('attribute', e.target.value)}>
              <option value="">{t('allAttributes')}</option>
              <option value="Vaccine">{t('vaccine')}</option><option value="Data">{t('data')}</option>
              <option value="Virus">{t('virus')}</option><option value="Free">{t('free')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('collectionStatus')}</label>
            <select className="w-full p-2 rounded bg-bg-elevated text-text-primary border border-border-color" value={filters.collectionStatus} onChange={(e) => handleFilterChange('collectionStatus', e.target.value)}>
              <option value="all">{t('allCards')}</option>
              <option value="owned">{t('ownedOnly')}</option>
              <option value="missing">{t('missingOnly')}</option>
            </select>
          </div>
        </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <p className="text-text-secondary">{isLoading ? t('loading') : `${filteredCards.length} ${t('cardsFound')}`}</p>
          <select className="p-1.5 rounded bg-bg-elevated text-text-primary border border-border-color text-sm" value={sortField} onChange={(e) => { setSortField(e.target.value); setSortDir('asc'); }}>
            <option value="card_number">{t('sortByCardNum')}</option>
            <option value="name">{t('sortByName')}</option>
            <option value="set_name">{t('sortBySet')}</option>
            <option value="rarity">{t('sortByRarity')}</option>
            <option value="card_type">{t('sortByType')}</option>
            <option value="level">{t('sortByLevel')}</option>
          </select>
          <button className="p-1.5 rounded bg-bg-elevated text-text-primary border border-border-color text-sm" onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}>
            {sortDir === 'asc' ? t('asc') : t('desc')}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-bg-elevated rounded border border-border-color">
            <button className="px-2 py-1.5 text-sm hover:text-accent-primary" onClick={() => updateSettings({ zoomLevel: Math.max(1, (settings.zoomLevel || 3) - 1) })} title={t('zoomOut')}>−</button>
            <span className="text-xs text-text-secondary w-6 text-center">{settings.zoomLevel || 3}</span>
            <button className="px-2 py-1.5 text-sm hover:text-accent-primary" onClick={() => updateSettings({ zoomLevel: Math.min(5, (settings.zoomLevel || 3) + 1) })} title={t('zoomIn')}>+</button>
          </div>
          <button className={`p-2 rounded ${viewMode === 'grid' ? 'bg-accent-primary text-bg-primary' : 'bg-bg-elevated'}`} onClick={() => updateSettings({ displayMode: 'grid' })}>{t('grid')}</button>
          <button className={`p-2 rounded ${viewMode === 'list' ? 'bg-accent-primary text-bg-primary' : 'bg-bg-elevated'}`} onClick={() => updateSettings({ displayMode: 'list' })}>{t('list')}</button>
        </div>
      </div>

      {isLoading ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gridCols} gap-4`}>
          {[...Array(12)].map((_, index) => (
            <div key={index} className="bg-bg-card rounded-lg border border-border-color animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 ${gridCols} gap-4`}>
          {filteredCards.map(card => (
            <Card
              key={card.card_number}
              card={card}
              zoomLevel={zoomLevel}
              isOwned={ownedSet.has(card.card_number)}
              isInWishlist={wishlistSet.has(card.card_number)}
              hideWishlistOnOwned={hideWishlistOnOwned}
              grayscaleNonOwned={grayscaleNonOwned}
              onClick={() => setSelectedCard(card)}
              onAddToCollection={(data) => {
                if (user) addToCollection.mutate({
                  userId: user.id, cardNumber: card.card_number,
                  qtyNormal: data.qty_normal, qtyFoil: data.qty_foil,
                  condition: data.condition, purchasePrice: data.purchase_price
                });
              }}
              onAddToWishlist={(cardNumber) => {
                if (user) addToWishlist.mutate({ userId: user.id, cardNumber });
              }}
              onRemoveFromCollection={(cardNumber) => {
                if (user) {
                  const item = collection.find(c => c.card_number === cardNumber);
                  removeFromCollection.mutate({ userId: user.id, cardNumber });
                  toast.custom((toastApi) => (
                    <div className="bg-bg-card text-text-primary px-4 py-3 rounded-lg shadow-xl border border-border-color flex items-center gap-3">
                      <span>{card.name} {t('removed')}</span>
                      <button className="text-accent-primary font-semibold text-sm hover:underline" onClick={() => {
                        if (item) addToCollection.mutate({
                          userId: user.id, cardNumber: item.card_number,
                          qtyNormal: item.qty_normal, qtyFoil: item.qty_foil,
                          condition: item.condition, purchasePrice: item.purchase_price
                        });
                        toast.dismiss(toastApi.id);
                      }}>{t('undo')}</button>
                    </div>
                  ), { duration: 4000 });
                }
              }}
              onRemoveFromWishlist={(cardNumber) => {
                if (user) {
                  removeFromWishlist.mutate({ userId: user.id, cardNumber });
                  toast.custom((toastApi) => (
                    <div className="bg-bg-card text-text-primary px-4 py-3 rounded-lg shadow-xl border border-border-color flex items-center gap-3">
                      <span>{card.name} {t('removedFromWishlist')}</span>
                      <button className="text-warning font-semibold text-sm hover:underline" onClick={() => {
                        addToWishlist.mutate({ userId: user.id, cardNumber });
                        toast.dismiss(toastApi.id);
                      }}>{t('undo')}</button>
                    </div>
                  ), { duration: 4000 });
                }
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-bg-card rounded-lg border border-border-color overflow-hidden">
          <table className="w-full">
            <thead className="bg-bg-elevated">
              <tr>
                <th className="p-3 text-left cursor-pointer hover:text-accent-primary select-none" onClick={() => toggleSort('card_number')}>
                  {t('card')} {sortField === 'card_number' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="p-3 text-left cursor-pointer hover:text-accent-primary select-none" onClick={() => toggleSort('set_name')}>
                  {t('set')} {sortField === 'set_name' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="p-3 text-left cursor-pointer hover:text-accent-primary select-none" onClick={() => toggleSort('rarity')}>
                  {t('rarity')} {sortField === 'rarity' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="p-3 text-left cursor-pointer hover:text-accent-primary select-none" onClick={() => toggleSort('card_type')}>
                  Type {sortField === 'card_type' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="p-3 text-left cursor-pointer hover:text-accent-primary select-none" onClick={() => toggleSort('level')}>
                  Level {sortField === 'level' && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
                <th className="p-3 text-left">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map(card => {
                const owned = ownedSet.has(card.card_number);
                const inWish = wishlistSet.has(card.card_number);
                return (
                  <tr key={card.card_number} className="border-t border-border-color cursor-pointer hover:bg-bg-elevated" onClick={() => setSelectedCard(card)}>
                    <td className="p-3">
                      <div className="flex items-center">
                        <img src={card.image_url || '/placeholder-card.svg'} alt={card.name} className="w-12 h-16 object-cover rounded mr-3" />
                        <div>
                          <div className="font-medium">{card.name}</div>
                          <div className="text-sm text-text-secondary">{card.card_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{card.set_name}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRarityClass(card.rarity)}`}>{card.rarity}</span>
                    </td>
                    <td className="p-3">{card.card_type}</td>
                    <td className="p-3">{card.level}</td>
                    <td className="p-3">
                      <button
                        className={`mr-2 ${owned ? 'text-danger' : 'text-accent-primary'} hover:text-text-primary`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (owned) {
                            if (user) {
                              const item = collection.find(c => c.card_number === card.card_number);
                              removeFromCollection.mutate({ userId: user.id, cardNumber: card.card_number });
                              toast.custom((toastApi) => (
                                <div className="bg-bg-card text-text-primary px-4 py-3 rounded-lg shadow-xl border border-border-color flex items-center gap-3">
                                  <span>{card.name} {t('removed')}</span>
                                  <button className="text-accent-primary font-semibold text-sm hover:underline" onClick={() => {
                                    if (item) addToCollection.mutate({
                                      userId: user.id, cardNumber: item.card_number,
                                      qtyNormal: item.qty_normal, qtyFoil: item.qty_foil,
                                      condition: item.condition, purchasePrice: item.purchase_price
                                    });
                                    toast.dismiss(toastApi.id);
                                  }}>{t('undo')}</button>
                                </div>
                              ), { duration: 4000 });
                            }
                          } else {
                            if (user) addToCollection.mutate({ userId: user.id, cardNumber: card.card_number, qtyNormal: 1, qtyFoil: 0, condition: 'NM', purchasePrice: null });
                          }
                        }}
                      >
                        {owned ? t('remove') : t('add')}
                      </button>
                      <button
                        className={`${inWish ? 'text-warning' : 'text-text-secondary'} hover:text-text-primary`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inWish) {
                            if (user) {
                              removeFromWishlist.mutate({ userId: user.id, cardNumber: card.card_number });
                              toast.custom((toastApi) => (
                                <div className="bg-bg-card text-text-primary px-4 py-3 rounded-lg shadow-xl border border-border-color flex items-center gap-3">
                                  <span>{card.name} {t('removedFromWishlist')}</span>
                                  <button className="text-warning font-semibold text-sm hover:underline" onClick={() => {
                                    addToWishlist.mutate({ userId: user.id, cardNumber: card.card_number });
                                    toast.dismiss(toastApi.id);
                                  }}>{t('undo')}</button>
                                </div>
                              ), { duration: 4000 });
                            }
                          } else {
                            if (user) addToWishlist.mutate({ userId: user.id, cardNumber: card.card_number });
                          }
                        }}
                      >
                        {inWish ? 'Unwish' : 'Wishlist'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CardSearch;
