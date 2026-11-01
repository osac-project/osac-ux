import { type Volume, VolumeState, Volumes } from '@osac/types/private';

import { useApiFetch } from '../../api-context';
import { cel } from '../../cel';
import { type ListParams, apiQueryKey } from '../../types';
import { useApiQuery } from '../../use-api-query';

export const VOLUME_AVAILABLE_LIST_FILTER = cel<Volume>((filter) =>
  filter.field('status.state').equals(VolumeState.AVAILABLE),
);

type VolumesListOptions = {
  enabled?: boolean;
};

export const usePrivateVolumes = (
  params: ListParams = {},
  options: VolumesListOptions = {},
) => {
  const client = useApiFetch(Volumes);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/volumes', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const usePrivateVolume = (id: string) => {
  const client = useApiFetch(Volumes);
  return useApiQuery({
    queryKey: apiQueryKey('v1/private/volumes', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};
