import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  PageSection,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import { StorageProtocol } from '@osac/types/private';
import { usePrivateVolume } from '../../api/v1/private/volumes';
import { ResourceDetailHeader } from '../../components/Resource/ResourceDetailHeader';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { VolumeStatusLabel } from '../../components/Volume/VolumeStatusLabel';
import { VolumeAccessModeLabel } from '../../components/Volume/VolumeAccessModeLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { displayValue } from '../../utils/detailFormatters';
import { Timestamp } from '../../components/Primitives/Timestamp';

const VOLUMES_LIST_PATH = '/admin/infrastructure/storage/volumes';

const PROTOCOL_LABELS: Record<StorageProtocol, string> = {
  [StorageProtocol.UNSPECIFIED]: 'Unspecified',
  [StorageProtocol.BLOCK]: 'Block',
  [StorageProtocol.NFS]: 'NFS',
};

const formatSizeGib = (sizeGib: bigint | undefined): string => {
  if (sizeGib === undefined) {
    return '—';
  }
  return `${Number(sizeGib)} GiB`;
};

const formatTopologySegments = (segments: Record<string, string> | undefined): string => {
  if (!segments || Object.keys(segments).length === 0) {
    return '—';
  }
  return Object.entries(segments)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');
};

export const AdminVolumeDetailsPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { data: volume, isLoading, isError, error, refetch } = usePrivateVolume(id);

  if (isLoading) {
    return (
      <ResourceDetailsPageLoading
        parentTo={VOLUMES_LIST_PATH}
        parentLabel={t('Volumes')}
        cardCount={2}
      />
    );
  }

  if (isError) {
    return (
      <ResourceDetailsPageError
        parentTo={VOLUMES_LIST_PATH}
        parentLabel={t('Volumes')}
        resourceLabel={t('volume')}
        error={error}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!volume) {
    return (
      <ResourceDetailsPageError
        parentTo={VOLUMES_LIST_PATH}
        parentLabel={t('Volumes')}
        resourceLabel={t('volume')}
        variant="not-found"
      />
    );
  }

  const protocol = volume.status?.protocol ?? StorageProtocol.UNSPECIFIED;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <ResourceDetailHeader
                  parentTo={VOLUMES_LIST_PATH}
                  parentLabel={t('Volumes')}
                  resourceName={volume.metadata?.name || volume.id}
                  titleAddon={<VolumeStatusLabel state={volume.status?.state} />}
                />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Card>
            <CardTitle>{t('Overview')}</CardTitle>
            <CardBody>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.metadata?.name)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('ID')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.id)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Tenant')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.metadata?.tenant)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('State')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <VolumeStatusLabel state={volume.status?.state} />
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Storage tier')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.spec?.storageTier)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Requested size')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatSizeGib(volume.spec?.sizeGib)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Provisioned size')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatSizeGib(volume.status?.provisionedSizeGib)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Access mode')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <VolumeAccessModeLabel accessMode={volume.spec?.accessMode} />
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Protocol')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {PROTOCOL_LABELS[protocol]}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Hub')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.status?.hub)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Created')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp value={volume.metadata?.creationTimestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {volume.status?.stateTransitionTime && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('State transition time')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Timestamp value={volume.status.stateTransitionTime} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </CardBody>
          </Card>

          <Card>
            <CardTitle>{t('Technical details')}</CardTitle>
            <CardBody>
              <DescriptionList isCompact>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Vendor volume ID')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.status?.vendorVolumeId)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Provider')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {displayValue(volume.status?.provider)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Topology segments')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {formatTopologySegments(volume.spec?.topology?.segments)}
                  </DescriptionListDescription>
                </DescriptionListGroup>

                {volume.status?.vendorContext && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Vendor context')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      <pre style={{ margin: 0, fontSize: '12px' }}>
                        {JSON.stringify(volume.status.vendorContext, null, 2)}
                      </pre>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}

                {volume.status?.message && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Status message')}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {volume.status.message}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </CardBody>
          </Card>
        </Stack>
      </PageSection>
    </>
  );
};

export default AdminVolumeDetailsPage;
