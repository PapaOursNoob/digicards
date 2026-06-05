import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../i18n';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showReset, setShowReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate('/');
    } catch (err) {
      if (err.message === 'User already registered') {
        setError(t('emailInUse'));
      } else if (err.message.includes('Invalid login credentials')) {
        setError(t('wrongCredentials'));
      } else {
        setError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      await resetPassword(email);
      setSuccess(t('resetPasswordSent'));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-16 md:pb-0 md:ml-20 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <img src="/digicards-logo.png" alt="Digicards" className="h-20 mx-auto mb-6" />

        {showReset ? (
          <>
            <h1 className="text-3xl font-bold text-text-primary text-center mb-2">
              {t('resetPassword')}
            </h1>
            <p className="text-text-secondary text-center mb-8">
              {t('checkEmail')}
            </p>

            <form onSubmit={handleResetPassword} className="glass rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-bg-card border border-border-color rounded-lg text-text-primary focus:ring-accent-primary focus:border-accent-primary"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
              {success && <p className="text-success text-sm">{success}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent-primary text-bg-primary py-3 rounded-lg font-semibold hover:bg-accent-secondary transition-colors disabled:opacity-50"
              >
                {submitting ? t('pleaseWait') : t('resetPassword')}
              </button>

              <p className="text-center text-sm text-text-secondary">
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setError(''); setSuccess(''); }}
                  className="text-accent-primary hover:underline"
                >
                  {t('backToLogin')}
                </button>
              </p>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-text-primary text-center mb-2">
              {isLogin ? t('welcomeBack') : t('createAccount')}
            </h1>
            <p className="text-text-secondary text-center mb-8">
              {isLogin ? t('signInSubtitle') : t('signUpSubtitle')}
            </p>

            <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-bg-card border border-border-color rounded-lg text-text-primary focus:ring-accent-primary focus:border-accent-primary"
                  placeholder={t('emailPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('password')}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-bg-card border border-border-color rounded-lg text-text-primary focus:ring-accent-primary focus:border-accent-primary"
                  placeholder={t('passwordPlaceholder')}
                />
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-sm text-accent-primary hover:underline mt-1"
                  >
                    {t('forgotPassword')}
                  </button>
                )}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent-primary text-bg-primary py-3 rounded-lg font-semibold hover:bg-accent-secondary transition-colors disabled:opacity-50"
              >
                {submitting ? t('pleaseWait') : isLogin ? t('signIn') : t('createAccount')}
              </button>

              <p className="text-center text-sm text-text-secondary">
                {isLogin ? t('noAccount') : t('hasAccount')}
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="ml-1 text-accent-primary hover:underline"
                >
                  {isLogin ? t('signUp') : t('signIn')}
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
