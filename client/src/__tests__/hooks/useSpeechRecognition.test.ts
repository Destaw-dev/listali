import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

class MockSpeechRecognition {
  static instances: MockSpeechRecognition[] = [];

  lang = '';
  continuous = false;
  interimResults = false;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onresult: (() => void) | null = null;
  abort = vi.fn(() => this.onend?.());

  constructor() {
    MockSpeechRecognition.instances.push(this);
  }

  start() {
    this.onstart?.();
  }

  stop() {
    this.onend?.();
  }
}

describe('useSpeechRecognition', () => {
  afterEach(() => {
    MockSpeechRecognition.instances = [];
    delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  });

  it('stops active recognition when requested', () => {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      configurable: true,
      value: MockSpeechRecognition,
    });

    const { result } = renderHook(() => useSpeechRecognition({
      onResult: vi.fn(),
      onNotSupported: vi.fn(),
    }));

    act(() => result.current.start());
    expect(result.current.isListening).toBe(true);

    act(() => result.current.stop());
    expect(MockSpeechRecognition.instances[0].abort).toHaveBeenCalledOnce();
    expect(result.current.isListening).toBe(false);
  });
});
