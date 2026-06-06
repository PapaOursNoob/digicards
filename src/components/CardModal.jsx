import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useAddCardToDeck, useDecks } from '../hooks/useCards';
import { t } from '../i18n';

export default function CardModal({ card, isOpen, onClose, onAddToCollection, onAddToWishlist }) {
  const [qtyNormal, setQtyNormal] = useState(1);
  const [qtyFoil, setQtyFoil] = useState(0);
  const [condition, setCondition] = useState('NM');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const { user } = useAuth();
  const { data: userDecks } = useDecks(user?.id);
  const addCardToDeck = useAddCardToDeck();

  useEffect(() => {
    if (!isOpen) {
      setQtyNormal(1);
      setQtyFoil(0);
      setCondition('NM');
      setPurchasePrice('');
      setShowDeckPicker(false);
      setSelectedDeckId('');
    }
  }, [isOpen]);

  if (!isOpen || !card) return null;

  const handleAddToCollection = () => {
    onAddToCollection({
      card_number: card.card_number,
      qty_normal: qtyNormal,
      qty_foil: qtyFoil,
      condition,
      purchase_price: purchasePrice || null
    });
    onClose();
  };

  const handleAddToWishlist = () => {
    onAddToWishlist(card.card_number);
    onClose();
  };

  const handleAddToDeck = async () => {
    if (!selectedDeckId || !user) return;
    const deck = userDecks?.find(d => d.id === selectedDeckId);
    try {
      await addCardToDeck.mutateAsync({ deckId: selectedDeckId, cardNumber: card.card_number, quantity: 1 });
      toast.success(`${card.name} ${t('addedTo')} ${deck?.name || ''}`);
      setShowDeckPicker(false);
      setSelectedDeckId('');
      onClose();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{card.name}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-bg-elevated">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-elevated rounded-lg h-96 flex items-center justify-center">
              {card.image_url ? (
                <img src={card.image_url} alt={card.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="bg-bg-card border-2 border-dashed rounded-xl w-32 h-32" />
              )}
            </div>

            <div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{t('cardDetails')}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-text-secondary">{t('cardNumber')}</p><p>{card.card_number}</p></div>
                  <div><p className="text-text-secondary">{t('set')}</p><p>{card.set_name}</p></div>
                  <div><p className="text-text-secondary">{t('type')}</p><p>{card.card_type}</p></div>
                  <div><p className="text-text-secondary">{t('color')}</p><p>{card.color}</p></div>
                  {card.level && <div><p className="text-text-secondary">{t('level')}</p><p>{card.level}</p></div>}
                  {card.form && <div><p className="text-text-secondary">{t('form')}</p><p>{card.form}</p></div>}
                  {card.attribute && <div><p className="text-text-secondary">{t('attribute')}</p><p>{card.attribute}</p></div>}
                  {card.type && <div><p className="text-text-secondary">{t('type')}</p><p>{card.type}</p></div>}
                  {card.dp && <div><p className="text-text-secondary">{t('dp')}</p><p>{card.dp}</p></div>}
                  {card.play_cost && <div><p className="text-text-secondary">{t('playCost')}</p><p>{card.play_cost}</p></div>}
                  {card.evolution_cost && <div><p className="text-text-secondary">{t('evolutionCost')}</p><p>{card.evolution_cost}</p></div>}
                  <div>
                    <p className="text-text-secondary">{t('rarity')}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold text-white ${
                      card.rarity === 'C' ? 'bg-rarity-c' :
                      card.rarity === 'U' ? 'bg-rarity-u' :
                      card.rarity === 'R' ? 'bg-rarity-r' :
                      card.rarity === 'SR' ? 'bg-rarity-sr' :
                      card.rarity === 'SEC' ? 'bg-rarity-sec' :
                      card.rarity === 'P' ? 'bg-rarity-p' :
                      'bg-rarity-c'
                    }`}>{card.rarity}</span>
                  </div>
                </div>
              </div>

              {card.effect && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{t('effect')}</h3>
                  <p className="text-sm">{card.effect}</p>
                </div>
              )}

              {card.inherited_effect && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{t('inheritedEffect')}</h3>
                  <p className="text-sm">{card.inherited_effect}</p>
                </div>
              )}

              {card.security_effect && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-amber-400">{t('securityEffect')}</h3>
                  <p className="text-sm">{card.security_effect}</p>
                </div>
              )}

              {card.alt_effect && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">{t('alternateEffect')}</h3>
                  <p className="text-sm">{card.alt_effect}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-bg-elevated rounded-lg">
            <h3 className="text-lg font-semibold mb-4">{t('addToCollection')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('normalQty')}</label>
                <input type="number" min="0" value={qtyNormal} onChange={(e) => setQtyNormal(parseInt(e.target.value) || 0)} className="w-full p-2 bg-input-bg rounded border border-border-color text-text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('foilQty')}</label>
                <input type="number" min="0" value={qtyFoil} onChange={(e) => setQtyFoil(parseInt(e.target.value) || 0)} className="w-full p-2 bg-input-bg rounded border border-border-color text-text-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('condition')}</label>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full p-2 bg-input-bg rounded border border-border-color text-text-primary">
                  <option value="NM">{t('nearMint')}</option>
                  <option value="LP">{t('lightlyPlayed')}</option>
                  <option value="MP">{t('moderatelyPlayed')}</option>
                  <option value="HP">{t('heavilyPlayed')}</option>
                  <option value="D">{t('damaged')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('purchasePrice')}</label>
                <input type="number" min="0" step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full p-2 bg-input-bg rounded border border-border-color text-text-primary" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <button onClick={handleAddToCollection} className="flex items-center px-5 py-2.5 bg-accent-primary text-bg-primary rounded-lg hover:opacity-90">
              <PlusIcon className="h-6 w-6 mr-2" />
              {t('addToCollection')}
            </button>
            <button onClick={handleAddToWishlist} className="flex items-center px-5 py-2.5 bg-warning text-bg-primary rounded-lg hover:bg-amber-600">
              <HeartIcon className="h-6 w-6 mr-2" />
              {t('addToWishlist')}
            </button>
            {showDeckPicker ? (
              <div className="flex items-center gap-2">
                <select value={selectedDeckId} onChange={(e) => setSelectedDeckId(e.target.value)} className="p-2 bg-input-bg border border-border-color rounded text-sm text-text-primary">
                  <option value="">{t('selectDeck')}</option>
                  {userDecks?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <button onClick={handleAddToDeck} disabled={!selectedDeckId || addCardToDeck.isPending} className="px-3 py-2 bg-accent-primary text-bg-primary rounded-lg text-sm disabled:opacity-50">
                  {t('add')}
                </button>
                <button onClick={() => { setShowDeckPicker(false); setSelectedDeckId(''); }} className="px-3 py-2 bg-bg-card rounded-lg text-sm border border-border-color">
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowDeckPicker(true)} className="flex items-center px-4 py-2 bg-bg-elevated rounded-lg hover:bg-bg-card border border-border-color">
                <ShoppingCartIcon className="h-5 w-5 mr-2" />
                {t('addToDeck')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
