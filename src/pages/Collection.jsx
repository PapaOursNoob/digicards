import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useWishlist, useAddToCollection, useRemoveFromCollection, useAddToWishlist, useRemoveFromWishlist } from '../hooks/useCards';
import { useCardsBySet } from '../hooks/useCards';
import { useSets } from '../hooks/useSets';
import Card from '../components/Card';
import CardModal from '../components/CardModal';
import useStore from '../store/useStore.jsx';
import { naturalSort } from '../utils/cardUtils';
import { t } from '../i18n';

const SET_COLORS = {
  'BT': { from: '#00d4ff', to: '#0066ff' },
  'EX': { from: '#ff6b6b', to: '#ee5a24' },
  'ST': { from: '#a29bfe', to: '#6c5ce7' },
  'PR': { from: '#fdcb6e', to: '#e17055' },
  'LM': { from: '#00b894', to: '#00cec9' },
  'RB': { from: '#fd79a8', to: '#e84393' },
  'AD': { from: '#00cec9', to: '#0984e3' },
  'P': { from: '#636e72', to: '#2d3436' },
};

function getSetColors(setName) {
  const prefix = Object.keys(SET_COLORS).find(p => setName?.startsWith(p));
  return prefix ? SET_COLORS[prefix] : { from: '#636e72', to: '#2d3436' };
}

function getBoosterImageUrl(setName) {
  if (!setName) return null;
  const match = setName.match(/^([A-Za-z]+)-(\d+)$/);
  if (!match) return null;
  const prefix = match[1].toUpperCase();
  const num = match[2].padStart(2, '0');
  const rawNum = match[2];

  if (prefix === 'BT') {
    const btMap = {
      '01': 'ver2', '02': 'ver3', '03': 'ver4', '04': 'ver5',
      '05': 'ver6', '06': 'ver7', '07': 'ver8', '08': 'ver9',
      '09': 'ver10', '10': 'ver11', '11': 'ver12', '12': 'ver13',
      '13': 'ver14', '14': 'ver15', '15': 'ver16', '16': 'ver17',
      '17': 'ver18-19', '18': 'ver18-19', '19': 'ver19-20',
      '20': 'ver21', '21': 'ver22', '22': 'ver23', '23': 'ver24',
      '24': 'ver25', '25': 'ver26',
    };
    const dir = btMap[num];
    if (dir) return `https://world.digimoncard.com/images/products/pack/${dir}/img_pkg.png`;
  }

  if (['EX', 'RB', 'AD'].includes(prefix)) {
    return `https://world.digimoncard.com/images/products/pack/${prefix.toLowerCase()}-${num}/img_pkg.png`;
  }

  if (prefix === 'ST') {
    return `https://world.digimoncard.com/images/products/deck/st-${rawNum}/img_pkg.png`;
  }

  return null;
}

export default function Collection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('sets');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [setFilter, setSetFilter] = useState('');
  const [setsSortBy, setSetsSortBy] = useState('owned');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  const { data: collection = [], isLoading } = useCollection(user?.id);
  const { data: wishlist = [] } = useWishlist(user?.id);
  const addToCollection = useAddToCollection();
  const removeFromCollection = useRemoveFromCollection();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();

  const { data: sets, isLoading: setsLoading, error: setsError } = useSets(collection, wishlist);

  const { settings, updateSettings } = useStore();
  const zoomLevel = settings.zoomLevel || 3;
  const hideWishlistOnOwned = settings.hideWishlistOnOwned || false;
  const grayscaleNonOwned = settings.grayscaleNonOwned ?? true;
  const ZOOM_GRID = { 1: 'lg:grid-cols-6', 2: 'lg:grid-cols-5', 3: 'lg:grid-cols-4', 4: 'lg:grid-cols-3', 5: 'lg:grid-cols-2' };
  const gridCols = ZOOM_GRID[zoomLevel] || ZOOM_GRID[3];

  const { data: setCards = [], isLoading: setCardsLoading } = useCardsBySet(selectedSet);
  const ownedNumbers = useMemo(() => new Set(collection.map(item => item.card_number)), [collection]);
  const wishlistNumbers = useMemo(() => new Set(wishlist.map(item => item.card_number)), [wishlist]);

  const sortedSetCards = useMemo(() => {
    if (!setCards.length) return [];
    return [...setCards].sort((a, b) => {
      const aOwned = ownedNumbers.has(a.card_number) ? 0 : 1;
      const bOwned = ownedNumbers.has(b.card_number) ? 0 : 1;
      if (aOwned !== bOwned) return aOwned - bOwned;
      return naturalSort(a.card_number || '', b.card_number || '');
    });
  }, [setCards, ownedNumbers]);

  const filteredSets = useMemo(() =>
    sets?.filter(set => set.name.toLowerCase().includes(setFilter.toLowerCase()))
      ?.sort((a, b) => {
        if (setsSortBy === 'owned') {
          const aOwned = a.ownedCards > 0 ? 0 : 1;
          const bOwned = b.ownedCards > 0 ? 0 : 1;
          if (aOwned !== bOwned) return aOwned - bOwned;
          return naturalSort(a.name, b.name);
        }
        if (setsSortBy === 'completion') {
          const aPct = a.totalCards > 0 ? a.ownedCards / a.totalCards : 0;
          const bPct = b.totalCards > 0 ? b.ownedCards / b.totalCards : 0;
          return bPct - aPct;
        }
        if (setsSortBy === 'wishlist') return b.wishlistCards - a.wishlistCards;
        return 0;
      }),
    [sets, setFilter, setsSortBy]
  );

  const filteredCollection = useMemo(() => {
    const ownedNumbers = new Set(collection.map(item => item.card_number));
    return collection.filter(item => {
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;
      if (searchTerm) return item.card_number.toLowerCase().includes(searchTerm.toLowerCase());
      return true;
    }).map(item => ({
      ...item,
      card: item.cards || {},
      ownedSet: ownedNumbers
    }));
  }, [collection, selectedCondition, searchTerm]);

  const stats = useMemo(() => {
    const totalCards = collection.reduce((sum, item) => sum + (item.qty_normal || 0) + (item.qty_foil || 0), 0);
    const duplicates = collection.filter(item => (item.qty_normal || 0) + (item.qty_foil || 0) > 1).length;
    const collectionValue = collection.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
    return { totalCards, duplicates, collectionValue };
  }, [collection]);

  const sortOptions = [
    { value: 'owned', label: t('owned') },
    { value: 'completion', label: t('completion') },
    { value: 'wishlist', label: t('wishlist') },
  ];

  return (
    <div className="pb-16 md:pb-0 md:ml-20">
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
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">{t('myCollection')}</h1>
          <div className="flex gap-2">
            <button className="flex items-center bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {t('export')}
            </button>
          </div>
        </div>

        <div className="flex border-b border-border-color mb-6">
          <button
            onClick={() => setActiveTab('sets')}
            className={`py-2 px-4 font-medium ${activeTab === 'sets' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <FolderIcon className="h-5 w-5 inline mr-2" />
            {t('bySets')}
          </button>
          <button
            onClick={() => setActiveTab('cards')}
            className={`py-2 px-4 font-medium ${activeTab === 'cards' ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            {t('myCards')}
          </button>
        </div>

        {activeTab === 'sets' ? (
          <div>
            {selectedSet ? (
              /* ── Set cards view ─────────────────────── */
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => setSelectedSet('')}
                    className="flex items-center gap-2 px-4 py-2 bg-bg-card rounded-lg border border-border-color hover:bg-bg-elevated transition-colors text-text-primary"
                  >
                    ← {t('backToSets')}
                  </button>
                  <h2 className="text-2xl font-bold text-text-primary">{selectedSet}</h2>
                </div>

                <div className="glass rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-text-secondary">
                      {setCardsLoading ? t('loading') : `${sortedSetCards.length} ${t('cards')}`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 bg-bg-card rounded-lg border border-border-color">
                        <button className="px-2 py-1.5 text-sm hover:text-accent-primary" onClick={() => updateSettings({ zoomLevel: Math.max(1, zoomLevel - 1) })}>−</button>
                        <span className="text-xs text-text-secondary w-6 text-center">{zoomLevel}</span>
                        <button className="px-2 py-1.5 text-sm hover:text-accent-primary" onClick={() => updateSettings({ zoomLevel: Math.min(5, zoomLevel + 1) })}>+</button>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-accent-primary' : 'bg-bg-card'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-accent-primary' : 'bg-bg-card'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {setCardsLoading ? (
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridCols} gap-4`}>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-bg-card rounded-lg border border-border-color animate-pulse aspect-[3/4]" />
                    ))}
                  </div>
                ) : sortedSetCards.length === 0 ? (
                  <div className="glass rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4 opacity-30">📦</div>
                    <h2 className="text-xl font-semibold mb-2">{t('noCardsFound')}</h2>
                    <p className="text-text-secondary">{t('tryDifferent')}</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridCols} gap-4`}>
                    {sortedSetCards.map(card => (
                      <Card
                        key={card.card_number}
                        card={card}
                        zoomLevel={zoomLevel}
                        isOwned={ownedNumbers.has(card.card_number)}
                        isInWishlist={wishlistNumbers.has(card.card_number)}
                        hideWishlistOnOwned={hideWishlistOnOwned}
                        grayscaleNonOwned={grayscaleNonOwned}
                        onClick={() => setSelectedCard(card)}
                        onAddToCollection={(data) => {
                          addToCollection.mutate({
                            userId: user.id,
                            cardNumber: card.card_number,
                            qtyNormal: data.qty_normal,
                            qtyFoil: data.qty_foil,
                            condition: data.condition,
                            purchasePrice: data.purchase_price
                          });
                        }}
                        onAddToWishlist={(cardNumber) => {
                          addToWishlist.mutate({ userId: user.id, cardNumber });
                        }}
                        onRemoveFromCollection={(cardNumber) => {
                          removeFromCollection.mutate({ userId: user.id, cardNumber });
                        }}
                        onRemoveFromWishlist={(cardNumber) => {
                          removeFromWishlist.mutate({ userId: user.id, cardNumber });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-bg-elevated">
                        <tr>
                          <th className="p-3 text-left">{t('card')}</th>
                          <th className="p-3 text-left">{t('rarity')}</th>
                          <th className="p-3 text-left">{t('actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedSetCards.map(card => {
                          const owned = ownedNumbers.has(card.card_number);
                          return (
                            <tr key={card.card_number} className="border-t border-border-color cursor-pointer hover:bg-bg-elevated" onClick={() => setSelectedCard(card)}>
                              <td className="p-3">
                                <div className="flex items-center">
                                  <img src={card.image_url || '/placeholder-card.svg'} alt={card.name} className={`w-12 h-16 object-cover rounded mr-3 ${!owned && grayscaleNonOwned ? 'grayscale' : ''}`} />
                                  <div>
                                    <div className="font-medium">{card.name}</div>
                                    <div className="text-sm text-text-secondary">{card.card_number}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                                  card.rarity === 'C' ? 'bg-rarity-c' :
                                  card.rarity === 'U' ? 'bg-rarity-u' :
                                  card.rarity === 'R' ? 'bg-rarity-r' :
                                  card.rarity === 'SR' ? 'bg-rarity-sr' :
                                  card.rarity === 'SEC' ? 'bg-rarity-sec' :
                                  card.rarity === 'P' ? 'bg-rarity-p' :
                                  'bg-rarity-c'
                                }`}>{card.rarity}</span>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      if (owned) {
                                        removeFromCollection.mutate({ userId: user.id, cardNumber: card.card_number });
                                      } else {
                                        addToCollection.mutate({ userId: user.id, cardNumber: card.card_number, qtyNormal: 1, qtyFoil: 0, condition: 'NM', purchasePrice: null });
                                      }
                                    }}
                                    className={`px-3 py-1 rounded text-sm font-medium ${owned ? 'bg-danger text-white' : 'bg-accent-primary text-bg-primary'}`}
                                  >
                                    {owned ? t('remove') : t('add')}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
            <div>
            <div className="glass rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3.5 text-text-secondary" />
                  <input
                    type="text"
                    placeholder={t('searchSets')}
                    className="w-full pl-10 p-3 bg-bg-card rounded-lg text-text-primary"
                    value={setFilter}
                    onChange={(e) => setSetFilter(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-text-secondary">{t('sortBy')}</span>
                  {sortOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSetsSortBy(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${setsSortBy === opt.value ? 'bg-accent-primary text-bg-primary' : 'bg-bg-card text-text-secondary hover:text-text-primary'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {setsError ? (
              <p className="text-red-500">Error loading sets: {setsError.message}</p>
            ) : setsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-bg-card rounded-xl border border-border-color animate-pulse">
                    <div className="h-32 bg-bg-elevated rounded-t-xl" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-bg-elevated rounded w-20" />
                      <div className="h-3 bg-bg-elevated rounded w-32" />
                      <div className="h-2 bg-bg-elevated rounded-full w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSets?.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <div className="text-5xl mb-4 opacity-30">🔍</div>
                <h2 className="text-xl font-semibold mb-2">{t('noSetsFound')}</h2>
                <p className="text-text-secondary">{t('tryDifferent')}</p>
                <button onClick={() => setSetFilter('')} className="mt-4 px-4 py-2 bg-accent-primary text-bg-primary rounded-lg hover:bg-accent-secondary transition-colors text-sm">
                  {t('clearSearch')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredSets?.map(set => {
                  const completion = set.totalCards > 0 ? Math.round((set.ownedCards / set.totalCards) * 100) : 0;
                  const isComplete = completion >= 100;
                  const { from, to } = getSetColors(set.name);
                  const imgUrl = getBoosterImageUrl(set.name);

                  return (
                    <div
                      key={set.name}
                      onClick={() => setSelectedSet(set.name)}
                      className="bg-bg-card rounded-xl border border-border-color overflow-hidden cursor-pointer transform transition-transform hover:scale-105 hover:border-accent-primary"
                    >
                      <div
                        className="relative h-32 flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                      >
                        {imgUrl ? (
                          <img
                            src={imgUrl}
                            alt={set.name}
                            className="h-24 w-auto object-contain drop-shadow-lg"
                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 ${imgUrl ? 'hidden' : 'flex'} items-center justify-center`}>
                          <span className="text-4xl font-bold text-text-primary/80 drop-shadow-lg">{set.name}</span>
                        </div>
                        {isComplete && (
                          <div className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">{t('complete')}</div>
                        )}
                        {set.wishlistCards > 0 && (
                          <div className="absolute top-3 left-3 bg-warning text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {set.wishlistCards} {t('wishlisted')}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-text-primary mb-1">{set.name}</h3>
                        <p className="text-sm text-text-secondary mb-3">
                          {set.totalCards} {t('cards')}
                          {set.ownedCards > 0 && ` • ${set.ownedCards} ${t('owned')}`}
                        </p>
                        <div className="w-full bg-bg-elevated rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${isComplete ? 'bg-success' : 'bg-accent-primary'}`} style={{ width: `${completion}%` }} />
                        </div>
                        <p className="text-xs text-text-secondary mt-1 text-right">{completion}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
            )}
          </div>
        ) : (
          <div>
            <div className="glass rounded-xl p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1 relative">
                  <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3.5 text-text-secondary" />
                  <input
                    type="text"
                    placeholder={t('searchCardsPlaceholderShort')}
                    className="w-full pl-10 p-3 bg-bg-card rounded-lg text-text-primary"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 bg-bg-card rounded-lg border border-border-color">
                    <button className="px-2 py-1.5 text-sm hover:text-accent-primary" onClick={() => updateSettings({ zoomLevel: Math.max(1, zoomLevel - 1) })} title="Zoom out">−</button>
                    <span className="text-xs text-text-secondary w-6 text-center">{zoomLevel}</span>
                    <button className="px-2 py-1.5 text-sm hover:text-accent-primary" onClick={() => updateSettings({ zoomLevel: Math.min(5, zoomLevel + 1) })} title="Zoom in">+</button>
                  </div>
                  <select
                    className="p-3 bg-bg-card rounded-lg text-text-primary"
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                  >
                    <option value="all">{t('allConditions')}</option>
                    <option value="NM">{t('nearMintShort')}</option>
                    <option value="LP">{t('lightlyPlayedShort')}</option>
                    <option value="MP">{t('moderatelyPlayedShort')}</option>
                    <option value="HP">{t('heavilyPlayedShort')}</option>
                    <option value="D">{t('damagedShort')}</option>
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-accent-primary' : 'bg-bg-card'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-accent-primary' : 'bg-bg-card'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 mb-6">
              <h2 className="text-xl font-semibold mb-4">{t('collectionStats')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-elevated p-3 rounded-lg">
                  <p className="text-text-secondary">{t('totalCards')}</p>
                  <p className="text-2xl font-bold">{stats.totalCards}</p>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg">
                  <p className="text-text-secondary">{t('uniqueCards')}</p>
                  <p className="text-2xl font-bold">{collection.length}</p>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg">
                  <p className="text-text-secondary">{t('estimatedVal')}</p>
                  <p className="text-2xl font-bold text-success">€{stats.collectionValue.toFixed(2)}</p>
                </div>
                <div className="bg-bg-elevated p-3 rounded-lg">
                  <p className="text-text-secondary">{t('duplicates')}</p>
                  <p className="text-2xl font-bold text-warning">{stats.duplicates}</p>
                </div>
              </div>
            </div>

            {filteredCollection.length > 0 ? (
              <>
                {viewMode === 'grid' ? (
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${gridCols} gap-4`}>
                    {filteredCollection.map(item => (
                      <Card
                        key={item.card_number}
                        card={{
                          card_number: item.card_number,
                          name: item.card?.name || 'Card Name',
                          set_name: item.card?.set_name || 'Set Name',
                          rarity: item.card?.rarity || 'R',
                          image_url: item.card?.image_url || null,
                          color: item.card?.color || null,
                        }}
                        isOwned={true}
                        zoomLevel={zoomLevel}
                        hideWishlistOnOwned={hideWishlistOnOwned}
                        grayscaleNonOwned={grayscaleNonOwned}
                        isInWishlist={wishlist.some(w => w.card_number === item.card_number)}
                        onClick={() => setSelectedCard(item.card || { card_number: item.card_number, name: item.card?.name, set_name: item.card?.set_name, rarity: item.card?.rarity, image_url: item.card?.image_url, color: item.card?.color })}
                        onAddToCollection={(cardData) => {
                          addToCollection.mutate({
                            userId: user.id,
                            cardNumber: item.card_number,
                            qtyNormal: cardData.qty_normal,
                            qtyFoil: cardData.qty_foil,
                            condition: cardData.condition,
                            purchasePrice: cardData.purchase_price
                          });
                        }}
                        onAddToWishlist={(cardNumber) => {
                          addToWishlist.mutate({ userId: user.id, cardNumber });
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-bg-elevated">
                        <tr>
                          <th className="p-3 text-left">{t('card')}</th>
                          <th className="p-3 text-left">{t('set')}</th>
                          <th className="p-3 text-left">{t('condition')}</th>
                          <th className="p-3 text-left">{t('quantity')}</th>
                          <th className="p-3 text-left">{t('value')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCollection.map(item => (
                          <tr key={item.card_number} className="border-t border-border-color cursor-pointer hover:bg-bg-elevated" onClick={() => setSelectedCard(item.card || { card_number: item.card_number, name: item.card?.name, set_name: item.card?.set_name, rarity: item.card?.rarity, image_url: item.card?.image_url, color: item.card?.color })}>
                            <td className="p-3">
                              <div className="flex items-center">
                                {item.card?.image_url ? (
                                  <img src={item.card.image_url} alt={item.card.name} className="w-12 h-16 object-cover rounded mr-3" />
                                ) : (
                                  <div className="bg-bg-card border-2 border-dashed rounded-xl w-12 h-12 mr-3" />
                                )}
                                <div>
                                  <div className="font-medium">{item.card?.name || 'Card Name'}</div>
                                  <div className="text-sm text-text-secondary">{item.card_number}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">{item.card?.set_name || 'Set Name'}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 bg-bg-elevated rounded-full text-xs">{item.condition}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center">
                                <span className="mr-2">{t('normalShort')} {item.qty_normal}</span>
                                <span>{t('foilShort')} {item.qty_foil}</span>
                              </div>
                            </td>
                            <td className="p-3">€{(item.purchase_price || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="glass rounded-xl p-8 text-center">
                <div className="text-6xl mb-4 opacity-30">📦</div>
                <h2 className="text-xl font-semibold mb-2">{t('collectionEmptyMsg')}</h2>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  {t('startBuildingMsg')}
                </p>
                <button onClick={() => navigate('/catalogue')} className="bg-accent-primary text-bg-primary px-5 py-2.5 rounded-lg hover:bg-accent-secondary transition-colors font-medium">
                  {t('browseCatalogue')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
