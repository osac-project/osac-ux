import { Gallery, GalleryItem } from '@patternfly/react-core';

import type { BareMetalInstance, BareMetalInstanceType } from '@osac/types';

import BareMetalCard from './BareMetalCard';

interface BareMetalCardsProps {
  instances: BareMetalInstance[];
  instanceTypes: BareMetalInstanceType[];
}

const BareMetalCards = ({ instances, instanceTypes }: BareMetalCardsProps) => {
  const instanceTypeById = new Map(
    instanceTypes.map((instanceType) => [instanceType.id, instanceType]),
  );

  return (
    <Gallery hasGutter minWidths={{ default: '20.875rem' }} maxWidths={{ default: '20.875rem' }}>
      {instances.map((instance) => (
        <GalleryItem key={instance.id}>
          <BareMetalCard
            instance={instance}
            instanceType={
              instance.spec?.instanceType?.id
                ? instanceTypeById.get(instance.spec.instanceType.id)
                : undefined
            }
          />
        </GalleryItem>
      ))}
    </Gallery>
  );
};

export default BareMetalCards;
