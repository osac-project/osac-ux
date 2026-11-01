import type {
  AddOnOperator,
  BareMetalInstanceType,
  ClusterVersion,
  DiskImage,
  HostType,
  InstanceType,
} from '@osac/types';
import { BareMetalInstanceTypes } from '@osac/types';
import { useListResource } from '@osac/ui-components/api/use-resource';
import { useAddOnOperators } from '@osac/ui-components/api/v1/add-on-operators';
import { useClusterVersions } from '@osac/ui-components/api/v1/cluster-versions';
import { useDiskImages } from '@osac/ui-components/api/v1/disk-image';
import { useHostTypes } from '@osac/ui-components/api/v1/host-types';
import { useInstanceTypes } from '@osac/ui-components/api/v1/instance-types';

export interface CatalogItemResourceLookups {
  addOnOperators: AddOnOperator[];
  diskImages: DiskImage[];
  computeInstanceTypes: InstanceType[];
  bareMetalInstanceTypes: BareMetalInstanceType[];
  clusterVersions: ClusterVersion[];
  hostTypes: HostType[];
}

type UseCatalogItemResourceLookupsOptions = {
  enabled?: boolean;
};

export const useCatalogItemResourceLookups = (
  options: UseCatalogItemResourceLookupsOptions = {},
): CatalogItemResourceLookups => {
  const enabled = options.enabled ?? true;
  const { data: addOnOperators = [] } = useAddOnOperators({}, { enabled });
  const { data: diskImages = [] } = useDiskImages({}, { enabled });
  const { data: computeInstanceTypes = [] } = useInstanceTypes({}, { enabled });
  const { data: bareMetalInstanceTypesData } = useListResource(
    BareMetalInstanceTypes,
    {},
    { enabled },
  );
  const { data: clusterVersions = [] } = useClusterVersions({}, { enabled });
  const { data: hostTypes = [] } = useHostTypes({}, { enabled });

  return {
    addOnOperators,
    diskImages,
    computeInstanceTypes,
    bareMetalInstanceTypes: bareMetalInstanceTypesData?.items ?? [],
    clusterVersions,
    hostTypes,
  };
};
