'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  0: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance;
}

type WindowWithSpeech = Window & {
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult: (transcript: string) => void;
  onNotSupported: () => void;
}

export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition({
  lang = 'he-IL',
  onResult,
  onNotSupported,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);

  const onResultRef = useRef(onResult);
  const onNotSupportedRef = useRef(onNotSupported);
  onResultRef.current = onResult;
  onNotSupportedRef.current = onNotSupported;

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const SpeechRecognition = (window as WindowWithSpeech).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      onNotSupportedRef.current();
      return;
    }

    stop();

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      if (mountedRef.current) setIsListening(true);
    };
    recognition.onend = () => {
      if (mountedRef.current) setIsListening(false);
    };
    recognition.onerror = () => {
      if (mountedRef.current) setIsListening(false);
    };
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      if (mountedRef.current) onResultRef.current(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [lang, stop]);

  return { isListening, start, stop };
}
