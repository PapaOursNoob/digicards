import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ViewColumnsIcon,
  SwatchIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  HeartIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import useStore from '../store/useStore.jsx';
import { useAuth } from '../contexts/AuthContext';
import { useCollection, useWishlist, useDecks } from '../hooks/useCards';
import { supabase } from '../lib/supabase';
import { t, setLanguage } from '../i18n';

const ACCENT_COLORS = [
  { id: 'gray', label: 'Gray', colorDark: '#f8fafc', colorLight: '#1e293b' },
  { id: 'blue', label: 'Blue', colorDark: '#3b82f6', colorLight: '#3b82f6' },
  { id: 'red', label: 'Red', colorDark: '#ef4444', colorLight: '#ef4444' },
  { id: 'green', label: 'Green', colorDark: '#22c55e', colorLight: '#22c55e' },
  { id: 'violet', label: 'Violet', colorDark: '#8b5cf6', colorLight: '#8b5cf6' },
  { id: 'yellow', label: 'Yellow', colorDark: '#eab308', colorLight: '#eab308' },
];

function validatePassword(pw) {
  return {
    minLength: pw.length >= 8,
    hasUpper: /[A-Z]/.test(pw),
    hasLower: /[a-z]/.test(pw),
    hasNumber: /[0-9]/.test(pw),
  };
}

export default function Settings() {
  const settings = useStore(state => state.settings);
  const updateSettings = useStore(state => state.updateSettings);
  const clearData = useStore(state => state.clearData);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: collection = [] } = useCollection(user?.id);
  const { data: wishlist = [] } = useWishlist(user?.id);
  const { data: decks = [] } = useDecks(user?.id);

  const [activeTab, setActiveTab] = useState('profile');
  const [currency, setCurrency] = useState(settings.currency || 'EUR');
  const [language, setLanguageState] = useState(settings.language || 'fr');
  const [displayMode, setDisplayMode] = useState(settings.displayMode || 'grid');
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [notifications, setNotifications] = useState({ priceAlerts: true, newSetReleases: false, collectionUpdates: true });
  const [loading, setLoading] = useState(true);

  // Password change state
  const pwCurrentRef = useRef('');
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const pwValidation = validatePassword(pwNew);
  const pwValid = pwValidation.minLength && pwValidation.hasUpper && pwValidation.hasLower && pwValidation.hasNumber;
  const pwMatch = pwNew === pwConfirm && pwNew.length > 0;

  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      if (!user) { setLoading(false); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!cancelled && profile) {
        setProfileData(prev => ({ ...prev, name: profile.full_name || '', email: user.email || '' }));
      } else if (!cancelled) {
        setProfileData(prev => ({ ...prev, email: user.email || '' }));
      }
      if (!cancelled) setLoading(false);
    };
    fetchProfile();
    return () => { cancelled = true; };
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: profileData.name }).eq('id', user.id);
    if (error) { toast.error(t('errorUpdatingProfile')); return; }
    toast.success(t('profileUpdated'));
  };

  const handleChangePassword = async () => {
    if (!pwValid || !pwMatch || !pwCurrentRef.current || pwLoading) return;
    setPwLoading(true);

    const currentPw = pwCurrentRef.current;

    // Verify current password by signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPw
    });
    if (signInError) {
      toast.error(t('incorrectPassword'));
      setPwLoading(false);
      return;
    }

    // Update to new password
    const { error: pwError } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (pwError) { toast.error(t('errorUpdatingPassword')); return; }

    // Clear password fields
    pwCurrentRef.current = '';
    setPwNew('');
    setPwConfirm('');
    toast.success(t('passwordUpdated'));
  };

  const handleExport = (format) => toast.success(`${t('exportComingSoon')} ${format} — ${t('comingSoon')}`);

  const handleDeleteAccount = async () => {
    if (!user) return;
    if (!window.confirm(t('deleteAccountConfirm'))) return;

    const { error } = await supabase.functions.invoke('delete-account');
    if (error) {
      toast.error(t('errorDeletingAccount'));
      return;
    }
    clearData();
    await signOut();
    toast.success(t('accountDeleted'));
    navigate('/');
  };

  const handleLanguageChange = (value) => {
    setLanguageState(value);
    updateSettings({ language: value });
    setLanguage(value);
  };

  if (loading) {
    return (
      <div className="pb-16 md:pb-0 md:ml-20">
        <div className="p-4">
          <h1 className="text-3xl font-bold mb-6">{t('settings')}</h1>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-text-secondary">{t('loadingSettings')}</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    collectionCount: collection.length,
    wishlistCount: wishlist.length,
    deckCount: decks.length
  };

  return (
    <div className="pb-16 md:pb-0 md:ml-20">
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6">{t('settings')}</h1>

        <div className="glass rounded-xl overflow-hidden">
          <div className="flex border-b border-border-color">
            {['profile', 'preferences', 'data'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 font-medium capitalize transition-colors ${activeTab === tab ? 'text-accent-primary border-b-2 border-accent-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {t(`${tab}Tab`)}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ── Profile Tab ──────────────────────────── */}
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  {t('profileSettings')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('name')}</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 bg-input-bg border border-border-color rounded-lg focus:ring-accent-primary focus:border-accent-primary text-text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('email')}</label>
                      <input
                        type="email"
                        value={profileData.email}
                        readOnly
                        className="w-full p-3 bg-input-bg border border-border-color rounded-lg text-text-secondary cursor-not-allowed"
                      />
                      <p className="text-xs text-text-secondary mt-1">{t('emailReadonly')}</p>
                    </div>
                  </div>
                  <div className="glass rounded-xl p-6 h-full">
                    <h3 className="text-xl font-semibold mb-4">{t('accountInfo')}</h3>
                    <div className="space-y-3">
                      <div><p className="text-text-secondary">{t('memberSince')}</p><p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p></div>
                      <div><p className="text-text-secondary">{t('collectionSize')}</p><p>{stats.collectionCount} cards</p></div>
                      <div><p className="text-text-secondary">{t('wishlistItems')}</p><p>{stats.wishlistCount} cards</p></div>
                      <div><p className="text-text-secondary">{t('decksCreated')}</p><p>{stats.deckCount} decks</p></div>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <button onClick={handleSaveProfile} className="bg-accent-primary text-bg-primary px-6 py-3 rounded-lg hover:opacity-90 font-medium">{t('saveChanges')}</button>
                </div>

                {/* ── Password Change ─────────────────── */}
                <div className="mt-10 border-t border-border-color pt-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2" />
                    {t('changePassword')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('currentPassword')}</label>
                      <input
                        type="password"
                        onChange={(e) => { pwCurrentRef.current = e.target.value; }}
                        placeholder={t('enterCurrentPassword')}
                        className="w-full p-3 bg-input-bg border border-border-color rounded-lg focus:ring-accent-primary focus:border-accent-primary text-text-primary"
                      />
                    </div>
                    <div></div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('newPassword')}</label>
                      <input
                        type="password"
                        value={pwNew}
                        onChange={(e) => setPwNew(e.target.value)}
                        placeholder={t('enterNewPassword')}
                        className="w-full p-3 bg-input-bg border border-border-color rounded-lg focus:ring-accent-primary focus:border-accent-primary text-text-primary"
                      />
                      {pwNew.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {[
                            { ok: pwValidation.minLength, text: t('atLeast8Chars') },
                            { ok: pwValidation.hasUpper, text: t('oneUppercase') },
                            { ok: pwValidation.hasLower, text: t('oneLowercase') },
                            { ok: pwValidation.hasNumber, text: t('oneNumber') },
                          ].map(({ ok, text }) => (
                            <div key={text} className={`flex items-center text-xs ${ok ? 'text-success' : 'text-danger'}`}>
                              {ok ? <CheckCircleIcon className="h-3 w-3 mr-1" /> : <XCircleIcon className="h-3 w-3 mr-1" />}
                              {text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">{t('confirmNewPassword')}</label>
                      <input
                        type="password"
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                        placeholder={t('confirmNewPasswordPlaceholder')}
                        className="w-full p-3 bg-input-bg border border-border-color rounded-lg focus:ring-accent-primary focus:border-accent-primary text-text-primary"
                      />
                      {pwConfirm.length > 0 && (
                        <div className={`mt-2 flex items-center text-xs ${pwMatch ? 'text-success' : 'text-danger'}`}>
                          {pwMatch ? <CheckCircleIcon className="h-3 w-3 mr-1" /> : <XCircleIcon className="h-3 w-3 mr-1" />}
                          {pwMatch ? t('passwordsMatch') : t('passwordsNoMatch')}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleChangePassword}
                    disabled={!pwValid || !pwMatch || pwLoading}
                    className="mt-4 bg-accent-primary text-bg-primary px-6 py-3 rounded-lg hover:opacity-90 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pwLoading ? t('updating') : t('updatePassword')}
                  </button>
                </div>
              </div>
            )}

            {/* ── Preferences Tab ─────────────────────── */}
            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">{t('preferencesTab')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><ViewColumnsIcon className="h-5 w-5 mr-2" />{t('display')}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('defaultViewMode')}</label>
                        <select value={displayMode} onChange={(e) => setDisplayMode(e.target.value)} className="w-full p-3 bg-input-bg border border-border-color rounded-lg text-text-primary">
                          <option value="grid">{t('gridView')}</option>
                          <option value="list">{t('listView')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('currency')}</label>
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-3 bg-input-bg border border-border-color rounded-lg text-text-primary">
                          <option value="EUR">{t('euro')}</option>
                          <option value="USD">{t('usDollar')}</option>
                          <option value="GBP">{t('britishPound')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">{t('language')}</label>
                        <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="w-full p-3 bg-input-bg border border-border-color rounded-lg text-text-primary">
                          <option value="fr">{t('french')}</option>
                          <option value="en">{t('english')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><SwatchIcon className="h-5 w-5 mr-2" />{t('accentColor')}</h3>
                    <p className="text-sm text-text-secondary mb-4">{t('chooseAccent')}</p>
                    <div className="grid grid-cols-4 gap-3">
                      {ACCENT_COLORS.map(c => {
                        const isDark = (settings.theme || 'dark') === 'dark';
                        const displayColor = isDark ? c.colorDark : c.colorLight;
                        return (
                          <button
                            key={c.id}
                            onClick={() => updateSettings({ accentColor: c.id })}
                            className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                              (settings.accentColor || 'gray') === c.id
                                ? 'border-accent-primary bg-bg-elevated'
                                : 'border-transparent hover:border-border-color'
                            }`}
                          >
                            <div
                              className="w-8 h-8 rounded-full border-2 border-border-color mb-1"
                              style={{ backgroundColor: displayColor }}
                            />
                            <span className="text-xs text-text-secondary">{t(c.id)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><HeartIcon className="h-5 w-5 mr-2" />{t('hideWishlistOnOwned')}</h3>
                    <p className="text-sm text-text-secondary mb-4">{t('hideWishlistOnOwnedDesc')}</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.hideWishlistOnOwned || false}
                        onChange={(e) => updateSettings({ hideWishlistOnOwned: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-elevated peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><EyeIcon className="h-5 w-5 mr-2" />{t('grayscaleNonOwned')}</h3>
                    <p className="text-sm text-text-secondary mb-4">{t('grayscaleNonOwnedDesc')}</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.grayscaleNonOwned ?? true}
                        onChange={(e) => updateSettings({ grayscaleNonOwned: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-bg-elevated peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── Data Tab ────────────────────────────── */}
            {activeTab === 'data' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">{t('dataTab')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center"><ArrowDownTrayIcon className="h-5 w-5 mr-2" />{t('dataManagement')}</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">{t('exportCollection')}</p>
                        <p className="text-sm text-text-secondary mb-3">{t('exportDesc')}</p>
                        <div className="flex space-x-3">
                          <button onClick={() => handleExport('CSV')} className="bg-bg-card text-text-primary px-4 py-2 rounded-lg border border-border-color hover:bg-bg-elevated transition-colors">{t('exportCSV')}</button>
                          <button onClick={() => handleExport('Excel')} className="bg-bg-card text-text-primary px-4 py-2 rounded-lg border border-border-color hover:bg-bg-elevated transition-colors">{t('exportExcel')}</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6 border border-danger">
                    <h3 className="text-xl font-semibold mb-4 text-danger flex items-center"><TrashIcon className="h-5 w-5 mr-2" />{t('accountManagement')}</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium mb-2">{t('deleteAccountLabel')}</p>
                        <p className="text-sm text-text-secondary mb-3">{t('deleteAccountDesc')}</p>
                        <button onClick={handleDeleteAccount} className="bg-danger text-white px-4 py-2 rounded-lg hover:bg-red-600">{t('deleteAccountBtn')}</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
