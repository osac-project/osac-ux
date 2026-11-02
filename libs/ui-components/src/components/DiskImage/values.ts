import { Architecture, GuestOSFamily } from '@osac/types';
import type { KeyValuePair } from '../Form/KeyValueMapField';

export type DiskImageScope = 'global' | 'tenant';

export interface DiskImageFormValues {
  metadata: {
    name: string;
    tenant: string;
    description: string;
    labels: KeyValuePair[];
  };
  scope: DiskImageScope;
  spec: {
    sourceRef: string;
    guestOsFamily: GuestOSFamily;
    architecture: Architecture[];
  };
}

export const diskImageCreateValues: DiskImageFormValues = {
  metadata: { name: '', tenant: '', description: '', labels: [] },
  scope: 'global',
  spec: {
    sourceRef: '',
    guestOsFamily: GuestOSFamily.GUEST_OS_FAMILY_LINUX,
    architecture: [],
  },
};
