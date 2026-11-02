import { Link } from 'react-router-dom';
import { Flex, FlexItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { TFunction } from 'i18next';

import { Architecture, type DiskImage, GuestOSFamily } from '@osac/types';
import { type Tenant } from '@osac/types/private';

import DiskImageActionsMenu from './DiskImageActionsMenu';
import DiskImageLifecycleLabel from './DiskImageLifecycleLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';

import './DiskImageTable.css';

export const architectureLabels = (t: TFunction): Record<Architecture, string> => ({
  [Architecture.UNSPECIFIED]: t('Unspecified'),
  [Architecture.AMD64]: 'amd64',
  [Architecture.ARM64]: 'arm64',
  [Architecture.S390X]: 's390x',
});

export const guestOsFamilyLabels = (t: TFunction): Record<GuestOSFamily, string> => ({
  [GuestOSFamily.GUEST_OS_FAMILY_UNSPECIFIED]: t('Unspecified'),
  [GuestOSFamily.GUEST_OS_FAMILY_LINUX]: t('Linux'),
  [GuestOSFamily.GUEST_OS_FAMILY_WINDOWS]: t('Windows'),
});

interface DiskImageTableProps {
  diskImages: DiskImage[];
  tenants: Tenant[];
}

const DiskImageTable = ({ diskImages, tenants }: DiskImageTableProps) => {
  const { t } = useTranslation();
  const guestOsFamilyText = guestOsFamilyLabels(t);
  const architectureText = architectureLabels(t);

  return (
    <Table aria-label={t('Disk images')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Lifecycle')}</Th>
          <Th>{t('Guest operating system')}</Th>
          <Th>{t('Architecture')}</Th>
          <Th>{t('Visibility')}</Th>
          <Th>{t('Created')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {diskImages.map((diskImage) => {
          const name = diskImage.metadata?.name || diskImage.id;
          const architecture = diskImage.spec?.architecture ?? [];
          const tenantId = diskImage.metadata?.tenant;
          const isGlobal = tenantId === 'shared';
          const tenantName = tenants.find((tenant) => tenant.id === tenantId)?.metadata?.name;
          const architectureLabel = architecture.length
            ? architecture.map((value) => architectureText[value] ?? t('Unspecified')).join(', ')
            : '—';

          return (
            <Tr key={diskImage.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      to={`/admin/infrastructure/disk-images/${encodeURIComponent(diskImage.id)}`}
                      className="disk-images-table__name-link"
                    >
                      {name}
                    </Link>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Lifecycle')}>
                <DiskImageLifecycleLabel lifecycle={diskImage.spec?.lifecycle} />
              </Td>
              <Td dataLabel={t('Guest operating system')}>
                {
                  guestOsFamilyText[
                    diskImage.spec?.guestOsFamily ?? GuestOSFamily.GUEST_OS_FAMILY_UNSPECIFIED
                  ]
                }
              </Td>
              <Td dataLabel={t('Architecture')}>{architectureLabel}</Td>
              <Td dataLabel={t('Visibility')}>
                {isGlobal ? t('Global') : (tenantName ?? tenantId ?? '—')}
              </Td>
              <Td dataLabel={t('Created')}>
                <Timestamp value={diskImage.metadata?.creationTimestamp} />
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <DiskImageActionsMenu diskImage={diskImage} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default DiskImageTable;
