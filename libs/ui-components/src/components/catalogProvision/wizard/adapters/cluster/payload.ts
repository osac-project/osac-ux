import { type MessageInitShape } from '@bufbuild/protobuf';

import { type ClusterCatalogItem, ClusterSchema } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { createEmptyNodeSetRow, emptyResourceSelectValue } from './fields';

export const createEmptyClusterValues = (): ClusterWizardValues => ({
  catalogItemId: '',
  metadata: { name: '', project: '', description: '' },
  spec: {
    sshPublicKeySecret: emptyResourceSelectValue(),
    pullSecretSecret: {
      name: '',
    },
    versionName: '',
    nodeSetRows: [createEmptyNodeSetRow()],
    network: {
      podCidr: '',
      serviceCidr: '',
    },
    useDefaultNetwork: true,
    networkAttachment: {
      virtualNetwork: emptyResourceSelectValue(),
      subnet: emptyResourceSelectValue(),
      securityGroups: [],
    },
    autoExternalIpAttachment: false,
  },
});

export const buildClusterCreatePayload = (
  values: ClusterWizardValues,
  catalogItem: ClusterCatalogItem,
): MessageInitShape<typeof ClusterSchema> => {
  const spec: MessageInitShape<typeof ClusterSchema>['spec'] = {
    catalogItem: {
      id: catalogItem.id,
    },
    pullSecretSecret: {
      name: values.spec.pullSecretSecret.name,
    },
  };

  const sshPublicKey = values.spec.sshPublicKeySecret.name.trim();
  if (sshPublicKey) {
    spec.sshPublicKey = sshPublicKey;
  }

  if (values.spec.versionName) {
    spec.version = { name: values.spec.versionName };
  }

  const nodeSets = Object.create(null) as Record<
    string,
    { hostType: { id: string }; size: number }
  >;
  for (const row of values.spec.nodeSetRows) {
    const nodeSetId = row.name.trim();
    const hostTypeId = row.hostType;
    const size = Number(row.size);
    if (!nodeSetId || !hostTypeId || !Number.isFinite(size) || size <= 0) {
      continue;
    }
    nodeSets[nodeSetId] = { hostType: { id: hostTypeId }, size };
  }
  if (Object.keys(nodeSets).length > 0) {
    spec.nodeSets = nodeSets;
  }

  const podCidr = values.spec.network.podCidr.trim();
  const serviceCidr = values.spec.network.serviceCidr.trim();
  if (podCidr || serviceCidr) {
    spec.network = {
      ...(podCidr ? { podCidr } : {}),
      ...(serviceCidr ? { serviceCidr } : {}),
    };
  }

  if (!values.spec.useDefaultNetwork) {
    const subnetId = values.spec.networkAttachment.subnet.id.trim();
    if (subnetId) {
      spec.networkAttachment = {
        subnet: { id: subnetId },
        securityGroups: values.spec.networkAttachment.securityGroups
          .filter((sg) => sg.id.trim())
          .map((sg) => ({ id: sg.id })),
      };
    }
  }

  if (values.spec.autoExternalIpAttachment) {
    spec.autoExternalIpAttachment = true;
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
