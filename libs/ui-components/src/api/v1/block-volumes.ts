// @temp-api — replace with proto-generated once fulfillment-service adds v1/block_volumes
import { useMutation } from '@tanstack/react-query';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type BlockVolumeStorageClass = 'ssd' | 'nvme' | 'standard';

export interface BlockVolume {
  id: string;
  metadata?: {
    name: string;
    creationTimestamp?: string;
    creator?: string;
    description?: string;
  };
  spec: {
    sizeGib: number;
    storageClass: BlockVolumeStorageClass;
  };
  status: {
    state: 'PROVISIONING' | 'AVAILABLE' | 'ATTACHED' | 'DETACHING' | 'DELETING' | 'FAILED';
    attachedTo?: string; // compute instance id
    attachedToName?: string; // resolved name for display
  };
}

export interface BlockVolumesListResponse {
  items: BlockVolume[];
  total: number;
}

export const useBlockVolumes = () =>
  useApiQuery<BlockVolumesListResponse, BlockVolume[]>({
    queryKey: ['v1/block_volumes'],
    select: (data: BlockVolumesListResponse) => data.items,
  });

export const useBlockVolume = (id: string) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<BlockVolume>({
    queryKey: ['v1/block_volumes', [trimmedId]],
    enabled: Boolean(trimmedId),
  });
};

export const invalidateBlockVolumeQueries = async (qc: ReturnType<typeof useApiQueryClient>) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/block_volumes') });
};

export const useCreateBlockVolume = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      sizeGib: number;
      storageClass: BlockVolumeStorageClass;
      description?: string;
    }) =>
      apiFetch<BlockVolume>('v1/block_volumes', {
        method: 'POST',
        body,
      }),
    onSuccess: () => invalidateBlockVolumeQueries(qc),
    retry: false,
  });
};

export const usePatchBlockVolume = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { sizeGib?: number; description?: string };
    }) =>
      apiFetch<BlockVolume>('v1/block_volumes', {
        pathParams: [id],
        method: 'PATCH',
        body: patch,
      }),
    onSuccess: () => invalidateBlockVolumeQueries(qc),
    retry: false,
  });
};

// @temp-api — attach action predicted as POST v1/block_volumes/:id/attach
export const useAttachBlockVolume = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ volumeId, instanceId }: { volumeId: string; instanceId: string }) =>
      apiFetch<BlockVolume>('v1/block_volumes', {
        pathParams: [volumeId, 'attach'],
        method: 'POST',
        body: { instanceId },
      }),
    onSuccess: () => invalidateBlockVolumeQueries(qc),
    retry: false,
  });
};

// @temp-api — detach action predicted as POST v1/block_volumes/:id/detach
export const useDetachBlockVolume = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (volumeId: string) =>
      apiFetch<BlockVolume>('v1/block_volumes', {
        pathParams: [volumeId, 'detach'],
        method: 'POST',
      }),
    onSuccess: () => invalidateBlockVolumeQueries(qc),
    retry: false,
  });
};

export const useDeleteBlockVolume = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/block_volumes', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateBlockVolumeQueries(qc),
    retry: false,
  });
};
