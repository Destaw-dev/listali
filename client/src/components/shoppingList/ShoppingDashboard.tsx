"use client";
import { useTranslations } from 'next-intl';

interface ShoppingDashboardProps {
  listName: string;
  totalItems: number;
  purchasedItems: number;
  shoppingSession?: any;
}

interface ActiveSession {
  _id: string;
  status: string;
  userId: {
    firstName: string;
    lastName: string;
    username: string;
  };
  startedAt: string;
  location: any;
}
export function ShoppingDashboard({ 
  listName, 
  totalItems, 
  purchasedItems, 
  shoppingSession 
}: ShoppingDashboardProps) {
  const t = useTranslations('ShoppingDashboard');
  const activeSessions = shoppingSession?.activeSessions || [];

  const remainingItems = totalItems - purchasedItems;
  const progressPercentage = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;


  return (
    <div className="rounded-lg p-6 shadow-custom-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-secondary mb-2">{t('dashboardTitle')} - {listName}</h2>
        <p className="text-sm text-text-muted">{t('dashboardSubtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-primary-600">{totalItems}</div>
          <div className="text-sm text-primary-700">{t('totalItems')}</div>
        </div>
        
        <div className="bg-success-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{purchasedItems}</div>
          <div className="text-sm text-success-700">{t('purchased')}</div>
        </div>
        
        <div className="bg-warning-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-warning-600">{remainingItems}</div>
          <div className="text-sm text-warning-700">{t('remaining')}</div>
        </div>
      </div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-secondary">{t('progress')}</span>
          <span className="text-sm font-medium text-text-secondary">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2.5">
          <div 
            className="bg-primaryT-700 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-text-secondary mb-3">{t('activeShoppers')}</h3>
        {!activeSessions || activeSessions.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p>{t('noActiveShoppers')}</p>
            <p className="text-sm">{t('startShoppingToSeeActivity')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session: ActiveSession, index: number) => (
              <div 
                key={session._id || `session-${index}-${session.userId?.username || 'unknown'}`}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  session.status === 'active' ? 'bg-success-50' : 'bg-warning-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    session.status === 'active' ? 'bg-success-500' : 'bg-warning-500'
                  }`}></div>
                  
                  <div>
                    <div className="font-medium text-text-secondary">
                      {session?.userId?.firstName && session?.userId?.lastName 
                        ? `${session?.userId?.firstName} ${session?.userId?.lastName}`
                        : session?.userId?.username
                      }
                    </div>
                    <div className="text-sm text-text-muted">
                      {session.status === 'active' ? t('shopping') : t('shoppingStopped')}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-text-muted">
                    {t('startedAt')}: <span suppressHydrationWarning>{new Date(session.startedAt).toLocaleTimeString('he-IL')}</span>
                  </div>
                  {session.location && (
                    <div className="text-xs text-text-muted">
                      📍 {t('locationAvailable')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-6 text-center">
        <p className="text-xs text-text-muted">
          {t('lastUpdated')}: <span suppressHydrationWarning>{new Date().toLocaleTimeString('he-IL')}</span>
        </p>
      </div>
    </div>
  );
}
