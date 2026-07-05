// @temp-api — replace with proto-generated once fulfillment-service adds v1/volume_snapshots
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export interface VolumeSnapshot {
  id: string;
  metadata?: {
    name: string;
    creationTimestamp?: string;
    creator?: string;
  };
  spec: {
    sourceInstanceId: string;
    diskIndex: number;
    description?: string;
  };
  status: {
    state: 'PENDING' | 'READY' | 'FAILED' | 'DELETING';
    sizeGib?: number;
  };
}

export interface VolumeSnapshotsListResponse {
  items: VolumeSnapshot[];
  total: number;
}

export const useVolumeSnapshots = (instanceId: string) =>
  useApiQuery<VolumeSnapshotsListResponse, VolumeSnapshot[]>({
    queryKey: ['v1/volume_snapshots', null, { instanceId }],
    select: (data: VolumeSnapshotsListResponse) => data.items,
    enabled: Boolean(instanceId),
  });

export const useAllVolumeSnapshots = () =>
  useApiQuery<VolumeSnapshotsListResponse, VolumeSnapshot[]>({
    queryKey: ['v1/volume_snapshots'],
    select: (data: VolumeSnapshotsListResponse) => data.items,
  });

export const invalidateVolumeSnapshotQueries = async (
  qc: ReturnType<typeof useApiQueryClient>,
  instanceId?: string,
) => {
  await qc.invalidateQueries({
    queryKey: apiQueryKey('v1/volume_snapshots', null, instanceId ? { instanceId } : undefined),
  });
};

export const useCreateVolumeSnapshot = (instanceId: string) => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; diskIndex: number; description?: string }) =>
      apiFetch<VolumeSnapshot>('v1/volume_snapshots', {
        method: 'POST',
        body: { ...body, sourceInstanceId: instanceId },
      }),
    onSuccess: () => invalidateVolumeSnapshotQueries(qc, instanceId),
    retry: false,
  });
};

export const useDeleteVolumeSnapshot = (instanceId: string) => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (snapshotId: string) =>
      apiFetch<void>('v1/volume_snapshots', {
        pathParams: [snapshotId],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateVolumeSnapshotQueries(qc, instanceId),
    retry: false,
  });
};

// @temp-api — restore action predicted as POST v1/volume_snapshots/:id/restore
export const useRestoreVolumeSnapshot = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({
      snapshotId,
      targetInstanceId,
    }: {
      snapshotId: string;
      targetInstanceId: string;
    }) =>
      apiFetch<void>('v1/volume_snapshots', {
        pathParams: [snapshotId, 'restore'],
        method: 'POST',
        body: { targetInstanceId },
      }),
    onSuccess: () => invalidateVolumeSnapshotQueries(qc),
    retry: false,
  });
};
