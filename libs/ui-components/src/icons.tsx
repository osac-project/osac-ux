import type { ComponentType } from 'react';
import type { SVGIconProps } from '@patternfly/react-icons/dist/esm/createIcon';
import BalanceScaleIcon from '@patternfly/react-icons/dist/esm/icons/balance-scale-icon';
import BrainIcon from '@patternfly/react-icons/dist/esm/icons/brain-icon';
import BuildingIcon from '@patternfly/react-icons/dist/esm/icons/building-icon';
import CloudIcon from '@patternfly/react-icons/dist/esm/icons/cloud-icon';
import CopyIcon from '@patternfly/react-icons/dist/esm/icons/copy-icon';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/esm/icons/database-icon';
import FolderIcon from '@patternfly/react-icons/dist/esm/icons/folder-icon';
import FolderPlusIcon from '@patternfly/react-icons/dist/esm/icons/folder-plus-icon';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import HddIcon from '@patternfly/react-icons/dist/esm/icons/hdd-icon';
import HistoryIcon from '@patternfly/react-icons/dist/esm/icons/history-icon';
import KeyIcon from '@patternfly/react-icons/dist/esm/icons/key-icon';
import LayerGroupIcon from '@patternfly/react-icons/dist/esm/icons/layer-group-icon';
import MapMarkerIcon from '@patternfly/react-icons/dist/esm/icons/map-marker-icon';
import MicrochipIcon from '@patternfly/react-icons/dist/esm/icons/microchip-icon';
import NetworkIcon from '@patternfly/react-icons/dist/esm/icons/network-icon';
import PencilAltIcon from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';
import ShareAltIcon from '@patternfly/react-icons/dist/esm/icons/share-alt-icon';
import TachometerAltIcon from '@patternfly/react-icons/dist/esm/icons/tachometer-alt-icon';
import UsersIcon from '@patternfly/react-icons/dist/esm/icons/users-icon';
import VirtualMachineIcon from '@patternfly/react-icons/dist/esm/icons/virtual-machine-icon';

import type { CatalogItemKind } from './components/catalog/catalogItemDisplay';

const SHELL_NAV_ICONS: Record<string, ComponentType<SVGIconProps>> = {
  'compute-vms': VirtualMachineIcon,
  'bare-metal': MicrochipIcon,
  'ai-models': BrainIcon,
  'projects-list': FolderIcon,
  'projects-new': FolderPlusIcon,
  catalog: CubeIcon,
  clusters: CloudIcon,
  networks: NetworkIcon,
  'block-volumes': HddIcon,
  'load-balancers': BalanceScaleIcon,
  'object-storage': DatabaseIcon,
  'storage-tiers': LayerGroupIcon,
  'tenant-snapshots': HistoryIcon,
  'tenant-public-ips': GlobeIcon,
  'tenant-public-ips-admin': GlobeIcon,
  'admin-dashboard': TachometerAltIcon,
  'admin-users': UsersIcon,
  'admin-catalog': CubeIcon,
  'admin-networks': NetworkIcon,
  'admin-role-bindings': KeyIcon,
  'admin-identity-providers': ShareAltIcon,
  'provider-dashboard': TachometerAltIcon,
  'provider-orgs': BuildingIcon,
  'provider-catalog-studio': PencilAltIcon,
  'provider-templates': CopyIcon,
  'provider-host-types': ServerIcon,
  'provider-instance-types': MicrochipIcon,
  'provider-ai-setup': BrainIcon,
  'provider-catalog': GlobeIcon,
  'provider-network-classes': NetworkIcon,
  'provider-ip-pools': MapMarkerIcon,
  'provider-storage-backends': DatabaseIcon,
  'provider-storage-tiers': LayerGroupIcon,
};

export const shellNavIcon = (itemId: string) => {
  const Icon = SHELL_NAV_ICONS[itemId];
  return Icon ? <Icon aria-hidden /> : undefined;
};

interface CatalogItemIconProps {
  kind: CatalogItemKind;
}

export const CatalogItemIcon = ({ kind }: CatalogItemIconProps) => {
  const Icon =
    kind === 'baremetal'
      ? ServerIcon
      : kind === 'cluster'
        ? CloudIcon
        : kind === 'maas'
          ? BrainIcon
          : VirtualMachineIcon;
  return <Icon aria-hidden className="pf-v6-u-font-size-lg" />;
};
