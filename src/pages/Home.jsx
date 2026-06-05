import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCollection, useWishlist, useDecks } from '../hooks/useCards';
import { useSets } from '../hooks/useSets';
import { t } from '../i18n';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: collection = [] } = useCollection(user?.id);
  const { data: wishlist = [] } = useWishlist(user?.id);
  const { data: decks = [] } = useDecks(user?.id);
  const { data: sets } = useSets(collection, wishlist);

  const stats = useMemo(() => {
    const totalCards = collection.reduce((sum, item) => sum + (item.qty_normal || 0) + (item.qty_foil || 0), 0);
    const collectionValue = collection.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
    return { totalCards, totalWishlist: wishlist.length, collectionValue };
  }, [collection, wishlist]);

  const ownedSets = useMemo(() =>
    sets?.filter(s => s.ownedCards > 0)
      ?.sort((a, b) => b.ownedCards - a.ownedCards)
      ?.slice(0, 5) ?? [],
    [sets]
  );

  const recentAdditions = useMemo(() =>
    [...collection]
      .sort((a, b) => new Date(b.added_at || 0) - new Date(a.added_at || 0))
      .slice(0, 5),
    [collection]
  );

  const lastDeck = decks[0] || null;

  return (
    <div className="pb-16 md:pb-0 md:ml-20">
      <div className="p-4">
        <img src="/digicards-logo.png" alt="Digicards" className="h-16 md:h-20 mb-6" />

        {user ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-2">{t('collection')}</h2>
                <p className="text-3xl font-bold text-accent-primary">{stats.totalCards}</p>
                <p className="text-text-secondary">{t('cardsOwned')}</p>
              </div>
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-2">{t('wishlist')}</h2>
                <p className="text-3xl font-bold text-warning">{stats.totalWishlist}</p>
                <p className="text-text-secondary">{t('cardsWanted')}</p>
              </div>
              <div className="glass rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-2">Value</h2>
                <p className="text-3xl font-bold text-success">€{stats.collectionValue.toFixed(2)}</p>
                <p className="text-text-secondary">{t('estimatedValue')}</p>
              </div>
            </div>

            {ownedSets.length > 0 && (
              <div className="glass rounded-xl p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">{t('setCompletion')}</h2>
                <div className="space-y-4">
                  {ownedSets.map((set) => {
                    const pct = set.totalCards > 0 ? Math.round((set.ownedCards / set.totalCards) * 100) : 0;
                    return (
                      <div key={set.name}>
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{set.name}</span>
                          <span className="text-text-secondary">{set.ownedCards}/{set.totalCards} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-bg-elevated rounded-full h-2.5">
                          <div className="bg-accent-primary h-2.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {recentAdditions.length > 0 && (
              <div className="glass rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">{t('recentAdditions')}</h2>
                <div className="space-y-4">
                  {recentAdditions.map(item => (
                    <div key={item.card_number} className="flex items-center">
                      {item.cards?.image_url ? (
                        <img src={item.cards.image_url} alt={item.cards.name} className="w-16 h-20 object-cover rounded mr-4" />
                      ) : (
                        <div className="bg-bg-card border-2 border-dashed rounded-xl w-16 h-16 mr-4 flex items-center justify-center text-xs text-text-secondary">
                          {item.card_number}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{item.cards?.name || t('unknownCard')}</h3>
                        <p className="text-sm text-text-secondary">{item.card_number}</p>
                        <p className="text-xs text-text-secondary">
                          {item.qty_normal > 0 && `${item.qty_normal} ${t('normal')}`}
                          {item.qty_normal > 0 && item.qty_foil > 0 && ' • '}
                          {item.qty_foil > 0 && `${item.qty_foil} ${t('foil')}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastDeck && (
              <div className="glass rounded-xl p-6 mt-8">
                <h2 className="text-2xl font-semibold mb-4">{t('lastDeck')}</h2>
                <div
                  className="flex items-center cursor-pointer hover:bg-bg-elevated rounded-lg p-3"
                  onClick={() => navigate(`/decks/${lastDeck.id}`)}
                >
                  {lastDeck.coverUrl ? (
                    <img src={lastDeck.coverUrl} alt={lastDeck.name} className="w-16 h-16 object-cover rounded mr-4" />
                  ) : (
                    <div className="bg-bg-card border-2 border-dashed rounded-xl w-16 h-16 mr-4 flex items-center justify-center text-xs text-text-secondary">
                      {lastDeck.name?.[0] || 'D'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{lastDeck.name}</h3>
                    <p className="text-sm text-text-secondary">{lastDeck.color || t('noColor')}</p>
                  </div>
                </div>
              </div>
            )}

            {stats.totalCards === 0 && (
              <div className="glass rounded-xl p-8 text-center">
                <div className="text-6xl mb-4 opacity-30">📦</div>
                <h2 className="text-xl font-semibold mb-2">{t('collectionEmpty')}</h2>
                <p className="text-text-secondary mb-6 max-w-md mx-auto">
                  {t('startBuilding')}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => navigate('/catalogue')} className="bg-accent-primary text-bg-primary px-5 py-2.5 rounded-lg hover:bg-accent-secondary transition-colors font-medium">
                    {t('browseCatalogue')}
                  </button>
                  <button onClick={() => navigate('/wishlist')} className="bg-bg-card text-text-primary px-5 py-2.5 rounded-lg border border-border-color hover:bg-bg-elevated transition-colors font-medium">
                    {t('viewWishlist')}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="glass rounded-xl p-8 text-center mb-8">
            <img src="/digicards-logo.png" alt="Digicards" className="h-24 md:h-32 mx-auto mb-6" />
            <p className="mb-6">{t('signInToStart')}</p>
            <button
              onClick={() => navigate('/auth')}
              className="px-6 py-3 bg-accent-primary text-bg-primary rounded-lg font-semibold hover:bg-accent-secondary transition-colors"
            >
              {t('signIn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}