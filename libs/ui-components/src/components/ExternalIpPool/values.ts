import { IPFamily } from '@osac/types/private';

import { type ResourceSelectValue, emptyResourceSelectValue } from '../Form/ResourceSelectField';

export const EXTERNAL_IP_POOLS_LIST_PATH = '/admin/infrastructure/external-ip-pools';

export const externalIpPoolDetailsPath = (id: string) => `${EXTERNAL_IP_POOLS_LIST_PATH}/${id}`;

export interface ExternalIpPoolFormValues {
  metadata: { name: string; description: string; tenant: ResourceSelectValue };
  ipFamily: IPFamily;
  cidrs: string[];
}

export const getExternalIpPoolValues = (): ExternalIpPoolFormValues => ({
  metadata: { name: '', description: '', tenant: emptyResourceSelectValue() },
  ipFamily: IPFamily.IP_FAMILY_IPV4,
  cidrs: [''],
});
