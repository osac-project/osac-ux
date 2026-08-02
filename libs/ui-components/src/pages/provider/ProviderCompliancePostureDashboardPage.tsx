/**
 * flow: provider-admin
 * route: /provider/compliance
 *
 * Aggregation surface for compliance/sovereignty/security posture (OSAC-3032 — Compliance Posture
 * Dashboard). Rolls up the per-resource indicators surfaced elsewhere in the console (tenant
 * jurisdiction, catalog residency, KMS, network isolation, and live scan state) into one view.
 */
import { useMemo } from 'react';
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
  LabelGroup,
  Stack,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import ShieldAltIcon from '@patternfly/react-icons/dist/esm/icons/shield-alt-icon';

import { useBareMetalInstances } from '../../api/v1/baremetal-instance';
import { useClusters } from '../../api/v1/cluster';
import {
  JURISDICTIONS,
  type LabeledResource,
  networkIsolationEnforced,
  resourceComplianceResult,
  tenantJurisdiction,
  usePlatformSecurityFlags,
} from '../../api/v1/compliance';
import { useComputeInstances } from '../../api/v1/compute-instance';
import { useNetworkClasses } from '../../api/v1/networking';
import { useTenants } from '../../api/v1/tenant';
import { DashboardActionTile } from '../../components/dashboard/DashboardActionTile';
import { DashboardMetricCard } from '../../components/dashboard/DashboardMetricCard';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';

const JURISDICTION_COLOR = { EU: 'blue', US: 'purple', Unrestricted: 'grey' } as const;

const compliancePct = <T extends LabeledResource>(
  items: T[],
  profile: 'ACM (NIST 800-53)' | 'STIG' | 'CIS',
): number | null => {
  if (items.length === 0) {
    return null;
  }
  const compliant = items.filter(
    (item) => resourceComplianceResult(item, profile).state === 'compliant',
  ).length;
  return Math.round((compliant / items.length) * 100);
};

export const ProviderCompliancePostureDashboardPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flags = usePlatformSecurityFlags();

  const { data: tenants = [], isLoading: tenantsLoading, error: tenantsError } = useTenants();
  const { data: clusters = [], isLoading: clustersLoading } = useClusters();
  const { data: vms = [], isLoading: vmsLoading } = useComputeInstances();
  const { data: bms = [], isLoading: bmsLoading } = useBareMetalInstances();
  const { data: networkClasses = [], isLoading: ncLoading } = useNetworkClasses();

  const isLoading = tenantsLoading || clustersLoading || vmsLoading || bmsLoading || ncLoading;

  const jurisdictionCounts = useMemo(() => {
    const counts: Record<string, number> = { EU: 0, US: 0, Unrestricted: 0 };
    tenants.forEach((t) => {
      counts[tenantJurisdiction(t)] += 1;
    });
    return counts;
  }, [tenants]);

  const isolatedPct = useMemo(() => {
    if (networkClasses.length === 0) {
      return null;
    }
    const isolated = networkClasses.filter(networkIsolationEnforced).length;
    return Math.round((isolated / networkClasses.length) * 100);
  }, [networkClasses]);

  const clusterPct = compliancePct(clusters, 'ACM (NIST 800-53)');
  const vmPct = compliancePct(vms, 'STIG');
  const bmPct = compliancePct(bms, 'CIS');

  const pctLabel = (pct: number | null) => (pct === null ? '—' : `${pct}%`);

  return (
    <ListPage
      title={t('Compliance posture')}
      description={t(
        'Cross-tenant rollup of sovereignty, encryption, network isolation, and scan-compliance signals (OSAC-3032).',
      )}
    >
      <ListPageBody isLoading={isLoading} error={tenantsError}>
        <Stack hasGutter>
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

          <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
            <DashboardMetricCard label={t('Isolated networks')} value={pctLabel(isolatedPct)} />
            <DashboardMetricCard
              label={t('Compliant clusters (ACM)')}
              value={pctLabel(clusterPct)}
            />
            <DashboardMetricCard label={t('Compliant VMs (STIG)')} value={pctLabel(vmPct)} />
            <DashboardMetricCard label={t('Compliant bare metal (CIS)')} value={pctLabel(bmPct)} />
          </Flex>

          <Card isCompact>
            <CardTitle>{t('Tenant jurisdictions')}</CardTitle>
            <CardBody>
              <LabelGroup>
                {JURISDICTIONS.map((j) => (
                  <Label key={j} isCompact color={JURISDICTION_COLOR[j]}>
                    {t('{{jurisdiction}}: {{count}}', {
                      jurisdiction: j,
                      count: jurisdictionCounts[j],
                    })}
                  </Label>
                ))}
              </LabelGroup>
            </CardBody>
          </Card>

          <Title headingLevel="h2" size="xl">
            {t('Drill in')}
          </Title>
          <Gallery hasGutter minWidths={{ default: '220px' }}>
            <GalleryItem>
              <DashboardActionTile
                icon="📜"
                title={t('Audit log')}
                description={t(
                  'Full activity trail across tenants — who did what, when, and to which resource.',
                )}
                actionLabel={t('View audit log →')}
                onAction={() => navigate('/provider/audit-log')}
              />
            </GalleryItem>
            <GalleryItem>
              <DashboardActionTile
                icon="🏢"
                title={t('Tenant organizations')}
                description={t('Review per-tenant jurisdiction and sovereignty attributes.')}
                actionLabel={t('View organizations →')}
                onAction={() => navigate('/provider/organizations')}
              />
            </GalleryItem>
            <GalleryItem>
              <DashboardActionTile
                icon="🌐"
                title={t('Network classes')}
                description={t('Review network isolation enforcement per network class.')}
                actionLabel={t('View network classes →')}
                onAction={() => navigate('/provider/network-classes')}
              />
            </GalleryItem>
          </Gallery>
        </Stack>
      </ListPageBody>
    </ListPage>
  );
};
