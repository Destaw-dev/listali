'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Plus, Settings, ShoppingCart, MessageCircle, BarChart3, MoreVertical, ChartArea, UserPlus } from 'lucide-react';
import { GroupShoppingLists } from '@/components/groups/GroupShoppingLists';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useGroup, useInviteToGroup, useGroupMemberRoleWebSocket } from '@/hooks/useGroups';
import { useCreateShoppingList, useGroupShoppingLists } from '@/hooks/useShoppingLists';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useAuthStore } from '@/store/authStore';
import { InviteModal } from '@/components/groups/InviteModal';
import { ChatComponent } from '@/components/chat/ChatComponent';
import { Button } from '@/components/common/Button';
import { ArrowIcon } from '@/components/common/Arrow';
import CreateShoppingListModal from '@/components/shoppingList/CreateShoppingListModal';
import { IShoppingList, IGroupMember, ICreateListFormData, getCreatedByDisplayName } from '@/types';

type TabType = 'overview' | 'lists' | 'chat' | 'stats';

export default function GroupDetailsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const t = useTranslations('GroupDetails');
  const locale = params?.locale as string || 'he';
  const groupId = params?.groupId as string;
  const { user } = useAuthStore();

  const { isInitialized } = useAuthRedirect({
    redirectTo: `/${locale}/welcome`,
    requireAuth: true
  });

  const { data: group, isLoading, error } = useGroup(groupId);
  const { data: shoppingLists } = useGroupShoppingLists(groupId);
  const createListMutation = useCreateShoppingList();
  const inviteToGroupMutation = useInviteToGroup();
  
  useGroupMemberRoleWebSocket(groupId);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['overview', 'lists', 'chat', 'stats'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);
  
  const handleCreateList = async (listData: ICreateListFormData) => {
    await createListMutation.mutateAsync({ groupId, listData });
    setShowCreateListModal(false);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tab);
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
  };

  const handleInviteToGroup = async ({ email, role }: { email: string; role: 'member' | 'admin' }) => {
    await inviteToGroupMutation.mutateAsync({ groupId, inviteData: { email, role } });
    setShowInviteModal(false);
  };

  const navigateBack = () => {
    router.push(`/${locale}/groups`);
  };

  const navigateToSettings = () => {
    router.push(`/${locale}/groups/${groupId}/settings`);
  };

  useEffect(() => {
    if (error && (error as { response?: { status?: number } })?.response?.status === 403) {
      router.push(`/${locale}/groups`);
    }
  }, [error, locale, router]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !group) {
    const is403Error = error && (error as { response?: { status?: number } })?.response?.status === 403;
    
    if (is403Error) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-secondary mt-4">{t('redirectingToGroups')}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('errorLoadingGroup')}</p>
          <Button 
            onClick={navigateBack}
            variant="primary"
            size="lg"
            fullWidth
          >
            {t('backToGroups')}
          </Button>
        </div>
      </div>
    );
  }

  const hasAdminPermissions = group?.members?.find(
    (member: IGroupMember) => {
      const memberUserId = typeof member.user === 'object' ? member.user.id : member.userId;
      return memberUserId === user?._id && (member.role === 'admin' || member.role === 'owner');
    }
  );

  const tabs = [
    {
      id: 'overview' as TabType,
      label: t('overview'),
      icon: ChartArea,
      count: null
    },
    {
      id: 'lists' as TabType,
      label: t('lists'),
      icon: ShoppingCart,
      count: shoppingLists?.length || 0
    },
    {
      id: 'chat' as TabType,
      label: t('chat'),
      icon: MessageCircle,
      count: group?.unreadMessages || 0
    },
    {
      id: 'stats' as TabType,
      label: t('stats'),
      icon: BarChart3,
      count: null
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
                <h3 className="font-semibold text-text-primary">{t('activeLists')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab('lists')}>{t('manageLists')}</Button>
              </div>
              
              <div className="divide-y divide-border">
                {
                  group.shoppingLists?.map((list: IShoppingList) => (
                    <div key={list._id} className="p-4 hover:bg-surface transition-colors flex items-center justify-between group cursor-pointer" onClick={() => router.push(`/${locale}/groups/${groupId}/${list._id}`)}>
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primaryT-100 flex items-center justify-center text-primaryT-600">
                        <ShoppingCart className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{list.name}</p>
                        <p className="text-xs text-text-muted">{`נוצר ע״י ${getCreatedByDisplayName(list.createdBy)} •  ${t('items')} ${list.items?.length || 0}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-xs font-medium bg-success-100 text-success-700 px-2 py-1 rounded-full">{list.status === 'active' ? t('active') : list.status === 'completed' ? t('completed') : t('archived')}</span>
                       <MoreVertical className="h-4 w-4 text-text-muted" />
                    </div>
                 </div>
                  ))
                }
                
                <div className="p-8 text-center">
                  <Button variant="dashed" size="lg" fullWidth onClick={() => setShowCreateListModal(true)} icon={<Plus className="h-4 w-4" />}>
                    {t('createNewList')}
                  </Button>
                </div>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className="bg-surface rounded-xl shadow-sm border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold">{t('groupMembers')} ({group.members?.length || 0})</h3>
                <Button variant='ghost' size='sm' onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-2 space-y-2">
                {group.members?.map((member: IGroupMember) => (
                  <MemberItem key={member.user.id} name={member.user.firstName + ' ' + member.user.lastName} role={member.role} email={member.user.email} initial={member.user.firstName[0]} color={member.role === 'owner' ? 'bg-blue-600' : 'bg-purple-600'} />
                ))}
              </div>
              <div className="px-4 py-3 text-center">
                <Button variant='dashed' size='lg' onClick={() => setShowInviteModal(true)}>{t('inviteFriends')}</Button>
              </div>
            </div>

          </div>
        </div>
            
          </div>
        );

      case 'lists':
        return (
          <GroupShoppingLists />
        );

      case 'chat':
        return (
          <div className="h-[calc(100vh-200px)]">
            <ChatComponent
              groupId={groupId}
              groupName={group?.name || ''}
            />
          </div>
        );

      case 'stats':
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-text-secondary mb-4">{t('groupStats')}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primaryT-700">{group.membersCount || 0}</div>
                  <div className="text-sm text-gray-500">{t('members')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{group?.shoppingLists.length || 0}</div>
                  <div className="text-sm text-gray-500">{t('lists')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">0</div>
                  <div className="text-sm text-gray-500">{t('messagesToday')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-500">{t('purchasedItemsStats')}</div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <Button variant='ghost' size='sm' onClick={navigateBack}>
                <ArrowIcon/>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg md:text-2xl font-bold text-primary truncate">{group.name}</h1>
                <p className="text-secondary text-xs md:text-sm truncate">{group.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {hasAdminPermissions && (
                <Button variant='ghost' size='md' onClick={navigateToSettings} icon={<Settings className="w-5 h-5" />}>
                  {t('groupSettings')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="shadow-sm">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 py-4 px-2 border-b-2 transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="md:hidden flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center gap-1 py-3 px-3 border-b-2 transition-all duration-200 min-w-[80px] ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="relative">
                  <tab.icon className="w-5 h-5" />
                  {tab.count !== null && tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] text-center">
                      {tab.count}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {renderTabContent()}
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteToGroup}
        groupName={group?.name || ''}
      />
      {showCreateListModal && (
        <CreateShoppingListModal
          isOpen={showCreateListModal}
          onClose={() => setShowCreateListModal(false)}
          onSubmit={handleCreateList}
          groupId={groupId}
          groupName={group?.name}
        />
      )}
    </div>
  );
} 


const MemberItem = ({ name, role, email, initial, color }: { name: string, role: 'owner' | 'admin' | 'member', email: string, initial: string, color: string }) => (
  <div className="flex items-center justify-between p-3 bg-surface rounded-lg transition-colors group">
    <div className="flex items-center gap-3">
      <div className={`h-9 w-9 rounded-full ${color}  flex items-center justify-center text-sm font-bold shadow-sm`}>
        {initial}
      </div>
      <div>
        <p className="text-sm font-medium ">{name}</p>
        <p className="text-xs text-secondary">{email}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${role === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
        {role === 'owner' ? 'בעלים' : role === 'admin' ? 'מנהל' : 'חבר'}
      </span>
    </div>
  </div>
);
