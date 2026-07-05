import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import HddIcon from '@patternfly/react-icons/dist/esm/icons/hdd-icon';
import MemoryIcon from '@patternfly/react-icons/dist/esm/icons/memory-icon';
import MicrochipIcon from '@patternfly/react-icons/dist/esm/icons/microchip-icon';

import type { ComputeInstance } from '@osac/types';

import { ResourceKpiHeader } from '../../Resource/Header';

interface VmDetailsSummaryProps {
  vm: ComputeInstance;
}

export const VmDetailsSummary = ({ vm }: VmDetailsSummaryProps) => {
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
      ariaLabel="Virtual machine summary"
      items={[
        { title: 'vCPU', icon: MicrochipIcon, value: cores ?? '—' },
        { title: 'Memory', icon: MemoryIcon, value: memoryGib != null ? `${memoryGib} GiB` : '—' },
        {
          title: 'Storage',
          icon: HddIcon,
          value: totalStorageGib > 0 ? `${totalStorageGib} GiB` : '—',
        },
        { title: 'Public IP', icon: GlobeIcon, value: publicIp || '—' },
      ]}
    />
  );
};
