import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import ShieldAltIcon from '@patternfly/react-icons/dist/esm/icons/shield-alt-icon';

import { usePlatformSecurityFlags } from '@osac/ui-components/api/v1/compliance';
import { useComputeInstances } from '@osac/ui-components/api/v1/compute-instance';
import { useOrganizations } from '@osac/ui-components/api/v1/organization';
import { DashboardActionTile } from '@osac/ui-components/components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '@osac/ui-components/components/dashboard/DashboardMetricCard';
import { UsageSummaryCard } from '@osac/ui-components/components/metering/UsageSummaryCard';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { readOrganizationStatus } from '../../utils/adminWireDisplay';

const PlatformSecurityCard = () => {
  const { t } = useTranslation();
  const flags = usePlatformSecurityFlags();
  return (
    <Card isCompact>
      <CardTitle>{t('Platform Security')}</CardTitle>
      <CardBody>
        <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'wrap' }}>
          <FlexItem>
            <Tooltip
              content={t(
                'mTLS for platform inter-service communication is always enforced (OSAC-3025).',
              )}
            >
              <Label icon={<LockIcon />} color={flags.mtls ? 'green' : 'grey'} isCompact>
                {t('mTLS enforced')}
              </Label>
            </Tooltip>
          </FlexItem>
          <FlexItem>
            <Tooltip
              content={t('FIPS 140-2 validated cryptography is always enforced (OSAC-3026).')}
            >
              <Label icon={<ShieldAltIcon />} color={flags.fips ? 'green' : 'grey'} isCompact>
                {t('FIPS 140-2')}
              </Label>
            </Tooltip>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};

const PROVIDER_TILES = [
  {
    id: 'tenant-organizations',
    label: 'Tenant organizations',
    icon: '🏢',
    desc: 'Manage and view all tenant organizations.',
    path: '/provider/organizations',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: '🖥️',
    desc: 'View platform infrastructure topology.',
    path: '/provider/infrastructure',
  },
  {
    id: 'compliance',
    label: 'Compliance posture',
    icon: '🛡️',
    desc: 'Aggregate sovereignty, encryption, isolation, and scan-compliance status.',
    path: '/provider/compliance',
  },
];

export const ProviderAdminDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: vms = [], isLoading: vmsLoading, error: vmsError } = useComputeInstances();
  const { data: organizations = [], isLoading: orgsLoading, error: orgsError } = useOrganizations();

  const activeTenants = organizations.filter((o) => readOrganizationStatus(o) === 'active').length;

  return (
    <ListPage title={t('Provider Dashboard')} description={t('Cross-tenant platform overview.')}>
      <ListPageBody isLoading={vmsLoading || orgsLoading} error={vmsError || orgsError}>
        <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
          <DashboardMetricCard label={t('Total VMs')} value={vms.length} />
          <DashboardMetricCard label={t('Tenant orgs')} value={organizations.length} />
          <DashboardMetricCard label={t('Active tenants')} value={activeTenants} />
        </Flex>

        <PlatformSecurityCard />

        <UsageSummaryCard />

        <Title headingLevel="h2" size="xl">
          {t('Management areas')}
        </Title>
        <Gallery hasGutter minWidths={{ default: '220px' }}>
          {PROVIDER_TILES.map((tile) => (
            <GalleryItem key={tile.id}>
              <DashboardActionTile
                icon={tile.icon}
                title={t(tile.label)}
                description={t(tile.desc)}
                actionLabel={t('Go to {{label}} →', { label: tile.label.toLowerCase() })}
                onAction={() => navigate(tile.path)}
              />
            </GalleryItem>
          ))}
        </Gallery>
      </ListPageBody>
    </ListPage>
  );
};
