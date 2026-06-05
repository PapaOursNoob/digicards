import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, HeartIcon as HeartOutline, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useDeck, useRemoveCardFromDeck, useAddCardToDeck, useUpdateDeck, useCollection, useWishlist, useAddToWishlist } from '../hooks/useCards';
import { getDeckColorClass } from '../utils/cardUtils';
import Card from '../components/Card';
import { t } from '../i18n';

export default function DeckView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: deckData, isLoading, error } = useDeck(id);
  const removeCardFromDeck = useRemoveCardFromDeck();
  const addCardToDeck = useAddCardToDeck();
  const updateDeck = useUpdateDeck();
  const { data: collection = [] } = useCollection(user?.id);
  const { data: wishlist = [] } = useWishlist(user?.id);
  const addToWishlist = useAddToWishlist();

  const [showCoverPicker, setShowCoverPicker] = useState(false);

  if (isLoading) {
    return (
      <div className="pb-16 md:pb-0 md:ml-20">
        <div className="p-4">
          <div className="h-5 w-24 bg-bg-elevated rounded animate-pulse mb-4" />
          <div className="glass rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 bg-bg-elevated rounded-lg animate-pulse" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-48 bg-bg-elevated rounded animate-pulse" />
                <div className="h-5 w-20 bg-bg-elevated rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !deckData) {
    return (
      <div className="pb-16 md:pb-0 md:ml-20">
        <div className="p-4 text-center py-12">
          <p className="text-text-secondary mb-4">{t('deckNotFound')}</p>
          <button onClick={() => navigate('/decks')} className="bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary transition-colors">
            {t('backToDecks')}
          </button>
        </div>
      </div>
    );
  }

  const deckCards = deckData.deck_cards || [];
  const cards = deckCards.map(dc => ({ ...dc, ...(dc.cards || {}) }));

  let coverUrl = null;
  if (deckData.cover_card) {
    const cover = cards.find(c => c.card_number === deckData.cover_card);
    coverUrl = cover?.image_url || null;
  } else if (cards.length > 0) {
    coverUrl = cards[0].image_url;
  }

  const collectionNumbers = new Set(collection.map(col => col.card_number));
  const wishlistNumbers = new Set(wishlist.map(w => w.card_number));
  const missingCards = cards.filter(c => !collectionNumbers.has(c.card_number));

  const handleRemoveCard = async (cardNumber) => {
    const removedCard = cards.find(c => c.card_number === cardNumber);
    await removeCardFromDeck.mutateAsync({ deckId: id, cardNumber });

    toast.custom((toastInstance) => (
      <div className="bg-bg-card text-text-primary px-4 py-3 rounded-lg shadow-xl border border-border-color flex items-center gap-3">
        <span>{removedCard?.name} {t('removedFromDeck')}</span>
        <button
          className="text-accent-primary font-semibold text-sm hover:underline"
          onClick={async () => {
            await addCardToDeck.mutateAsync({ deckId: id, cardNumber, quantity: removedCard?.quantity || 1 });
            toast.dismiss(toastInstance.id);
          }}
        >
          {t('undo')}
        </button>
      </div>
    ), { duration: 4000 });
  };

  const handleSetCover = async (cardNumber) => {
    await updateDeck.mutateAsync({ deckId: id, updates: { cover_card: cardNumber } });
    const card = cards.find(c => c.card_number === cardNumber);
    setShowCoverPicker(false);
    toast.success(t('coverUpdated'));
  };

  const handleAddMissingToWishlist = async () => {
    for (const card of missingCards) {
      await addToWishlist.mutateAsync({ userId: user.id, cardNumber: card.card_number });
    }
    if (missingCards.length > 0) {
      toast.success(`${missingCards.length} ${t('cardsAddedToWishlist')}`);
    } else {
      toast(t('allCardsInWishlist'));
    }
  };

  return (
    <div className="pb-16 md:pb-0 md:ml-20">
      <div className="p-4">
        <button onClick={() => navigate('/decks')} className="flex items-center text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('backToDecks')}
        </button>

        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div
              className="relative w-full md:w-48 h-48 bg-bg-elevated rounded-lg flex items-center justify-center shrink-0"
              onMouseEnter={() => setShowCoverPicker(true)}
              onMouseLeave={() => setShowCoverPicker(false)}
            >
              {coverUrl ? (
                <img src={coverUrl} alt={deckData.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="bg-bg-card border-2 border-dashed rounded-xl w-24 h-24" />
              )}
              {showCoverPicker && cards.length > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="bg-bg-card rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold mb-2">{t('setAsCover')}</p>
                    {cards.map(c => (
                      <button
                        key={c.card_number}
                        onClick={() => handleSetCover(c.card_number)}
                        className="block text-xs text-left w-full px-2 py-1 hover:bg-bg-elevated rounded"
                      >
                        {c.card_number} - {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{deckData.name}</h1>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDeckColorClass(deckData.color)}`}>
                  {deckData.color}
                </span>
                <span className="bg-bg-elevated px-3 py-1 rounded-full text-sm text-text-secondary">
                  {cards.length} cards
                </span>
              </div>
              {missingCards.length > 0 && (
                <button
                  onClick={handleAddMissingToWishlist}
                  className="flex items-center px-4 py-2 bg-warning text-bg-primary rounded-lg hover:bg-amber-600"
                >
                  <HeartOutline className="h-5 w-5 mr-2" />
                  Add {missingCards.length} missing to Wishlist
                </button>
              )}
            </div>
          </div>
        </div>

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map(card => (
              <div key={card.card_number} className="relative group">
                <Card
                  card={card}
                  isOwned={collectionNumbers.has(card.card_number)}
                  isInWishlist={wishlistNumbers.has(card.card_number)}
                  onAddToWishlist={(cardNumber) => addToWishlist.mutate({ userId: user.id, cardNumber })}
                />
                <button
                  onClick={() => handleRemoveCard(card.card_number)}
                  className="absolute top-2 left-2 p-1.5 rounded-full bg-danger/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                  title={t('removeFromDeck')}
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary mb-4">{t('noCardsYet')}</p>
            <button onClick={() => navigate('/catalogue')} className="bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary">
              {t('browseCatalogue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
