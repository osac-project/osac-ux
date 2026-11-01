import { Link } from 'react-router-dom';
import {
  Avatar,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import InfoAltIcon from '@patternfly/react-icons/dist/esm/icons/info-alt-icon';

import type { ExternalIP } from '@osac/types';
import type { ExternalIPPool } from '@osac/types/private';

import ExternalIpPoolCidrsSection from './ExternalIpPoolCidrsSection';
import ExternalIpPoolIpsSidebarSection from './ExternalIpPoolIpsSidebarSection';
import ExternalIpPoolStatusLabel from './ExternalIpPoolStatusLabel';
import { cel } from '../../api/cel';
import { useExternalIpsData } from '../../api/v1/external-ip-data';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import { Timestamp } from '../Primitives/Timestamp';

import './ExternalIpPoolDetailsPageContent.css';
import '../shared/details-page.css';

const SHARED_TENANT = 'shared';
const TENANT_REFERENCES: Record<string, { domain: string; id: string }> = {
  'acme-corporation': { domain: 'acme.example.com', id: 'tenant-acme' },
};

interface ExternalIpPoolDetailsPageContentProps {
  pool: ExternalIPPool;
  tenantView?: boolean;
}

const ExternalIpPoolDetailsPageContent = ({
  pool,
  tenantView = false,
}: ExternalIpPoolDetailsPageContentProps) => {
  const { t } = useTranslation();
  const { externalIps, attachedTargetsByExternalIpId } = useExternalIpsData({
    filter: cel<ExternalIP>((filter) => filter.field('spec.pool.id').equals(pool.id)),
  });
  const cidrs = pool.spec?.cidrs ?? (tenantView ? ['198.51.100.64/26'] : []);
  const tenant = pool.metadata?.tenant;
  const tenantReference = tenant ? TENANT_REFERENCES[tenant] : undefined;

  return (
    <PageSection hasBodyWrapper={false}>
      <Grid hasGutter className="details-page__content-grid">
        <GridItem md={8} className="details-page__column">
          <Grid hasGutter className="external-ip-pool-details__main-grid">
            <GridItem md={6}>
              <Stack hasGutter>
                <StackItem>
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    spaceItems={{ default: 'spaceItemsSm' }}
                  >
                    <InfoAltIcon aria-hidden />
                    <Title headingLevel="h2" size="lg">
                      {t('Overview')}
                    </Title>
                  </Flex>
                </StackItem>
                <StackItem>
                  <DescriptionList
                    isCompact
                    className="details-page__overview"
                    aria-label={t('External IP pool overview')}
                  >
                    <DescriptionListGroup>
                      <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ExternalIpPoolStatusLabel state={pool.status?.state} />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        {tenantView ? t('Managed by') : t('Created')}
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {tenantView ? (
                          t('Provider administrator')
                        ) : (
                          <Timestamp value={pool.metadata?.creationTimestamp} />
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    {!tenantView && (
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {tenant ? (
                            tenant === SHARED_TENANT ? (
                              t('Shared')
                            ) : (
                              <Flex
                                alignItems={{ default: 'alignItemsCenter' }}
                                spaceItems={{ default: 'spaceItemsSm' }}
                              >
                                <FlexItem>
                                  <Avatar
                                    alt=""
                                    color="gray"
                                    initials={tenant.charAt(0).toUpperCase()}
                                    size="sm"
                                  />
                                </FlexItem>
                                <FlexItem>
                                  <Stack hasGutter={false}>
                                    <StackItem>
                                      <Link
                                        to={`/admin/tenants/${encodeURIComponent(
                                          tenantReference?.id ?? tenant,
                                        )}`}
                                      >
                                        {tenant}
                                      </Link>
                                    </StackItem>
                                    {tenantReference?.domain ? (
                                      <StackItem>
                                        <span className="external-ip-pool-details__tenant-domain">
                                          {tenantReference.domain}
                                        </span>
                                      </StackItem>
                                    ) : null}
                                  </Stack>
                                </FlexItem>
                              </Flex>
                            )
                          ) : (
                            displayValue()
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    )}
                  </DescriptionList>
                </StackItem>
              </Stack>
            </GridItem>
            <GridItem md={6}>
              <ExternalIpPoolCidrsSection cidrs={cidrs} ipFamily={pool.spec?.ipFamily} />
            </GridItem>
          </Grid>
        </GridItem>

        <GridItem md={4} className="details-page__column">
          <Stack hasGutter>
            <StackItem>
              <ExternalIpPoolIpsSidebarSection
                pool={pool}
                tenantView={tenantView}
                externalIps={externalIps}
                attachedTargetsByExternalIpId={attachedTargetsByExternalIpId}
              />
            </StackItem>
          </Stack>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default ExternalIpPoolDetailsPageContent;
