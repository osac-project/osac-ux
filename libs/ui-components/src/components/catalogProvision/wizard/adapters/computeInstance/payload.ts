import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { VM_CREATE_RUN_STRATEGY } from './fields';
import type { BuildComputeInstanceCreateBodyInput } from '../../../../../api/v1/compute-instance-wire';

export const createEmptyComputeInstanceValues = (): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', labels: {} },
  spec: {
    sshKey: '',
    image: { sourceRef: '' },
    instanceType: '',
    userData: '',
    bootDisk: { sizeGib: '' },
    additionalDisks: [],
    isWindows: false,
    runStrategy: VM_CREATE_RUN_STRATEGY,
    networking: {
      virtualNetworkId: '',
      subnetId: '',
      securityGroupIds: [],
    },
    additionalNetworkAttachments: [],
    projectId: '',
  },
});

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): BuildComputeInstanceCreateBodyInput => {
  const instanceType = values.spec.instanceType.trim();

  const spec: Record<string, unknown> = {
    catalogItem: catalogItem.id,
    instanceType,
    image: {
      sourceType: 'registry',
      sourceRef: values.spec.image.sourceRef.trim(),
    },
    runStrategy: values.spec.runStrategy || VM_CREATE_RUN_STRATEGY,
    networkAttachments: [
      {
        subnet: values.spec.networking.subnetId,
        securityGroups: values.spec.networking.securityGroupIds,
      },
      ...values.spec.additionalNetworkAttachments.map((a) => ({
        subnet: a.subnetId,
        securityGroups: a.securityGroupIds,
      })),
    ],
  };

  const sshKey = values.spec.sshKey.trim();
  if (sshKey) {
    spec.sshKey = sshKey;
  }

  const userData = values.spec.userData.trim();
  if (userData) {
    spec.userData = userData;
  }

  const bootDiskRaw = values.spec.bootDisk.sizeGib.trim();
  if (bootDiskRaw) {
    spec.bootDisk = { sizeGib: Number(bootDiskRaw) };
  }

  // Additional disks — proto-aligned: spec.additional_disks[].size_gib
  const additionalDisks = values.spec.additionalDisks
    .map((d) => d.sizeGib.trim())
    .filter(Boolean)
    .map((sizeGib) => ({ sizeGib: Number(sizeGib) }));
  if (additionalDisks.length > 0) {
    spec.additionalDisks = additionalDisks;
  }

  // Windows flag — proto-aligned: spec.is_windows
  if (values.spec.isWindows) {
    spec.isWindows = true;
  }

  // Build metadata with labels
  const cleanLabels = Object.fromEntries(
    Object.entries(values.metadata.labels).filter(([k, v]) => k.trim() && v.trim()),
  );

  const payload: BuildComputeInstanceCreateBodyInput = {
    metadata: {
      name: values.metadata.name.trim(),
      ...(Object.keys(cleanLabels).length > 0 ? { labels: cleanLabels } : {}),
    },
    spec,
  };

  // @predicted: metadata.project — OSAC-1064
  const projectId = values.spec.projectId?.trim();
  if (projectId) {
    (payload.metadata as Record<string, unknown>).project = projectId;
  }

  const publicIPPoolId = values.spec.networking.publicIPPoolId?.trim();
  if (publicIPPoolId) {
    payload._postProvision = { publicIPPoolId };
  }

  return payload;
};
