import React, { memo, useCallback } from 'react';
import { PlusIcon, HeartIcon as HeartOutline, MinusIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { getRarityClass, getCardBorderColorClass } from '../utils/cardUtils';
import { t } from '../i18n';

const ZOOM_STYLES = {
  1: { card: 'text-xs', img: 'min-h-[120px]', info: 'p-1.5', name: 'text-[10px]', meta: 'text-[9px]', badge: 'text-[8px] px-1 py-0.5', btn: 'p-0.5', btnIcon: 'h-3 w-3' },
  2: { card: 'text-xs', img: 'min-h-[160px]', info: 'p-2', name: 'text-xs', meta: 'text-[10px]', badge: 'text-[9px] px-1 py-0.5', btn: 'p-0.5', btnIcon: 'h-3.5 w-3.5' },
  3: { card: 'text-sm', img: 'min-h-[220px]', info: 'p-3', name: 'text-sm', meta: 'text-xs', badge: 'text-xs px-1.5 py-0.5', btn: 'p-1', btnIcon: 'h-4 w-4' },
  4: { card: 'text-sm', img: 'min-h-[280px]', info: 'p-3', name: 'text-sm', meta: 'text-xs', badge: 'text-xs px-1.5 py-0.5', btn: 'p-1', btnIcon: 'h-4 w-4' },
  5: { card: 'text-base', img: 'min-h-[340px]', info: 'p-4', name: 'text-base', meta: 'text-sm', badge: 'text-sm px-2 py-1', btn: 'p-1.5', btnIcon: 'h-5 w-5' },
};

const Card = memo(function Card({
  card,
  isOwned = false,
  isInWishlist = false,
  zoomLevel = 3,
  hideWishlistOnOwned = false,
  grayscaleNonOwned = true,
  onAddToCollection,
  onAddToWishlist,
  onRemoveFromCollection,
  onRemoveFromWishlist,
  onClick
}) {
  const isAltArt = card.card_number?.includes('A') || card.rarity === 'P';
  const s = ZOOM_STYLES[zoomLevel] || ZOOM_STYLES[3];

  const handleCollectionClick = useCallback((e) => {
    e.stopPropagation();
    if (isOwned) {
      onRemoveFromCollection?.(card.card_number);
    } else {
      onAddToCollection({
        card_number: card.card_number,
        qty_normal: 1,
        qty_foil: 0,
        condition: 'NM',
        purchase_price: null
      });
    }
  }, [card.card_number, isOwned, onAddToCollection, onRemoveFromCollection]);

  const handleWishlistClick = useCallback((e) => {
    e.stopPropagation();
    if (isInWishlist) {
      onRemoveFromWishlist?.(card.card_number);
    } else {
      onAddToWishlist(card.card_number);
    }
  }, [card.card_number, isInWishlist, onAddToWishlist, onRemoveFromWishlist]);

  return (
    <div
      className={`rounded-xl overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02] ${getCardBorderColorClass(card.color)}`}
      onClick={onClick}
    >
      <div className={`relative bg-bg-elevated aspect-[3/4] ${s.img} flex items-center justify-center`}>
        {card.image_url ? (
          <img src={card.image_url} alt={card.name} className={`max-h-full max-w-full object-contain ${!isOwned && grayscaleNonOwned ? 'grayscale' : ''}`} />
        ) : (
          <div className="bg-bg-card border-2 border-dashed rounded-xl w-20 h-20" />
        )}

        {isAltArt && (
          <div className={`absolute top-1.5 left-1.5 bg-accent-primary text-bg-primary ${s.badge} rounded font-bold`}>
            AA
          </div>
        )}

        <div className="absolute top-1.5 right-1.5 flex space-x-1">
          {isOwned && (
            <span className={`bg-success text-bg-primary ${s.badge} rounded-full`}>{t('owned')}</span>
          )}
          {isInWishlist && (
            <span className={`bg-warning text-bg-primary ${s.badge} rounded-full`}>{t('wish')}</span>
          )}
        </div>

        <div className="absolute bottom-1.5 right-1.5 flex space-x-1">
          <button
            onClick={handleCollectionClick}
            className={`${s.btn} rounded-full ${isOwned ? 'bg-danger text-white' : 'bg-bg-card text-text-secondary hover:bg-bg-primary'}`}
          >
            {isOwned ? <MinusIcon className={s.btnIcon} /> : <PlusIcon className={s.btnIcon} />}
          </button>
          {!(isOwned && hideWishlistOnOwned) && (
            <button
              onClick={handleWishlistClick}
              className={`${s.btn} rounded-full ${isInWishlist ? 'bg-warning text-white' : 'bg-bg-card text-text-secondary hover:bg-warning hover:text-white'}`}
            >
              {isInWishlist ? <HeartSolid className={s.btnIcon} /> : <HeartOutline className={s.btnIcon} />}
            </button>
          )}
        </div>
      </div>
      <div className={`${s.info} bg-bg-card`}>
        <div className="flex justify-between items-start gap-1">
          <div className="min-w-0">
            <h3 className={`font-bold text-text-primary truncate ${s.name}`}>{card.name}</h3>
            <p className={`text-text-secondary truncate ${s.meta}`}>{card.set_name} • {card.card_number}</p>
          </div>
          <span className={`shrink-0 rounded-full font-bold text-white ${s.badge} ${getRarityClass(card.rarity)}`}>
            {card.rarity}
          </span>
        </div>
      </div>
    </div>
  );
});

export default Card;
