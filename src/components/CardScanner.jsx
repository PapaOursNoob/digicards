import React, { useRef, useState, useEffect } from 'react';
import { XMarkIcon, CameraIcon, PhotoIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useCardScanner } from '../hooks/useCardScanner';
import { t } from '../i18n';

export default function CardScanner({ isOpen, onClose, ownedCards, onCardsConfirmed }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  const {
    status,
    processedCount,
    totalCount,
    scannedCards,
    error,
    startScan,
    reset,
    toggleCard,
    removeCard,
  } = useCardScanner(ownedCards);

  useEffect(() => {
    if (status === 'idle' && isOpen) {
      setCameraActive(false);
    }
  }, [status, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCameraActive(false);
      reset();
    }
  }, [isOpen, reset]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
        startScan([file]);
      }
    }, 'image/jpeg', 0.9);
    stopCamera();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      startScan(files);
    }
    if (e.target) e.target.value = '';
  };

  const handleConfirm = () => {
    const selected = scannedCards.filter(c => !c.owned);
    if (selected.length > 0) {
      onCardsConfirmed(selected);
    }
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const newCards = scannedCards.filter(c => !c.owned);
  const alreadyOwned = scannedCards.filter(c => c.owned);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full max-w-lg h-full max-h-full flex flex-col bg-bg-card">

        {status === 'idle' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
            <CameraIcon className="h-16 w-16 text-text-secondary" />
            <h2 className="text-2xl font-bold text-text-primary text-center">{t('scanCards')}</h2>
            <p className="text-text-secondary text-center">{t('scanInstructions')}</p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={() => { startCamera(); }}
                className="flex items-center justify-center gap-3 bg-accent-primary text-bg-primary py-3 rounded-lg font-semibold hover:bg-accent-secondary transition-colors"
              >
                <CameraIcon className="h-5 w-5" />
                {t('takePhoto')}
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-3 bg-bg-elevated text-text-primary py-3 rounded-lg font-semibold border border-border-color hover:bg-bg-card transition-colors"
              >
                <PhotoIcon className="h-5 w-5" />
                {t('chooseFromGallery')}
              </button>
            </div>

            <button onClick={onClose} className="mt-4 text-text-secondary hover:text-text-primary transition-colors">
              <XMarkIcon className="h-8 w-8" />
            </button>
          </div>
        )}

        {status === 'idle' && cameraActive && (
          <div className="fixed inset-0 bg-black flex flex-col z-50">
            <video ref={videoRef} className="flex-1 object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="p-4 flex justify-center gap-4">
              <button onClick={stopCamera} className="px-6 py-3 bg-bg-elevated rounded-full text-text-primary font-semibold">
                {t('cancel')}
              </button>
              <button onClick={capturePhoto} className="px-6 py-3 bg-accent-primary rounded-full text-bg-primary font-semibold">
                {t('takePhoto')}
              </button>
            </div>
          </div>
        )}

        {status === 'processing' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-primary border-t-transparent" />
            <h2 className="text-xl font-semibold text-text-primary">{t('processing')}</h2>
            <p className="text-text-secondary">{processedCount} / {totalCount}</p>
            <div className="w-full bg-bg-elevated rounded-full h-2 mt-2">
              <div
                className="bg-accent-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${totalCount > 0 ? (processedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
            <p className="text-red-500 text-center">{error || t('scanError')}</p>
            <button onClick={() => { reset(); onClose(); }} className="text-accent-primary hover:underline">
              {t('backToLogin')}
            </button>
          </div>
        )}

        {status === 'results' && (
          <>
            <div className="p-4 border-b border-border-color flex items-center justify-between">
              <h2 className="text-lg font-bold text-text-primary">
                {scannedCards.length} {t('cardsFound')}
              </h2>
              <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {scannedCards.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <p className="text-text-secondary text-center">{t('noCardFound')}</p>
                <button
                  onClick={() => reset()}
                  className="text-accent-primary hover:underline"
                >
                  {t('scanAgain')}
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {scannedCards.map(card => (
                  <div
                    key={card.card_number}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      card.owned
                        ? 'bg-bg-elevated border-border-color opacity-60'
                        : 'bg-bg-card border-accent-primary'
                    }`}
                  >
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-12 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-16 bg-bg-elevated rounded flex items-center justify-center text-[8px] text-text-secondary">
                        {card.card_number}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary truncate">{card.name}</p>
                      <p className="text-sm text-text-secondary">{card.card_number} — {card.set_name}</p>
                      {card.owned ? (
                        <span className="text-xs text-success font-medium">{t('alreadyOwned')}</span>
                      ) : (
                        <span className="text-xs text-accent-primary font-medium">{t('newCard')}</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeCard(card.card_number)}
                      className="text-text-secondary hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 border-t border-border-color flex gap-3">
              <button
                onClick={() => { reset(); }}
                className="flex-1 py-3 rounded-lg bg-bg-elevated text-text-primary font-semibold border border-border-color hover:bg-bg-card transition-colors"
              >
                {t('scanAgain')}
              </button>
              <button
                onClick={handleConfirm}
                disabled={newCards.length === 0}
                className="flex-1 py-3 rounded-lg bg-accent-primary text-bg-primary font-semibold hover:bg-accent-secondary transition-colors disabled:opacity-50"
              >
                {t('addSelected')} ({newCards.length})
              </button>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}
