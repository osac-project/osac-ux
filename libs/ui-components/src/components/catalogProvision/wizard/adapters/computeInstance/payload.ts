import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ComputeInstanceCatalogItem, ComputeInstanceSchema } from '@osac/types';
import { ComputeInstanceRunStrategy } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import {
  type ResourceSelectValue,
  emptyResourceSelectValue,
} from '../../../../Form/resourceSelectValue';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

export const createEmptyComputeInstanceValues = (project = ''): ComputeInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project, description: '' },
  spec: {
    diskImage: emptyResourceSelectValue(),
    sshKey: { name: '' },
    instanceType: '',
    userDataSource: 'inline',
    userData: '',
    userDataSecret: { name: '' },
    bootDisk: { sizeGib: '', storageTier: emptyResourceSelectValue() },
    additionalDisks: [],
    networking: {
      useDefaultNetwork: true,
      virtualNetwork: emptyResourceSelectValue(),
      subnet: emptyResourceSelectValue(),
      securityGroups: [],
      autoExternalIpAttachment: false,
      additionalNetworks: [],
    },
  },
});

const tierField = (
  storageTier: ResourceSelectValue,
): { storageTier?: { id?: string; name?: string } } => {
  const id = storageTier?.id?.trim() ?? '';
  const name = storageTier?.name?.trim() ?? '';
  if (!id && !name) {
    return {};
  }
  return {
    storageTier: {
      ...(id ? { id } : {}),
      ...(name ? { name } : {}),
    },
  };
};

export const buildComputeInstanceCreatePayload = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
): MessageInitShape<typeof ComputeInstanceSchema> => {
  const spec: MessageInitShape<typeof ComputeInstanceSchema>['spec'] = {
    catalogItem: {
      id: catalogItem.id,
    },
    instanceType: {
      id: values.spec.instanceType,
    },
    runStrategy: ComputeInstanceRunStrategy.COMPUTE_INSTANCE_RUN_STRATEGY_ALWAYS,
  };

  const diskImageId = values.spec.diskImage?.id.trim() ?? '';
  const diskImageName = values.spec.diskImage?.name.trim() ?? '';
  if (diskImageId || diskImageName) {
    spec.diskImage = {
      ...(diskImageId ? { id: diskImageId } : {}),
      ...(diskImageName ? { name: diskImageName } : {}),
    };
  }

  if (!values.spec.networking.useDefaultNetwork) {
    const networkAttachments = [
      values.spec.networking,
      ...(values.spec.networking.additionalNetworks ?? []),
    ]
      .filter((network) => !network.useDefaultNetwork)
      .map((network) => {
        const subnetId = network.subnet.id.trim();
        if (!subnetId) {
          return undefined;
        }
        return {
          subnet: { id: subnetId },
          securityGroups: network.securityGroups
            .filter((sg) => sg.id.trim())
            .map((sg) => ({ id: sg.id })),
        };
      })
      .filter((network): network is NonNullable<typeof network> => network !== undefined);

    if (networkAttachments.length > 0) {
      spec.networkAttachments = networkAttachments;
    }
  }

  if (values.spec.networking.autoExternalIpAttachment) {
    spec.autoExternalIpAttachment = true;
  }

  const sshKeyName = values.spec.sshKey.name.trim();
  if (sshKeyName) {
    spec.sshKey = { name: sshKeyName };
  }

  if (values.spec.userDataSource === 'secret') {
    const userDataSecretName = values.spec.userDataSecret.name.trim();
    if (userDataSecretName) {
      spec.userDataSecret = { name: userDataSecretName };
    }
  } else {
    const userData = values.spec.userData.trim();
    if (userData) {
      spec.userData = userData;
    }
  }

  const bootDiskRaw = values.spec.bootDisk.sizeGib.trim();
  if (bootDiskRaw) {
    spec.bootDisk = {
      sizeGib: Number(bootDiskRaw),
      ...tierField(values.spec.bootDisk.storageTier),
    };
  }

  const additionalDisks = values.spec.additionalDisks
    .filter((disk) => disk.sizeGib.trim())
    .map((disk) => ({ sizeGib: Number(disk.sizeGib.trim()), ...tierField(disk.storageTier) }));
  const hasAdditionalDisksDefault =
    getCatalogFieldOverlay('spec.additional_disks', readCatalogFieldDefinitions(catalogItem), '')
      .defaultValue !== undefined;
  if (additionalDisks.length > 0 || hasAdditionalDisksDefault) {
    spec.additionalDisks = additionalDisks;
  }

  return {
    metadata: {
      name: values.metadata.name.trim(),
      project: values.metadata.project,
      ...(values.metadata.description?.trim()
        ? { description: values.metadata.description.trim() }
        : {}),
    },
    spec,
  };
};
