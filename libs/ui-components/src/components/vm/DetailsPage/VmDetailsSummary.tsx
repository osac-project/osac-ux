import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import HddIcon from '@patternfly/react-icons/dist/esm/icons/hdd-icon';
import MemoryIcon from '@patternfly/react-icons/dist/esm/icons/memory-icon';
import MicrochipIcon from '@patternfly/react-icons/dist/esm/icons/microchip-icon';

import type { ComputeInstance } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { ResourceKpiHeader } from '../../Resource/Header';

interface VmDetailsSummaryProps {
  vm: ComputeInstance;
}

export const VmDetailsSummary = ({ vm }: VmDetailsSummaryProps) => {
  const { t } = useTranslation();
  const cores = vm.spec?.cores;
  const memoryGib = vm.spec?.memoryGib;
  const publicIp = vm.status?.publicIpAddress;

  const bootDiskGib = vm.spec?.bootDisk?.sizeGib ?? 0;
  const additionalGib = (vm.spec?.additionalDisks ?? []).reduce(
    (sum, d) => sum + (d.sizeGib ?? 0),
    0,
  );
  const totalStorageGib = bootDiskGib + additionalGib;

  return (
    <ResourceKpiHeader
      ariaLabel={t('Virtual machine summary')}
      items={[
        { title: t('vCPU'), icon: MicrochipIcon, value: cores ?? '—' },
        {
          title: t('Memory'),
          icon: MemoryIcon,
          value: memoryGib != null ? `${memoryGib} GiB` : '—',
        },
        {
          title: t('Storage'),
          icon: HddIcon,
          value: totalStorageGib > 0 ? `${totalStorageGib} GiB` : '—',
        },
        { title: t('Public IP'), icon: GlobeIcon, value: publicIp || '—' },
      ]}
    />
  );
};
