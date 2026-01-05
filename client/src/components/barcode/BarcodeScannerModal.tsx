'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { useTranslations } from 'next-intl';
import { Button } from '../common/Button';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';

type ScannerState = 'idle' | 'requesting' | 'scanning' | 'detected' | 'error';

export type BarcodeScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => Promise<void> | void;
  formats?: BarcodeFormat[];
  title?: string;
  debug?: boolean;
};

export function BarcodeScannerModal({
  open,
  onClose,
  onDetected,
  formats,
  title = 'סריקת מוצר ל-Listali',
  debug = false,
}: BarcodeScannerModalProps) {
  const t = useTranslations('BarcodeScannerModal');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const isLockedRef = useRef(false);

  const [state, setState] = useState<ScannerState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastCode, setLastCode] = useState<string>('');

  const possibleFormats = useMemo(
    () =>
      formats ?? [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.CODE_128,
      ],
    [formats]
  );

  const stopScanner = useCallback(async () => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState('idle');
    isLockedRef.current = false;
  }, []);

  const startScanner = useCallback(async () => {
    if (!videoRef.current) return;
    
    setErrorMsg(null);
    setState('requesting');
    isLockedRef.current = false;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, possibleFormats);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 150,
    });
    readerRef.current = reader;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const controls = await reader.decodeFromConstraints(
        constraints,
        videoRef.current,
        async (result, err) => {
          if (err || !result) return;

          if (isLockedRef.current) return;
          isLockedRef.current = true;

          const text = result.getText().trim();
          if (!text) {
            isLockedRef.current = false;
            return;
          }

          setLastCode(text);
          setState('detected');

          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
          }

          controls.stop();
          
          try {
            await onDetected(text);
            onClose();
          } catch (e) {
            console.error("Error in onDetected:", e);
            isLockedRef.current = false;
            setState('scanning');
          }
        }
      );

      controlsRef.current = controls;
      setState('scanning');
    } catch (e: any) {
      console.error("Scanner start error:", e);
      setState('error');
      setErrorMsg(
        e.name === 'NotAllowedError' 
          ? t('notAllowedError') 
          : t('errorAccessingCamera')
      );
    }
  }, [possibleFormats, onDetected, onClose]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(startScanner, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [open, startScanner, stopScanner]);

  useModalScrollLock(open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-surface shadow-2xl transition-all">
        
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-full bg-surface-hover p-2 text-text-primary hover:bg-surface-hover"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative aspect-[3/4] w-full bg-surface sm:aspect-video">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            playsInline
            muted
          />

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div className="relative h-40 w-72 rounded-xl border-2 border-surface-hover shadow-sm">
               <div className="absolute -left-1 -top-1 h-6 w-6 border-l-4 border-t-4 border-primary" />
               <div className="absolute -right-1 -top-1 h-6 w-6 border-r-4 border-t-4 border-primary" />
               <div className="absolute -left-1 -bottom-1 h-6 w-6 border-l-4 border-b-4 border-primary" />
               <div className="absolute -right-1 -bottom-1 h-6 w-6 border-r-4 border-b-4 border-primary" />
               
               {state === 'scanning' && (
                 <div className="absolute left-0 top-0 h-1 w-full animate-scan-line bg-primary/80 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
               )}
            </div>
            <p className="mt-6 text-sm font-medium text-text-primary shadow-sm drop-shadow-md">
              {t('pointToCenterOfBarcode')}
            </p>
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-surface-hover px-4 py-1.5 text-xs font-bold text-text-primary backdrop-blur-md">
            {state === 'requesting' && t('connectingToCamera')}
            {state === 'scanning' && t('scanningBarcode')}
            {state === 'detected' && t('detectedBarcode')}
          </div>
        </div>

        <div className="p-4">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-error-50 p-3 text-sm text-error border border-error-100">
              {errorMsg}
            </div>
          )}

          {debug && (
            <pre className="mb-4 overflow-auto rounded-lg bg-surface-hover p-2 text-[10px] text-success">
              {JSON.stringify({ state, lastCode, isLocked: isLockedRef.current }, null, 2)}
            </pre>
          )}

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              size="md"
              rounded={true}
              shadow={true}
              glow={true}
              fullWidth={true}
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={() => { stopScanner().then(startScanner); }}
              variant="primary"
              size="md"
              rounded={true}
              shadow={true}
              glow={true}
              fullWidth={true}
            >
              {t('retryScan')}
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2.5s infinite linear;
        }
      `}</style>
    </div>
  );
}