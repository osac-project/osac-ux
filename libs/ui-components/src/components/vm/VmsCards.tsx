import { Gallery, GalleryItem } from '@patternfly/react-core';

import type { ComputeInstance, InstanceType } from '@osac/types';

import VmCard from './VmCard';

interface VmsCardsProps {
  vms: ComputeInstance[];
  instanceTypes?: InstanceType[];
  isInstanceTypesLoading?: boolean;
}

const VmsCards = ({
  vms,
  instanceTypes = [],
  isInstanceTypesLoading = false,
}: VmsCardsProps) => {
  const instanceTypeById = new Map(instanceTypes.map((item) => [item.id, item]));

  return (
    <Gallery hasGutter minWidths={{ default: '20.875rem' }} maxWidths={{ default: '20.875rem' }}>
      {vms.map((vm) => (
        <GalleryItem key={vm.id}>
          <VmCard
            vm={vm}
            instanceType={
              vm.spec?.instanceType?.id
                ? instanceTypeById.get(vm.spec.instanceType.id)
                : undefined
            }
            isInstanceTypesLoading={isInstanceTypesLoading}
          />
        </GalleryItem>
      ))}
    </Gallery>
  );
};

export default VmsCards;
