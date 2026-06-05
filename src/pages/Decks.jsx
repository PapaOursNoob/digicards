import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, RectangleStackIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useDecks, useCreateDeck, useUpdateDeck, useDeleteDeck } from '../hooks/useCards';
import { getDeckColorClass } from '../utils/cardUtils';
import { t } from '../i18n';

const DECK_COLORS = ['Red', 'Blue', 'Yellow', 'Green', 'Black', 'Purple', 'White'];

export default function Decks() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: decksData = [], isLoading } = useDecks(user?.id);
  const createDeck = useCreateDeck();
  const updateDeck = useUpdateDeck();
  const deleteDeck = useDeleteDeck();

  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckColor, setNewDeckColor] = useState('Blue');
  const [editingDeck, setEditingDeck] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeckName.trim() || !user) return;

    await createDeck.mutateAsync({
      userId: user.id,
      deck: { name: newDeckName, color: newDeckColor, description: '', is_public: false }
    });
    toast.success(t('deckCreated'));
    setNewDeckName('');
    setNewDeckColor('Blue');
    setShowNewDeckForm(false);
  };

  const handleEditStart = (deck) => {
    setEditingDeck(deck.id);
    setEditName(deck.name);
    setEditColor(deck.color || 'Blue');
  };

  const handleEditSave = async () => {
    if (!editName.trim() || !editingDeck) return;
    await updateDeck.mutateAsync({ deckId: editingDeck, updates: { name: editName, color: editColor } });
    toast.success(t('deckUpdated'));
    setEditingDeck(null);
  };

  const handleDelete = async (deckId) => {
    await deleteDeck.mutateAsync(deckId);
    toast.success(t('deckDeleted'));
    setDeleteConfirm(null);
  };

  return (
    <div className="pb-16 md:pb-0 md:ml-20">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">{t('myDecks')}</h1>
          <button
            onClick={() => setShowNewDeckForm(!showNewDeckForm)}
            className="flex items-center bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t('newDeck')}
          </button>
        </div>

        {showNewDeckForm && (
          <div className="glass rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">{t('createNewDeck')}</h2>
            <form onSubmit={handleCreateDeck}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('deckName')}</label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="w-full p-3 bg-bg-card border border-border-color rounded-lg focus:ring-accent-primary focus:border-accent-primary text-text-primary"
                  placeholder={t('enterDeckName')}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">{t('deckColor')}</label>
                <select
                  value={newDeckColor}
                  onChange={(e) => setNewDeckColor(e.target.value)}
                  className="w-full p-3 bg-bg-card border border-border-color rounded-lg focus:ring-accent-primary focus:border-accent-primary text-text-primary"
                >
                  {DECK_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowNewDeckForm(false)} className="px-4 py-2 bg-bg-card text-text-primary rounded-lg border border-border-color hover:bg-bg-elevated">{t('cancel')}</button>
                <button type="submit" disabled={createDeck.isPending} className="px-4 py-2 bg-accent-primary text-bg-primary rounded-lg hover:bg-accent-secondary disabled:opacity-50">{t('createDeck')}</button>
              </div>
            </form>
          </div>
        )}

        {deleteConfirm && (
          <div className="glass rounded-xl p-6 mb-8 border border-danger">
            <p className="mb-4">{t('deleteConfirm')} <strong>{deleteConfirm.name}</strong>? {t('deleteCannotUndo')}</p>
            <div className="flex space-x-3">
              <button onClick={() => handleDelete(deleteConfirm.id)} disabled={deleteDeck.isPending} className="px-4 py-2 bg-danger text-white rounded-lg hover:bg-red-600 disabled:opacity-50">{t('delete')}</button>
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-bg-card text-text-primary rounded-lg border border-border-color hover:bg-bg-elevated">{t('cancel')}</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">{t('loadingDecks')}</p>
          </div>
        ) : decksData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decksData.map((deck) => (
              <div
                key={deck.id}
                className="glass rounded-xl overflow-hidden card-hover cursor-pointer"
                onClick={() => navigate(`/decks/${deck.id}`)}
              >
                <div className="relative">
                  <div className="bg-bg-elevated h-32 flex items-center justify-center">
                    {deck.coverUrl ? (
                      <img src={deck.coverUrl} alt={deck.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="bg-bg-card border-2 border-dashed rounded-xl w-16 h-16" />
                    )}
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDeckColorClass(deck.color)}`}>
                      {deck.color}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditStart(deck); }}
                      className="p-1.5 rounded-full bg-bg-primary/80 hover:bg-bg-elevated"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(deck); }}
                      className="p-1.5 rounded-full bg-bg-primary/80 hover:bg-danger"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {editingDeck === deck.id ? (
                    <div onClick={e => e.stopPropagation()} className="space-y-2">
                      <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 bg-bg-card border border-border-color rounded text-sm text-text-primary" autoFocus />
                      <select value={editColor} onChange={(e) => setEditColor(e.target.value)} className="w-full p-2 bg-bg-card border border-border-color rounded text-sm text-text-primary">
                        {DECK_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="flex space-x-2">
                        <button onClick={handleEditSave} disabled={updateDeck.isPending} className="px-3 py-1 bg-accent-primary text-xs rounded disabled:opacity-50">{t('save')}</button>
                        <button onClick={() => setEditingDeck(null)} className="px-3 py-1 bg-bg-card text-xs rounded border border-border-color"><XMarkIcon className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-semibold text-lg mb-2">{deck.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-text-secondary">{deck.cardCount} {t('cards')}</span>
                        <div className="w-24 bg-bg-elevated rounded-full h-2">
                          <div className="bg-accent-primary h-2 rounded-full" style={{ width: `${Math.min((deck.cardCount / 50) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <RectangleStackIcon className="h-16 w-16 text-border-color mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('noDecks')}</h3>
            <p className="text-text-secondary mb-4">{t('createFirstDeck')}</p>
            <button onClick={() => setShowNewDeckForm(true)} className="bg-accent-primary text-bg-primary px-4 py-2 rounded-lg hover:bg-accent-secondary">{t('createDeck')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
