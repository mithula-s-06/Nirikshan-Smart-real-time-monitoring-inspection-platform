import { useSyncStore } from '../store/syncStore';
import { useInspectionStore } from '../store/inspectionStore';
import {
  ISyncPushRequest,
  ISyncPushResponse,
  ISyncPullResponse,
} from '@nirikshan/shared-types';

export class OfflineSyncService {
  /**
   * Pulls latest server assignments and checklist templates to local device
   */
  public static async pullLatestData(
    fetchFn: (url: string, init?: RequestInit) => Promise<Response>,
    baseUrl: string = '/api/v1',
  ): Promise<ISyncPullResponse | null> {
    const { lastSyncedAt, setLastSyncedAt, setSyncStatus } = useSyncStore.getState();

    try {
      setSyncStatus('SYNCING');
      let url = `${baseUrl}/sync/pull`;
      if (lastSyncedAt) {
        url += `?lastSyncTimestamp=${encodeURIComponent(lastSyncedAt.toISOString())}`;
      }

      const res = await fetchFn(url);
      const data: any = await res.json();

      if (data.success && data.data) {
        const syncPkg: ISyncPullResponse = data.data;

        // Populate local inspection list if updated
        if (syncPkg.assignedInspections?.length > 0) {
          const { setInspections } = useInspectionStore.getState();
          setInspections(syncPkg.assignedInspections);
        }

        setLastSyncedAt(new Date(syncPkg.serverTimestamp));
        setSyncStatus('IDLE');
        return syncPkg;
      }
    } catch (err) {
      console.error('OfflineSyncService pull error:', err);
      setSyncStatus('ERROR');
    }
    return null;
  }

  /**
   * Pushes all offline queued actions to the backend in a single transactional batch
   */
  public static async flushOfflineQueue(
    inspectorId: string,
    fetchFn: (url: string, init?: RequestInit) => Promise<Response>,
    baseUrl: string = '/api/v1',
  ): Promise<ISyncPushResponse | null> {
    const { offlineQueue, removeAction, setSyncStatus, isOnline } = useSyncStore.getState();

    if (!isOnline || offlineQueue.length === 0) {
      return null;
    }

    setSyncStatus('SYNCING');
    const syncBatchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const payload: ISyncPushRequest = {
      inspectorId,
      syncBatchId,
      actions: offlineQueue,
    };

    try {
      const res = await fetchFn(`${baseUrl}/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data: any = await res.json();

      if (data.success && data.data) {
        const result: ISyncPushResponse = data.data;

        // Process individual action results
        for (const item of result.results) {
          if (item.success || (item.conflict && item.conflict.resolved)) {
            removeAction(item.actionId);
          }
        }

        setSyncStatus('IDLE');
        return result;
      } else {
        setSyncStatus('ERROR');
      }
    } catch (err) {
      console.error('OfflineSyncService push error:', err);
      setSyncStatus('ERROR');
    }

    return null;
  }
}
