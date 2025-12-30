import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 300 },
      }
    );

    expect(result.current).toBe('initial');

    // Change value
    act(() => {
      rerender({ value: 'updated', delay: 300 });
    });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 299ms (just before delay)
    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Fast-forward time by 1ms more (total 300ms)
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 300 },
      }
    );

    // Rapid changes
    act(() => {
      rerender({ value: 'second', delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    act(() => {
      rerender({ value: 'third', delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    
    act(() => {
      rerender({ value: 'fourth', delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // Should still be initial value
    expect(result.current).toBe('first');

    // After full delay, should be last value
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('fourth');
  });

  it('should handle number values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 0, delay: 300 },
      }
    );

    expect(result.current).toBe(0);

    act(() => {
      rerender({ value: 100, delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe(100);
  });

  it('should handle object values', () => {
    const initialObj = { name: 'test' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: initialObj, delay: 300 },
      }
    );

    expect(result.current).toBe(initialObj);

    act(() => {
      rerender({ value: updatedObj, delay: 300 });
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current).toBe(updatedObj);
  });

  it('should handle different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 500 },
      }
    );

    act(() => {
      rerender({ value: 'updated', delay: 500 });
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('test');

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });
});

