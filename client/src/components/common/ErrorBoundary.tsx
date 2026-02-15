"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  private getTranslations() {
    try {
      const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en';
      return locale === 'he' ? {
        title: 'משהו השתבש',
        message: 'אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף או פנה לתמיכה.',
        refreshPage: 'רענן דף',
        tryAgain: 'נסה שוב',
        errorDetails: 'פרטי השגיאה (פיתוח)',
        error: 'שגיאה',
        stack: 'מחסנית',
        componentStack: 'מחסנית קומפוננט'
      } : {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try refreshing the page or contact support.',
        refreshPage: 'Refresh Page',
        tryAgain: 'Try Again',
        errorDetails: 'Error Details (Development)',
        error: 'Error',
        stack: 'Stack',
        componentStack: 'Component Stack'
      };
    } catch {
      return {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try refreshing the page or contact support.',
        refreshPage: 'Refresh Page',
        tryAgain: 'Try Again',
        errorDetails: 'Error Details (Development)',
        error: 'Error',
        stack: 'Stack',
        componentStack: 'Component Stack'
      };
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const t = this.getTranslations();
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4">
          <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-6 text-center">
            <div className="text-error text-6xl mb-4">🚨</div>
            <h1 className="text-xl font-bold text-text-primary mb-2">{t.title}</h1>
            <p className="text-text-muted mb-4">
              {t.message}
            </p>
            
            <div className="space-y-3">

              <Button variant='primary' fullWidth onClick={() => window.location.reload()}>{t.refreshPage}</Button>
              <Button variant='ghost' fullWidth onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}>{t.tryAgain}</Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-text-muted hover:text-text-secondary">
                  {t.errorDetails}
                </summary>
                <div className="mt-2 p-3 bg-surface rounded text-xs font-mono text-text-secondary overflow-auto border border-border-light">
                  <div><strong>{t.error}:</strong> {this.state.error.message}</div>
                  <div><strong>{t.stack}:</strong> {this.state.error.stack}</div>
                  {this.state.errorInfo && (
                    <div><strong>{t.componentStack}:</strong> {this.state.errorInfo.componentStack}</div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
