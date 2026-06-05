import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Catalogue = lazy(() => import('./pages/Catalogue'));
const Collection = lazy(() => import('./pages/Collection'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Decks = lazy(() => import('./pages/Decks'));
const DeckView = lazy(() => import('./pages/DeckView'));
const Settings = lazy(() => import('./pages/Settings'));
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import { setLanguage, t } from './i18n';

function App() {
  const settings = useStore(state => state.settings);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme || 'dark';
    document.documentElement.dataset.accent = settings.accentColor || 'gray';
    setLanguage(settings.language || 'fr');
  }, [settings.theme, settings.accentColor, settings.language]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary transition-colors duration-300">
      <Navbar />
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-text-secondary">{t('loading')}</div></div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/collection" element={<ProtectedRoute><Collection /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
          <Route path="/decks" element={<ProtectedRoute><Decks /></ProtectedRoute>} />
          <Route path="/decks/:id" element={<ProtectedRoute><DeckView /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
