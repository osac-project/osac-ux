import { useParams } from 'react-router-dom';
import { PageSection, Stack, StackItem } from '@patternfly/react-core';

import { ExternalIPPools } from '@osac/types';
import type { ExternalIPPool as PrivateExternalIPPool } from '@osac/types/private';

import { useGetResource } from '../../api/use-resource';
import { useTranslation } from '../../hooks/useTranslation';
import ExternalIpPoolDetailsPageContent from '../ExternalIpPool/ExternalIpPoolDetailsPageContent';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import ResourceDetailsPage from '../Resource/ResourceDetailsPage';

const EXTERNAL_IPS_LIST_PATH = '/networking/external-ips';

const ExternalIpDetailsPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetResource(ExternalIPPools, { id });
  const pool = data?.object;

  return (
    <ResourceDetailsPage
      error={error}
      found={!!pool}
      isLoading={isLoading}
      parentLabel={t('External IPs')}
      parentTo={EXTERNAL_IPS_LIST_PATH}
      refetch={refetch}
      resourceLabel={t('external IP pool')}
      cardCount={2}
    >
      {pool && (
        <>
          <PageSection hasBodyWrapper={false}>
            <Stack hasGutter>
              <StackItem>
                <ResourceDetailHeader
                  parentTo={EXTERNAL_IPS_LIST_PATH}
                  parentLabel={t('External IPs')}
                  resourceName={pool.metadata?.name || pool.id}
                  titleSize="3xl"
                  description={t(
                    'Provider-assigned routable addresses available for your workloads.',
                  )}
                />
              </StackItem>
            </Stack>
          </PageSection>
          <ExternalIpPoolDetailsPageContent
            pool={pool as unknown as PrivateExternalIPPool}
            tenantView
          />
        </>
      )}
    </ResourceDetailsPage>
  );
};

export default ExternalIpDetailsPage;
