import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HeartIcon, ArrowDownTrayIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useWishlist, useAddToCollection, useRemoveFromWishlist, useAddToWishlist } from '../hooks/useCards';
import { getRarityClass } from '../utils/cardUtils';
import { t } from '../i18n';

export default function Wishlist() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: collection = [] } = useCollection(user?.id);
  const { data: wishlistData = [], isLoading } = useWishlist(user?.id);
  const addToCollection = useAddToCollection();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToWishlist = useAddToWishlist();

  const totalTargetValue = useMemo(() =>
    wishlistData.reduce((sum, item) => sum + (item.target_price || 0), 0),
    [wishlistData]
  );

  const moveToCollection = (cardNumber) => {
    addToCollection.mutate({
      userId: user.id,
      cardNumber,
      qtyNormal: 1,
      qtyFoil: 0,
      condition: 'NM',
      purchasePrice: null
    });
    removeFromWishlist.mutate({ userId: user.id, cardNumber });
    toast.success('Card marked as owned');
  };

  const handleRemoveFromWishlist = (cardNumber, cardName) => {
    removeFromWishlist.mutate({ userId: user.id, cardNumber });
    toast.custom((toastComponent) => (
      <div className="bg-bg-card text-text-primary px-4 py-3 rounded-lg shadow-xl border border-border-color flex items-center gap-3">
        <span>{cardName} {t('removedFromWishlist')}</span>
        <button
          className="text-warning font-semibold text-sm hover:underline"
          onClick={() => {
            addToWishlist.mutate({ userId: user.id, cardNumber });
            toast.dismiss(toastComponent.id);
          }}
        >
          {t('undo')}
        </button>
      </div>
    ), { duration: 4000 });
  };

  return (
    <div className="pb-16 md:pb-0 md:ml-20">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">{t('wishlist')}</h1>
          <div className="flex space-x-2">
            <button className="flex items-center bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary">
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              {t('export')}
            </button>
            <button className="flex items-center bg-bg-card text-text-primary px-4 py-2 rounded-lg border border-border-color hover:bg-bg-elevated">
              <ShareIcon className="h-5 w-5 mr-2" />
              {t('share')}
            </button>
          </div>
        </div>

        <div className="glass rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{t('wishlistSummary')}</h2>
              <p className="text-text-secondary">{wishlistData.length} cards</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-warning">{wishlistData.length}</p>
              <p className="text-sm text-text-secondary">{t('cardsWantedShort')}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">{t('loadingWishlist')}</p>
          </div>
        ) : wishlistData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistData.map((item) => {
              const card = item.cards || {};
              return (
                <div key={item.card_number} className="glass rounded-xl overflow-hidden card-hover">
                  <div className="bg-bg-elevated h-48 flex items-center justify-center relative">
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="bg-bg-card border-2 border-dashed rounded-xl w-16 h-16" />
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`text-white text-xs px-2 py-1 rounded ${getRarityClass(card.rarity)}`}>
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{card.name || t('unknownCard')}</h3>
                        <p className="text-sm text-text-secondary">{item.card_number}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-text-secondary">{t('priority')}</p>
                        <p className="font-semibold">{t('levelPriority')} {item.priority || 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-secondary">{t('targetPrice')}</p>
                        <p className="font-semibold">{item.target_price ? `€${item.target_price.toFixed(2)}` : t('notAvailable')}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => moveToCollection(item.card_number)}
                          className="text-xs bg-success text-bg-primary px-2 py-1 rounded hover:bg-green-600"
                        >
                          {t('markAsOwned')}
                        </button>
                        <button
                          onClick={() => handleRemoveFromWishlist(item.card_number, card.name)}
                          className="text-xs bg-danger text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          <TrashIcon className="h-3.5 w-3.5 inline mr-1" />
                          {t('remove')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <HeartIcon className="h-16 w-16 text-border-color mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('wishlistEmpty')}</h3>
            <p className="text-text-secondary mb-4">{t('addFromCatalogue')}</p>
            <button onClick={() => navigate('/catalogue')} className="bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary">
              {t('browseCatalogue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}