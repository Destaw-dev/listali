/**
 * Migration helpers for guest lists
 */

import { apiClient } from './api';
import { useGuestListsStore } from '../store/guestListsStore';

// Flag to prevent duplicate migration calls
let isMigrating = false;

/**
 * Migrate guest lists to server after successful login
 * Returns true if migration was successful, false if no lists to migrate or error
 */
export async function migrateGuestLists(): Promise<boolean> {
  // Prevent duplicate calls
  if (isMigrating) {
    console.log('Migration already in progress, skipping duplicate call');
    return false;
  }

  const guestLists = useGuestListsStore.getState().lists;
  
  if (!guestLists || guestLists.length === 0) {
    return false; // No lists to migrate
  }

  isMigrating = true;
  try {
    console.log('guestLists', guestLists);
    const response = await apiClient.migrateGuestLists(guestLists);
    console.log('response', response);
    if (response?.success && response?.data) {
      // Clear guest lists after successful migration
      useGuestListsStore.getState().clearAllLists();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to migrate guest lists:', error);
    // Don't throw - migration failure shouldn't block login
    // Guest lists remain in localStorage
    return false;
  } finally {
    isMigrating = false;
  }
}
