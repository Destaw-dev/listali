// components/common/ErrorBoundary.tsx
"use client";
import React, { Component, ErrorInfo, ReactNode } from 'react';

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

  // Helper function to get translations
  private getTranslations() {
    try {
      // This is a workaround since we can't use useTranslations in a class component
      // We'll use the locale from the URL or default to English
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
      // Fallback to English
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">🚨</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600 mb-4">
              {t.message}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t.refreshPage}
              </button>
              
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                {t.tryAgain}
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  {t.errorDetails}
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto">
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
