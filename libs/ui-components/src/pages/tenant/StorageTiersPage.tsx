/**
 * flow: manage-storage-tiers
 * step: tier_list_view
 * route: /storage/tiers
 * roles: tenantUser, tenantAdmin (read-only)
 */
import {
  Alert,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Divider,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { StorageTier } from '../../api/v1/storage-tier';
import { useStorageTiers } from '../../api/v1/storage-tier';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

const PROTOCOL_COLORS: Record<string, 'blue' | 'purple' | 'cyan'> = {
  nfs: 'blue',
  rbd: 'purple',
  s3: 'cyan',
};

const QOS_COLORS: Record<string, 'gold' | 'blue' | 'grey'> = {
  fast: 'gold',
  standard: 'blue',
  archival: 'grey',
};

function tierPrice(tier: StorageTier): string | undefined {
  const raw = tier.metadata?.labels?.['price_per_gib_month'];
  if (!raw) {
    return undefined;
  }
  const num = parseFloat(raw);
  if (isNaN(num)) {
    return undefined;
  }
  return `$${num.toFixed(4)}/GiB·mo`;
}

const StorageTierCard = ({ tier }: { tier: StorageTier }) => {
  const name = tier.spec.displayName ?? tier.metadata?.name ?? tier.id;
  const description = tier.metadata?.description;
  const price = tierPrice(tier);
  const protocol = tier.spec.protocol;
  const qosClass = tier.spec.qosClass;

  return (
    <Card isFullHeight>
      <CardHeader>
        <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapSm' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <CardTitle>{name}</CardTitle>
          </FlexItem>
          <FlexItem>
            <Label color={tier.status.available ? 'green' : 'red'} isCompact>
              {tier.status.available ? 'Available' : 'Unavailable'}
            </Label>
          </FlexItem>
          {price && (
            <FlexItem>
              <Label variant="filled" color="teal" isCompact aria-label="Price per GiB per month">
                {price}
              </Label>
            </FlexItem>
          )}
        </Flex>
      </CardHeader>
      <Divider />
      <CardBody>
        <Stack hasGutter>
          {description && (
            <StackItem>
              <Content component="small" className="pf-v6-u-color-text-subtle">
                {description}
              </Content>
            </StackItem>
          )}
          <StackItem>
            <Flex flexWrap={{ default: 'wrap' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Label variant="outline" color={PROTOCOL_COLORS[protocol] ?? 'grey'} isCompact>
                  {protocol.toUpperCase()}
                </Label>
              </FlexItem>
              <FlexItem>
                <Label variant="outline" color={QOS_COLORS[qosClass] ?? 'grey'} isCompact>
                  {qosClass}
                </Label>
              </FlexItem>
              <FlexItem>
                <Label variant="outline" color="grey" isCompact>
                  {tier.spec.storageClassName}
                </Label>
              </FlexItem>
            </Flex>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export const StorageTiersPage = () => {
  const { data: tiers = [], isLoading, error } = useStorageTiers();

  return (
    <ListPage
      title="Storage Tiers"
      description="Available storage tiers you can use when creating volumes."
    >
      <ListPageBody isLoading={isLoading} error={error}>
        {tiers.length === 0 ? (
          <Alert variant="info" isInline title="No storage tiers available" />
        ) : (
          <Gallery
            hasGutter
            minWidths={{ default: '240px', md: '260px', lg: '280px' }}
            maxWidths={{ md: '320px', lg: '360px', xl: '400px' }}
          >
            {tiers.map((tier) => (
              <GalleryItem key={tier.id}>
                <StorageTierCard tier={tier} />
              </GalleryItem>
            ))}
          </Gallery>
        )}
      </ListPageBody>
    </ListPage>
  );
};
