/** Default run strategy on create — VM starts immediately. */
export const VM_CREATE_RUN_STRATEGY = 'Always' as const;

export const RUN_STRATEGY_OPTIONS = [
  { value: 'Always', label: 'Always (start immediately)' },
  { value: 'Halted', label: 'Halted (start stopped)' },
  { value: 'RerunOnFailure', label: 'RerunOnFailure' },
  { value: 'Manual', label: 'Manual' },
] as const;

export type RunStrategy = (typeof RUN_STRATEGY_OPTIONS)[number]['value'];

export interface ComputeInstanceNetworkingValues {
  virtualNetworkId: string;
  subnetId: string;
  securityGroupIds: string[];
  /** Optional public IP pool ID — if set, a PublicIP is allocated and attached after VM creation */
  publicIPPoolId?: string;
}

export interface AdditionalDiskValue {
  sizeGib: string;
}

export interface NetworkAttachmentValue {
  virtualNetworkId: string;
  subnetId: string;
  securityGroupIds: string[];
}

export interface ComputeInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
    /** User-defined key-value tags (maps to metadata.labels on the resource) */
    labels: Record<string, string>;
  };
  spec: {
    sshKey: string;
    image: {
      sourceRef: string;
    };
    instanceType: string;
    userData: string;
    bootDisk: {
      sizeGib: string;
    };
    /** Additional block disks — proto-aligned: spec.additional_disks[].size_gib */
    additionalDisks: AdditionalDiskValue[];
    /** Windows guest OS — proto-aligned: spec.is_windows */
    isWindows: boolean;
    /** VM run strategy — proto-aligned: spec.run_strategy */
    runStrategy: string;
    networking: ComputeInstanceNetworkingValues;
    /** Additional NICs — each entry maps to a separate networkAttachment on the VM */
    additionalNetworkAttachments: NetworkAttachmentValue[];
    /** @predicted: metadata.project — OSAC-1064 */
    projectId?: string;
  };
}

export const CONFIGURATION_CATALOG_PATHS = [
  'spec.image.source_ref',
  'spec.user_data',
  'spec.boot_disk.size_gib',
] as const;
