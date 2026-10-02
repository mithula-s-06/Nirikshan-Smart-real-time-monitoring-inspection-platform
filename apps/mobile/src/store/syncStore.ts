import { create } from 'zustand';
import { ISyncActionItem, SyncActionType } from '@nirikshan/shared-types';

export interface SyncStoreState {
  offlineQueue: ISyncActionItem[];
  isOnline: boolean;
  syncStatus: 'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE';
  lastSyncedAt: Date | null;
  pendingChangesCount: number;

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  enqueueAction: (
    action: Omit<ISyncActionItem, 'id' | 'idempotencyKey' | 'clientTimestamp'>,
  ) => ISyncActionItem;
  removeAction: (actionId: string) => void;
  clearQueue: () => void;
  setSyncStatus: (status: 'IDLE' | 'SYNCING' | 'ERROR' | 'OFFLINE') => void;
  setLastSyncedAt: (date: Date) => void;
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  offlineQueue: [],
  isOnline: true,
  syncStatus: 'IDLE',
  lastSyncedAt: null,
  pendingChangesCount: 0,

  setOnlineStatus: (isOnline) =>
    set({
      isOnline,
      syncStatus: isOnline ? (get().offlineQueue.length > 0 ? 'IDLE' : 'IDLE') : 'OFFLINE',
    }),

  enqueueAction: (action) => {
    const timestamp = new Date();
    const actionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const newItem: ISyncActionItem = {
      ...action,
      id: actionId,
      idempotencyKey,
      clientTimestamp: timestamp,
      retryCount: 0,
    };

    set((state) => ({
      offlineQueue: [...state.offlineQueue, newItem],
      pendingChangesCount: state.offlineQueue.length + 1,
    }));

    return newItem;
  },

  removeAction: (actionId) =>
    set((state) => {
      const updatedQueue = state.offlineQueue.filter((item) => item.id !== actionId);
      return {
        offlineQueue: updatedQueue,
        pendingChangesCount: updatedQueue.length,
      };
    }),

  clearQueue: () =>
    set({
      offlineQueue: [],
      pendingChangesCount: 0,
    }),

  setSyncStatus: (syncStatus) => set({ syncStatus }),

  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
}));
