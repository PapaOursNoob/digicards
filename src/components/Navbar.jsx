import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  HeartIcon,
  RectangleStackIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  EllipsisHorizontalIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import useStore from '../store/useStore';
import { t } from '../i18n';

const mainNav = [
  { key: 'home', href: '/', icon: HomeIcon },
  { key: 'search', href: '/catalogue', icon: MagnifyingGlassIcon },
  { key: 'collection', href: '/collection', icon: FolderIcon },
  { key: 'wishlist', href: '/wishlist', icon: HeartIcon },
];

const overflowNav = [
  { key: 'decks', href: '/decks', icon: RectangleStackIcon },
  { key: 'settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);

  const isDark = (settings.theme || 'dark') === 'dark';

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const navLinkClass = (isActive) =>
    `flex flex-col items-center py-2 px-2 rounded-lg md:p-3 transition-all ${
      isActive
        ? 'text-accent-primary'
        : 'text-text-secondary hover:text-text-primary'
    }`;

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-bg-card/95 backdrop-blur-sm border-t border-border-color md:left-auto md:w-20 md:h-screen md:flex md:flex-col md:justify-between md:top-0 md:right-auto md:border-r md:border-t-0 z-50 transition-colors duration-300">
      {/* Desktop nav */}
      <div className="hidden md:flex md:flex-col md:items-center md:py-5 md:space-y-6">
        <Link to="/" className="mb-2">
          <img src="/favicon.svg" alt="Digicards" className="w-10 h-10" />
        </Link>
        {[...mainNav, ...overflowNav].map((item) => (
          <Link
            key={item.key}
            to={item.href}
            className={navLinkClass(isActive(item.href))}
            title={t(item.key)}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        ))}
      </div>
      {/* Desktop bottom: theme toggle + auth */}
      <div className="hidden md:flex md:flex-col md:items-center md:pb-5 md:space-y-4">
        <button
          onClick={toggleTheme}
          title={isDark ? t('switchToLight') : t('switchToDark')}
          className="p-3 rounded-lg text-text-secondary hover:text-accent-primary transition-colors"
        >
          {isDark ? <SunIcon className="h-6 w-6" /> : <MoonIcon className="h-6 w-6" />}
        </button>
        {user ? (
          <button
            onClick={handleSignOut}
            title={t('signOut')}
            className="flex flex-col items-center p-3 rounded-lg text-text-secondary hover:text-danger transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        ) : (
          <Link
            to="/auth"
            className="flex flex-col items-center p-3 rounded-lg text-text-secondary hover:text-text-primary"
          >
            <ArrowRightEndOnRectangleIcon className="h-6 w-6" />
            <span className="text-xs mt-1">{t('signIn')}</span>
          </Link>
        )}
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden items-center justify-around py-1">
        <Link to="/" className="flex items-center px-2 py-1">
          <img src="/favicon.svg" alt="Digicards" className="w-6 h-6" />
        </Link>
        {mainNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`flex flex-col items-center px-2 py-1 rounded-lg transition-all ${
                active ? 'text-accent-primary scale-105' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-[10px] mt-0.5 font-medium">{t(item.key)}</span>
              {active && <div className="h-0.5 w-4 bg-accent-primary rounded-full mt-0.5" />}
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(!showMore)}
          className={`flex flex-col items-center px-2 py-1 rounded-lg transition-all ${
            showMore ? 'text-accent-primary' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {showMore ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <EllipsisHorizontalIcon className="h-6 w-6" />
          )}
          <span className="text-[10px] mt-0.5 font-medium">{t('more')}</span>
        </button>

        {user ? (
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center px-2 py-1 rounded-lg text-text-secondary hover:text-danger transition-colors"
            title={t('signOut')}
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="text-[10px] mt-0.5 font-medium">{t('logout')}</span>
          </button>
        ) : (
          <Link
            to="/auth"
            className="flex flex-col items-center px-2 py-1 rounded-lg text-text-secondary hover:text-text-primary"
          >
            <ArrowRightEndOnRectangleIcon className="h-6 w-6" />
            <span className="text-[10px] mt-0.5 font-medium">{t('signIn')}</span>
          </Link>
        )}
      </div>

      {/* More menu overlay */}
      {showMore && (
        <div className="absolute bottom-16 left-4 right-4 md:hidden bg-bg-card border border-border-color rounded-xl shadow-2xl p-3 transition-colors">
          <div className="grid grid-cols-4 gap-3">
            {overflowNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                    active ? 'text-accent-primary bg-bg-elevated' : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`}
                >
                  <item.icon className="h-6 w-6 mb-1" />
                  <span className="text-xs">{t(item.key)}</span>
                </Link>
              );
            })}
            <button
              onClick={() => { toggleTheme(); setShowMore(false); }}
              className="flex flex-col items-center p-3 rounded-lg text-text-secondary hover:text-accent-primary hover:bg-bg-elevated transition-all"
            >
              {isDark ? <SunIcon className="h-6 w-6 mb-1" /> : <MoonIcon className="h-6 w-6 mb-1" />}
              <span className="text-xs">{isDark ? t('light') : t('dark')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
