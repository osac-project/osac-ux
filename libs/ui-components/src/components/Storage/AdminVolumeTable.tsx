import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { Link } from 'react-router-dom';

import type { Volume } from '@osac/types/private';
import { StorageProtocol } from '@osac/types/private';

import { VolumeStatusLabel } from '../Volume/VolumeStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';

interface AdminVolumeTableProps {
  volumes: Volume[];
}

const formatSizeGib = (sizeGib: bigint | undefined): string => {
  if (sizeGib === undefined) {
    return '—';
  }
  return `${Number(sizeGib)} GiB`;
};

const truncateId = (id: string | undefined, maxLength = 20): string => {
  if (!id) return '—';
  if (id.length <= maxLength) return id;
  return `${id.substring(0, maxLength)}...`;
};

const PROTOCOL_LABELS: Record<StorageProtocol, string> = {
  [StorageProtocol.UNSPECIFIED]: '—',
  [StorageProtocol.BLOCK]: 'Block',
  [StorageProtocol.NFS]: 'NFS',
};

export const AdminVolumeTable = ({ volumes }: AdminVolumeTableProps) => {
  const { t } = useTranslation();

  return (
    <Table aria-label={t('Volumes')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('State')}</Th>
          <Th>{t('Tenant')}</Th>
          <Th>{t('Protocol')}</Th>
          <Th>{t('Size')}</Th>
          <Th>{t('Vendor ID')}</Th>
          <Th>{t('Hub')}</Th>
          <Th>{t('Tier')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {volumes.map((volume) => {
          const name = volume.metadata?.name || volume.id;
          const protocol = volume.status?.protocol ?? StorageProtocol.UNSPECIFIED;

          return (
            <Tr key={volume.id}>
              <Td dataLabel={t('Name')}>
                <Link to={`/admin/infrastructure/storage/volumes/${encodeURIComponent(volume.id)}`}>
                  {name}
                </Link>
              </Td>
              <Td dataLabel={t('State')}>
                <VolumeStatusLabel state={volume.status?.state} />
              </Td>
              <Td dataLabel={t('Tenant')}>{volume.metadata?.tenant || '—'}</Td>
              <Td dataLabel={t('Protocol')}>{PROTOCOL_LABELS[protocol]}</Td>
              <Td dataLabel={t('Size')}>{formatSizeGib(volume.status?.provisionedSizeGib)}</Td>
              <Td dataLabel={t('Vendor ID')}>{truncateId(volume.status?.vendorVolumeId)}</Td>
              <Td dataLabel={t('Hub')}>{volume.status?.hub || '—'}</Td>
              <Td dataLabel={t('Tier')}>{volume.spec?.storageTier ?? '—'}</Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};
