/**
 * In-memory mock data store for demo mode.
 * All routes from the public + private API surface are represented.
 * Data shapes follow the fulfillment-service proto definitions.
 */
import {
  BareMetalInstanceConditionType,
  BareMetalInstanceRunStrategy,
  BareMetalInstanceState,
  ClusterConditionType,
  ClusterState,
  ComputeInstanceConditionType,
  ComputeInstanceState,
  ConditionStatus,
  ProjectMembershipRole,
  ProjectMembershipState,
  ProjectState,
} from '@osac/types';
import type { ApiRoute } from '@osac/ui-components/api/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEMO_TENANT_ID = 'tenant-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ts = (offsetMinutes = 0) => new Date(Date.now() - offsetMinutes * 60_000).toISOString();

const metadata = (name: string, description = '', overrides: Record<string, unknown> = {}) => ({
  name,
  description,
  labels: {} as Record<string, string>,
  annotations: {} as Record<string, string>,
  creationTimestamp: ts(120),
  creator: 'demo-user',
  tenant: 'tenant-001',
  version: 1,
  ...overrides,
});

// ---------------------------------------------------------------------------
// Compute Instances
// ---------------------------------------------------------------------------

const computeInstances = [
  {
    id: 'vm-001',
    metadata: metadata('web-server-1', 'Primary web server', {
      labels: { env: 'production', app: 'web' },
      creator: 'alice@example.com',
      version: 3,
    }),
    spec: {
      image: { sourceType: 'apb', sourceRef: 'centos-stream-9' },
      cores: 2,
      memoryGib: 4,
      runStrategy: 'Always',
      instanceType: 'instance-type-small',
      catalogItem: 'ci-catalog-rhel9-small',
      bootDisk: { sizeGib: 50, storageClass: 'ssd' },
      additionalDisks: [
        { sizeGib: 100, storageClass: 'ssd' },
        { sizeGib: 200, storageClass: 'standard' },
      ],
      networkAttachments: [{ subnet: 'subnet-001', securityGroups: ['sg-001'] }],
      sshKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC3... alice@example.com',
      userData: '',
      restartRequestedAt: ts(25),
    },
    status: {
      state: ComputeInstanceState.RUNNING,
      internalIpAddress: '10.0.1.10',
      publicIpAddress: '203.0.113.10',
      hub: 'hub-prod-1',
      lastRestartedAt: ts(20),
      conditions: [
        {
          type: ComputeInstanceConditionType.READY,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(60),
        },
        {
          type: ComputeInstanceConditionType.PROVISIONED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(90),
        },
        {
          type: ComputeInstanceConditionType.CONFIGURATION_APPLIED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(85),
        },
      ],
    },
  },
  {
    id: 'vm-002',
    metadata: metadata('db-server-1', 'Primary database server', {
      labels: { env: 'production', app: 'database' },
      creator: 'bob@example.com',
      version: 1,
    }),
    spec: {
      image: { sourceType: 'apb', sourceRef: 'rhel-9' },
      cores: 4,
      memoryGib: 16,
      runStrategy: 'Always',
      instanceType: 'instance-type-medium',
      catalogItem: 'ci-catalog-rhel9-medium',
      bootDisk: { sizeGib: 100, storageClass: 'ssd' },
      additionalDisks: [
        { sizeGib: 500, storageClass: 'nvme' },
        { sizeGib: 500, storageClass: 'nvme' },
      ],
      networkAttachments: [{ subnet: 'subnet-001', securityGroups: ['sg-001', 'sg-002'] }],
      sshKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC4... bob@example.com',
      userData: '',
    },
    status: {
      state: ComputeInstanceState.RUNNING,
      internalIpAddress: '10.0.1.11',
      publicIpAddress: '',
      hub: 'hub-prod-1',
      conditions: [
        {
          type: ComputeInstanceConditionType.READY,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(45),
        },
        {
          type: ComputeInstanceConditionType.PROVISIONED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(80),
        },
        {
          type: ComputeInstanceConditionType.CONFIGURATION_APPLIED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(75),
        },
      ],
    },
  },
  {
    id: 'vm-003',
    metadata: metadata('dev-workstation-1', 'Developer workstation', {
      labels: { env: 'development', owner: 'carol' },
      creator: 'carol@example.com',
      version: 2,
    }),
    spec: {
      image: { sourceType: 'apb', sourceRef: 'fedora-39' },
      cores: 8,
      memoryGib: 32,
      runStrategy: 'Halted',
      instanceType: 'instance-type-large',
      catalogItem: 'ci-catalog-fedora-large',
      bootDisk: { sizeGib: 200, storageClass: 'standard' },
      additionalDisks: [{ sizeGib: 250, storageClass: 'standard' }],
      networkAttachments: [{ subnet: 'subnet-002', securityGroups: ['sg-001'] }],
      sshKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC5... carol@example.com',
      userData: '#!/bin/bash\n# Dev workstation bootstrap\nyum install -y git vim tmux',
    },
    status: {
      state: ComputeInstanceState.STOPPED,
      internalIpAddress: '10.0.2.20',
      publicIpAddress: '',
      hub: 'hub-dev-1',
      conditions: [
        {
          type: ComputeInstanceConditionType.READY,
          status: ConditionStatus.FALSE,
          reason: 'Halted',
          message: 'VM is stopped',
          lastTransitionTime: ts(30),
        },
        {
          type: ComputeInstanceConditionType.PROVISIONED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(200),
        },
        {
          type: ComputeInstanceConditionType.CONFIGURATION_APPLIED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(195),
        },
      ],
    },
  },
  {
    id: 'vm-004',
    metadata: metadata('test-runner-1', 'CI test runner', {
      labels: { env: 'ci', app: 'testing' },
      creator: 'ci-system@example.com',
      version: 1,
    }),
    spec: {
      image: { sourceType: 'apb', sourceRef: 'centos-stream-9' },
      cores: 2,
      memoryGib: 8,
      runStrategy: 'Always',
      instanceType: 'instance-type-small',
      catalogItem: 'ci-catalog-rhel9-small',
      bootDisk: { sizeGib: 50, storageClass: 'standard' },
      additionalDisks: [{ sizeGib: 100, storageClass: 'nvme' }],
      networkAttachments: [{ subnet: 'subnet-001', securityGroups: ['sg-001'] }],
      sshKey: '',
      userData: '#!/bin/bash\napt-get update && apt-get install -y build-essential',
    },
    status: {
      state: ComputeInstanceState.STARTING,
      internalIpAddress: '',
      publicIpAddress: '',
      hub: 'hub-prod-1',
      conditions: [
        {
          type: ComputeInstanceConditionType.READY,
          status: ConditionStatus.FALSE,
          reason: 'Provisioning',
          message: 'VM is being provisioned',
          lastTransitionTime: ts(5),
        },
        {
          type: ComputeInstanceConditionType.PROVISIONED,
          status: ConditionStatus.FALSE,
          reason: 'Provisioning',
          message: '',
          lastTransitionTime: ts(5),
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Compute Instance Templates
// ---------------------------------------------------------------------------

const computeInstanceTemplates = [
  {
    id: 'ci-template-rhel9',
    metadata: metadata('rhel9-standard', 'Standard RHEL 9 template'),
    title: 'RHEL 9 Standard',
    description: 'Red Hat Enterprise Linux 9 standard template.',
    specDefaults: {
      image: { sourceType: 'apb', sourceRef: 'quay.io/containerdisks/rhel:9.4' },
      cores: 2,
      memoryGib: 4,
      bootDisk: { sizeGib: 50, storageClass: 'standard' },
      runStrategy: 'Always',
      instanceType: 'instance-type-small',
    },
    parameters: [],
  },
  {
    id: 'ci-template-fedora',
    metadata: metadata('fedora-dev', 'Fedora developer template'),
    title: 'Fedora Developer',
    description: 'Fedora Linux with development tools pre-installed.',
    specDefaults: {
      image: { sourceType: 'apb', sourceRef: 'quay.io/containerdisks/fedora:40' },
      cores: 4,
      memoryGib: 8,
      bootDisk: { sizeGib: 100, storageClass: 'standard' },
      runStrategy: 'Always',
      instanceType: 'instance-type-medium',
    },
    parameters: [],
  },
  {
    id: 'ci-template-windows-server',
    metadata: metadata('windows-server-2022', 'Windows Server 2022 template'),
    title: 'Windows Server 2022',
    description: 'Microsoft Windows Server 2022 Datacenter edition.',
    specDefaults: {
      image: { sourceType: 'apb', sourceRef: 'quay.io/containerdisks/windows:2022' },
      cores: 4,
      memoryGib: 16,
      bootDisk: { sizeGib: 128, storageClass: 'ssd' },
      runStrategy: 'Always',
      instanceType: 'instance-type-large',
    },
    parameters: [],
  },
];

// ---------------------------------------------------------------------------
// Compute Instance Catalog Items
// ---------------------------------------------------------------------------

const computeInstanceCatalogItems = [
  {
    id: 'ci-catalog-rhel9-small',
    metadata: metadata('rhel9-small', 'RHEL 9 small', {
      labels: { os: 'rhel', arch: 'x86_64', price_per_hour: '0.15' },
    }),
    title: 'RHEL 9 — Small',
    description:
      'Red Hat Enterprise Linux 9 with 2 vCPUs and 4 GiB RAM. Ideal for lightweight web services and APIs.',
    template: 'ci-template-rhel9',
    published: true,
    tenant: '',
    allowed_tenants: [],
    field_definitions: [
      {
        path: 'spec.image.source_ref',
        display_name: 'Image',
        editable: false,
        default: 'quay.io/containerdisks/rhel:9.4',
      },
      { path: 'cores', display_name: 'vCPUs', editable: false, default: 2 },
      { path: 'memory_gib', display_name: 'Memory (GiB)', editable: false, default: 4 },
      {
        path: 'boot_disk.size_gib',
        display_name: 'Boot disk (GiB)',
        editable: true,
        default: 50,
        validation_schema: '{"type":"integer","minimum":20,"maximum":500}',
      },
      {
        path: 'ssh_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
    ],
  },
  {
    id: 'ci-catalog-rhel9-medium',
    metadata: metadata('rhel9-medium', 'RHEL 9 medium', {
      labels: { os: 'rhel', arch: 'x86_64', price_per_hour: '0.30' },
    }),
    title: 'RHEL 9 — Medium',
    description:
      'Red Hat Enterprise Linux 9 with 4 vCPUs and 16 GiB RAM. Suitable for databases and application servers.',
    template: 'ci-template-rhel9',
    published: true,
    tenant: '',
    allowed_tenants: [],
    field_definitions: [
      {
        path: 'spec.image.source_ref',
        display_name: 'Image',
        editable: false,
        default: 'quay.io/containerdisks/rhel:9.4',
      },
      { path: 'cores', display_name: 'vCPUs', editable: false, default: 4 },
      { path: 'memory_gib', display_name: 'Memory (GiB)', editable: false, default: 16 },
      {
        path: 'boot_disk.size_gib',
        display_name: 'Boot disk (GiB)',
        editable: true,
        default: 100,
        validation_schema: '{"type":"integer","minimum":50,"maximum":1000}',
      },
      {
        path: 'ssh_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
    ],
  },
  {
    id: 'ci-catalog-fedora-large',
    metadata: metadata('fedora-large', 'Fedora large developer', {
      labels: { os: 'fedora', arch: 'aarch64', price_per_hour: '0.65' },
    }),
    title: 'Fedora Developer — Large',
    description:
      'Fedora Linux with 8 vCPUs and 32 GiB RAM for high-performance development workstations.',
    template: 'ci-template-fedora',
    published: true,
    tenant: 'tenant-001',
    allowed_tenants: [DEMO_TENANT_ID],
    field_definitions: [
      {
        path: 'spec.image.source_ref',
        display_name: 'Image',
        editable: false,
        default: 'quay.io/containerdisks/fedora:40',
      },
      { path: 'cores', display_name: 'vCPUs', editable: false, default: 8 },
      { path: 'memory_gib', display_name: 'Memory (GiB)', editable: false, default: 32 },
      {
        path: 'boot_disk.size_gib',
        display_name: 'Boot disk (GiB)',
        editable: true,
        default: 200,
        validation_schema: '{"type":"integer","minimum":100,"maximum":2000}',
      },
      {
        path: 'ssh_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
    ],
  },
  // Tenant-scoped customization: RHEL 9 Small with org defaults pinned
  {
    id: 'ci-catalog-rhel9-small-tenant',
    metadata: metadata('rhel9-small-org', 'RHEL 9 Small — Org default', {
      labels: { os: 'rhel', arch: 'x86_64', price_per_hour: '0.15' },
      tenant: 'tenant-001',
    }),
    title: 'RHEL 9 — Small (Org default)',
    description:
      'Org-customized RHEL 9 Small with pre-set SSH key and 80 GiB boot disk for all team members.',
    template: 'ci-template-rhel9',
    published: true,
    tenant: 'tenant-001',
    field_definitions: [
      {
        path: 'spec.image.source_ref',
        display_name: 'Image',
        editable: false,
        default: 'quay.io/containerdisks/rhel:9.4',
      },
      { path: 'cores', display_name: 'vCPUs', editable: false, default: 2 },
      { path: 'memory_gib', display_name: 'Memory (GiB)', editable: false, default: 4 },
      {
        path: 'boot_disk.size_gib',
        display_name: 'Boot disk (GiB)',
        editable: true,
        default: 80,
        validation_schema: '{"type":"integer","minimum":20,"maximum":500}',
      },
      {
        path: 'ssh_key',
        display_name: 'SSH Public Key',
        editable: true,
        default: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... team@acme-corp.io',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

const clusters = [
  {
    id: 'cluster-001',
    metadata: metadata('dev-cluster', 'Development OpenShift cluster', {
      labels: { env: 'development', version: 'ocp-4.16' },
      creator: 'alice@example.com',
      version: 2,
    }),
    spec: {
      catalogItem: 'cluster-catalog-ocp416',
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.16.0-x86_64',
      network: { podCidr: '10.128.0.0/14', serviceCidr: '172.30.0.0/16' },
      nodeSets: {
        workers: { hostType: 'instance-type-medium', size: 3 },
        infra: { hostType: 'instance-type-large', size: 3 },
      },
      pullSecret: '{"auths":{}}',
      sshPublicKey: 'ssh-rsa AAAA... demo@osac',
    },
    status: {
      state: ClusterState.READY,
      apiUrl: 'https://api.dev-cluster.example.com:6443',
      consoleUrl: 'https://console-openshift-console.apps.dev-cluster.example.com',
      hub: 'hub-prod-1',
      nodeSets: {
        workers: { hostType: 'instance-type-medium', size: 3 },
        infra: { hostType: 'instance-type-large', size: 3 },
      },
      conditions: [
        {
          type: ClusterConditionType.READY,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(60),
        },
        {
          type: ClusterConditionType.PROGRESSING,
          status: ConditionStatus.FALSE,
          reason: '',
          message: '',
          lastTransitionTime: ts(90),
        },
      ],
    },
  },
  {
    id: 'cluster-002',
    metadata: metadata('prod-cluster', 'Production OpenShift cluster', {
      labels: { env: 'production', version: 'ocp-4.17', tier: 'critical' },
      creator: 'alice@example.com',
      version: 5,
    }),
    spec: {
      catalogItem: 'cluster-catalog-ocp417',
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.17.0-x86_64',
      network: { podCidr: '10.128.0.0/14', serviceCidr: '172.30.0.0/16' },
      nodeSets: {
        workers: { hostType: 'instance-type-large', size: 5 },
        infra: { hostType: 'instance-type-large', size: 3 },
      },
      pullSecret: '{"auths":{}}',
      sshPublicKey: 'ssh-rsa AAAA... prod@osac',
    },
    status: {
      state: ClusterState.READY,
      apiUrl: 'https://api.prod-cluster.example.com:6443',
      consoleUrl: 'https://console-openshift-console.apps.prod-cluster.example.com',
      hub: 'hub-prod-1',
      nodeSets: {
        workers: { hostType: 'instance-type-large', size: 5 },
        infra: { hostType: 'instance-type-large', size: 3 },
      },
      conditions: [
        {
          type: ClusterConditionType.READY,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(120),
        },
        {
          type: ClusterConditionType.PROGRESSING,
          status: ConditionStatus.FALSE,
          reason: '',
          message: '',
          lastTransitionTime: ts(180),
        },
      ],
    },
  },
  {
    id: 'cluster-003',
    metadata: metadata('staging-cluster', 'Staging OpenShift cluster', {
      labels: { env: 'staging', version: 'ocp-4.16' },
      creator: 'bob@example.com',
      version: 1,
    }),
    spec: {
      catalogItem: 'cluster-catalog-ocp416',
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.16.0-x86_64',
      network: { podCidr: '10.132.0.0/14', serviceCidr: '172.31.0.0/16' },
      nodeSets: { workers: { hostType: 'instance-type-medium', size: 2 } },
      pullSecret: '{"auths":{}}',
      sshPublicKey: 'ssh-rsa AAAA... staging@osac',
    },
    status: {
      state: ClusterState.PROGRESSING,
      apiUrl: '',
      consoleUrl: '',
      hub: 'hub-prod-1',
      nodeSets: { workers: { hostType: 'instance-type-medium', size: 2 } },
      conditions: [
        {
          type: ClusterConditionType.READY,
          status: ConditionStatus.FALSE,
          reason: 'Provisioning',
          message: 'Cluster is being provisioned',
          lastTransitionTime: ts(10),
        },
        {
          type: ClusterConditionType.PROGRESSING,
          status: ConditionStatus.TRUE,
          reason: 'Provisioning',
          message: 'Installing OpenShift',
          lastTransitionTime: ts(10),
        },
      ],
    },
  },
];

// ---------------------------------------------------------------------------
// Cluster Templates
// ---------------------------------------------------------------------------

const clusterTemplates = [
  {
    id: 'cluster-template-ocp416',
    metadata: metadata('ocp416-3node', 'OCP 4.16 3-node template'),
    title: 'OpenShift 4.16 — 3-node',
    description: 'Standard OpenShift 4.16 cluster with a 3-node control plane and 3 worker nodes.',
    nodeSets: {
      workers: { hostType: 'host-type-standard-32', size: 3 },
    },
    specDefaults: {
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.16.0-x86_64',
      network: { podCidr: '10.128.0.0/14', serviceCidr: '172.30.0.0/16' },
    },
    parameters: [],
  },
  {
    id: 'cluster-template-ocp417',
    metadata: metadata('ocp417-ha', 'OCP 4.17 HA template'),
    title: 'OpenShift 4.17 — HA',
    description: 'High-availability OpenShift 4.17 cluster with 5 worker nodes and 3 infra nodes.',
    nodeSets: {
      workers: { hostType: 'host-type-standard-32', size: 5 },
      infra: { hostType: 'host-type-standard-32', size: 3 },
    },
    specDefaults: {
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.17.0-x86_64',
      network: { podCidr: '10.128.0.0/14', serviceCidr: '172.30.0.0/16' },
    },
    parameters: [],
  },
  {
    id: 'cluster-template-ai-grid',
    metadata: metadata('ai-grid-ocp417', 'AI Grid GPU cluster template', {
      labels: { workload: 'ai', gpu: 'true' },
    }),
    title: 'AI Grid — GPU Cluster',
    description:
      'OpenShift cluster with dedicated GPU nodes for AI/ML training and inference. Includes IBM MI300X accelerator nodes alongside standard control-plane nodes.',
    nodeSets: {
      control: { hostType: 'host-type-standard-32', size: 3 },
      gpu: { hostType: 'host-type-ibm-mi300x', size: 4 },
    },
    specDefaults: {
      releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.17.0-x86_64',
      network: { podCidr: '10.128.0.0/14', serviceCidr: '172.30.0.0/16' },
    },
    parameters: [
      {
        name: 'gpu_node_count',
        title: 'GPU node count',
        description: 'Number of IBM MI300X GPU nodes',
        required: false,
        type: 'type.googleapis.com/google.protobuf.Int32Value',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Cluster Catalog Items
// ---------------------------------------------------------------------------

const clusterCatalogItems = [
  {
    id: 'cluster-catalog-ocp416',
    metadata: metadata('ocp-4-16', '', {
      labels: {
        platform: 'openshift',
        version: '4.16',
        os: 'rhcos',
        arch: 'x86_64',
        price_per_hour: '1.20',
      },
    }),
    title: 'OpenShift Container Platform 4.16',
    description:
      'Managed OpenShift 4.16 cluster with a 3-node control plane. Suitable for production workloads requiring a stable, supported Kubernetes distribution.',
    template: 'cluster-template-ocp416',
    published: true,
    tenant: '',
    allowed_tenants: [],
    field_definitions: [
      {
        path: 'ssh_public_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'pull_secret',
        display_name: 'Pull Secret',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'worker_count',
        display_name: 'Worker Node Count',
        editable: true,
        default: 3,
        validation_schema: '{"type":"integer","minimum":1,"maximum":20}',
      },
    ],
  },
  {
    id: 'cluster-catalog-ocp417',
    metadata: metadata('ocp-4-17', '', {
      labels: {
        platform: 'openshift',
        version: '4.17',
        os: 'rhcos',
        arch: 'x86_64',
        price_per_hour: '1.20',
      },
    }),
    title: 'OpenShift Container Platform 4.17',
    description:
      'Managed OpenShift 4.17 cluster on the latest stable release. Includes enhanced security features and improved operator lifecycle management.',
    template: 'cluster-template-ocp417',
    published: true,
    tenant: '',
    allowed_tenants: [],
    field_definitions: [
      {
        path: 'ssh_public_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'pull_secret',
        display_name: 'Pull Secret',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'worker_count',
        display_name: 'Worker Node Count',
        editable: true,
        default: 3,
        validation_schema: '{"type":"integer","minimum":1,"maximum":20}',
      },
    ],
  },
  {
    id: 'cluster-catalog-ai-grid',
    metadata: metadata('ai-grid-gpu-cluster', '', {
      labels: { workload: 'ai', gpu: 'true', arch: 'x86_64', os: 'rhcos', price_per_hour: '18.20' },
    }),
    title: 'AI Grid — GPU Cluster',
    description:
      'OpenShift cluster with IBM MI300X GPU nodes for AI/ML training workloads. Control plane runs on standard nodes; GPU worker nodes (MI300X) are sized for large-scale LLM training and inference.',
    template: 'cluster-template-ai-grid',
    published: true,
    tenant: '',
    allowed_tenants: [DEMO_TENANT_ID],
    field_definitions: [
      {
        path: 'ssh_public_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'pull_secret',
        display_name: 'Pull Secret',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'spec.node_sets.gpu.size',
        display_name: 'GPU node count',
        editable: true,
        default: 4,
        validation_schema: '{"type":"integer","minimum":1,"maximum":16}',
      },
    ],
  },
  // Tenant-scoped customization: OCP 4.17 with org SSH key and pull secret pinned
  {
    id: 'cluster-catalog-ocp417-tenant',
    metadata: metadata('ocp-4-17-org', '', {
      labels: {
        platform: 'openshift',
        version: '4.17',
        os: 'rhcos',
        arch: 'x86_64',
        price_per_hour: '1.20',
      },
      tenant: 'tenant-001',
    }),
    title: 'OpenShift 4.17 — Org default',
    description:
      'Org-customized OCP 4.17 with pre-set SSH key, pull secret, and default worker count for team onboarding.',
    template: 'cluster-template-ocp417',
    published: true,
    tenant: 'tenant-001',
    field_definitions: [
      {
        path: 'ssh_public_key',
        display_name: 'SSH Public Key',
        editable: true,
        default: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... team@acme-corp.io',
      },
      {
        path: 'pull_secret',
        display_name: 'Pull Secret',
        editable: true,
        default: '{"auths":{"registry.redhat.io":{"auth":"<org-token>"}}}',
      },
      {
        path: 'worker_count',
        display_name: 'Worker Node Count',
        editable: true,
        default: 5,
        validation_schema: '{"type":"integer","minimum":1,"maximum":20}',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Instance Types
// ---------------------------------------------------------------------------

const instanceTypes = [
  {
    id: 'instance-type-small',
    metadata: metadata('small', 'Small instance type', { labels: { price_per_hour: '0.05' } }),
    spec: { cores: 2, memoryGib: 4, storageGib: 50 },
    status: { state: 1 /* AVAILABLE */ },
  },
  {
    id: 'instance-type-medium',
    metadata: metadata('medium', 'Medium instance type', { labels: { price_per_hour: '0.12' } }),
    spec: { cores: 4, memoryGib: 16, storageGib: 100 },
    status: { state: 1 },
  },
  {
    id: 'instance-type-large',
    metadata: metadata('large', 'Large instance type', { labels: { price_per_hour: '0.28' } }),
    spec: { cores: 8, memoryGib: 32, storageGib: 200 },
    status: { state: 1 },
  },
  {
    id: 'instance-type-xlarge',
    metadata: metadata('xlarge', 'Extra-large instance type', {
      labels: { price_per_hour: '0.56' },
    }),
    spec: { cores: 16, memoryGib: 64, storageGib: 500 },
    status: { state: 1 },
  },
];

// ---------------------------------------------------------------------------
// Networking
// ---------------------------------------------------------------------------

// Protocol enum values: UNSPECIFIED=0, TCP=1, UDP=2, ICMP=3, ALL=4
const virtualNetworks = [
  {
    id: 'vnet-001',
    metadata: metadata('production-network', 'Main production network', {
      labels: { region: 'us-east-1' },
    }),
    spec: { networkClass: 'nc-001', ipv4Cidr: '10.0.0.0/8' },
    status: { state: 2 /* READY */, hub: 'hub-prod-1' },
  },
  {
    id: 'vnet-002',
    metadata: metadata('development-network', 'Development network', {
      labels: { region: 'eu-west-2' },
    }),
    spec: { networkClass: 'nc-001', ipv4Cidr: '10.1.0.0/16' },
    status: { state: 2, hub: 'hub-dev-1' },
  },
];

const subnets = [
  {
    id: 'subnet-001',
    metadata: metadata('prod-subnet-a', 'Production subnet A'),
    spec: { virtualNetwork: 'vnet-001', ipv4Cidr: '10.0.1.0/24' },
    status: { state: 2 /* READY */, hub: 'hub-prod-1' },
  },
  {
    id: 'subnet-002',
    metadata: metadata('prod-subnet-b', 'Production subnet B'),
    spec: { virtualNetwork: 'vnet-001', ipv4Cidr: '10.0.2.0/24', ipv6Cidr: 'fd00::/64' },
    status: { state: 2, hub: 'hub-prod-1' },
  },
  {
    id: 'subnet-003',
    metadata: metadata('dev-subnet-a', 'Development subnet A'),
    spec: { virtualNetwork: 'vnet-002', ipv4Cidr: '10.1.1.0/24' },
    status: { state: 2, hub: 'hub-dev-1' },
  },
];

const securityGroups = [
  {
    id: 'sg-001',
    metadata: metadata('web-sg', 'Web server security group'),
    spec: {
      virtualNetwork: 'vnet-001',
      ingress: [
        { protocol: 1 /* TCP */, portFrom: 80, portTo: 80, ipv4Cidr: '0.0.0.0/0' },
        { protocol: 1, portFrom: 443, portTo: 443, ipv4Cidr: '0.0.0.0/0' },
        { protocol: 1, portFrom: 22, portTo: 22, ipv4Cidr: '10.0.0.0/8' },
        { protocol: 3 /* ICMP */, ipv4Cidr: '0.0.0.0/0' },
      ],
      egress: [{ protocol: 4 /* ALL */, ipv4Cidr: '0.0.0.0/0' }],
    },
    status: { state: 2 /* READY */ },
  },
  {
    id: 'sg-002',
    metadata: metadata('db-sg', 'Database security group'),
    spec: {
      virtualNetwork: 'vnet-001',
      ingress: [
        { protocol: 1, portFrom: 5432, portTo: 5432, ipv4Cidr: '10.0.0.0/8' },
        { protocol: 1, portFrom: 3306, portTo: 3306, ipv4Cidr: '10.0.0.0/8' },
        { protocol: 1, portFrom: 6379, portTo: 6379, ipv4Cidr: '10.0.1.0/24' },
      ],
      egress: [{ protocol: 4, ipv4Cidr: '0.0.0.0/0' }],
    },
    status: { state: 2 },
  },
  {
    id: 'sg-003',
    metadata: metadata('dev-sg', 'Development security group'),
    spec: {
      virtualNetwork: 'vnet-002',
      ingress: [
        { protocol: 1, portFrom: 22, portTo: 22, ipv4Cidr: '0.0.0.0/0' },
        { protocol: 1, portFrom: 3000, portTo: 3000, ipv4Cidr: '0.0.0.0/0' },
        { protocol: 2 /* UDP */, portFrom: 53, portTo: 53, ipv4Cidr: '0.0.0.0/0' },
      ],
      egress: [{ protocol: 4, ipv4Cidr: '0.0.0.0/0' }],
    },
    status: { state: 2 },
  },
];

const networkClasses = [
  {
    id: 'nc-001',
    metadata: metadata('default-network-class', 'Default network class'),
    title: 'Default (OVN)',
    description: 'Standard OVN-based network class for tenant workloads.',
    capabilities: { supportsIpv4: true, supportsIpv6: true, supportsDualStack: true },
    status: { state: 2, hub: 'hub-prod-1' },
    isDefault: true,
  },
  {
    id: 'nc-002',
    metadata: metadata('physical-network-class', 'Physical network class'),
    title: 'Physical',
    description: 'Hardware-backed network class with direct physical interface access.',
    capabilities: { supportsIpv4: true, supportsIpv6: false, supportsDualStack: false },
    status: { state: 2, hub: 'hub-prod-1' },
    isDefault: false,
  },
];

// ---------------------------------------------------------------------------
// IP Management
// ---------------------------------------------------------------------------

const publicIpPools = [
  {
    id: 'pip-pool-001',
    metadata: {
      ...metadata('public-ip-pool-us-east', 'US East public IP pool'),
      tenant: 'tenant-001',
    },
    spec: { ipFamily: 1 /* IPv4 */ },
    status: { available: 242n },
  },
  {
    id: 'pip-pool-002',
    metadata: { ...metadata('public-ip-pool-acme', 'Acme public IP pool'), tenant: 'tenant-002' },
    spec: { ipFamily: 1 /* IPv4 */ },
    status: { available: 50n },
  },
];

const publicIps = [
  {
    id: 'pip-001',
    metadata: metadata('web-server-pip', 'Web server public IP'),
    spec: { pool: 'pip-pool-001' },
    status: { pool: 'pip-pool-001', address: '203.0.113.10', attached: true },
  },
  {
    id: 'pip-002',
    metadata: metadata('unattached-pip', 'Unattached public IP'),
    spec: { pool: 'pip-pool-001' },
    status: { pool: 'pip-pool-001', address: '203.0.113.11', attached: false },
  },
];

const publicIpAttachments = [
  {
    id: 'pipa-001',
    metadata: metadata('web-pip-attachment', 'Web server IP attachment'),
    spec: { publicIp: 'pip-001', target: { case: 'computeInstance', value: 'vm-001' } },
    status: { publicIpAddress: '203.0.113.10' },
  },
];

const externalIpPools = [
  {
    id: 'eip-pool-001',
    metadata: {
      ...metadata('external-ip-pool-us-east', 'US East external IP pool'),
      tenant: 'tenant-001',
    },
    spec: { ipFamily: 1 /* IPv4 */, cidr: '198.51.100.0/24', zone: 'us-east-1' },
    status: { available: 251n },
  },
  {
    id: 'eip-pool-002',
    metadata: {
      ...metadata('external-ip-pool-acme', 'Acme external IP pool'),
      tenant: 'tenant-002',
    },
    spec: { ipFamily: 1 /* IPv4 */, cidr: '203.0.113.0/24', zone: 'eu-west-1' },
    status: { available: 100n },
  },
];

const externalIps = [
  {
    id: 'eip-001',
    metadata: metadata('cluster-external-ip', 'Cluster external IP'),
    spec: { pool: 'eip-pool-001' },
    status: { pool: 'eip-pool-001', address: '198.51.100.10', attached: true },
  },
  {
    id: 'eip-002',
    metadata: metadata('unattached-eip', 'Unattached external IP'),
    spec: { pool: 'eip-pool-001' },
    status: { pool: 'eip-pool-001', address: '198.51.100.11', attached: false },
  },
];

const externalIpAttachments = [
  {
    id: 'eipa-001',
    metadata: metadata('cluster-eip-attachment', 'Cluster external IP attachment'),
    spec: { externalIp: 'eip-001', target: { case: 'cluster', value: 'cluster-001' } },
    status: { externalIpAddress: '198.51.100.10' },
  },
];

// ---------------------------------------------------------------------------
// Bare Metal
// ---------------------------------------------------------------------------

const baremetalInstances = [
  {
    id: 'bm-001',
    metadata: metadata('bare-metal-worker-1', 'Production bare metal worker', {
      labels: { env: 'production', role: 'worker' },
      creator: 'alice@example.com',
    }),
    spec: {
      catalogItem: 'bm-catalog-standard',
      sshPublicKey: 'ssh-rsa AAAA... alice@example.com',
      userData: '',
      runStrategy: BareMetalInstanceRunStrategy.ALWAYS,
      restartTrigger: 0,
    },
    status: {
      state: BareMetalInstanceState.RUNNING,
      restartTrigger: 0,
      hub: 'hub-prod-1',
      conditions: [
        {
          type: BareMetalInstanceConditionType.PROVISIONED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(180),
        },
        {
          type: BareMetalInstanceConditionType.CONFIGURATION_APPLIED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(170),
        },
        {
          type: BareMetalInstanceConditionType.READY,
          status: ConditionStatus.TRUE,
          reason: '',
          message: 'Machine is available and assigned to the tenant.',
          lastTransitionTime: ts(160),
        },
      ],
    },
  },
  {
    id: 'bm-002',
    metadata: metadata('bare-metal-worker-2', 'Halted bare metal worker', {
      labels: { env: 'development', role: 'worker' },
      creator: 'bob@example.com',
    }),
    spec: {
      catalogItem: 'bm-catalog-gpu',
      sshPublicKey: 'ssh-rsa AAAA... bob@example.com',
      userData: '#!/bin/bash\necho "hello"',
      runStrategy: BareMetalInstanceRunStrategy.HALTED,
      restartTrigger: 2,
    },
    status: {
      state: BareMetalInstanceState.STOPPED,
      restartTrigger: 2,
      hub: 'hub-dev-1',
      conditions: [
        {
          type: BareMetalInstanceConditionType.PROVISIONED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(300),
        },
        {
          type: BareMetalInstanceConditionType.CONFIGURATION_APPLIED,
          status: ConditionStatus.TRUE,
          reason: '',
          message: '',
          lastTransitionTime: ts(290),
        },
        {
          type: BareMetalInstanceConditionType.READY,
          status: ConditionStatus.FALSE,
          reason: 'Halted',
          message: 'Instance is powered off.',
          lastTransitionTime: ts(30),
        },
        {
          type: BareMetalInstanceConditionType.RESTART_REQUIRED,
          status: ConditionStatus.FALSE,
          reason: '',
          message: '',
          lastTransitionTime: ts(30),
        },
      ],
    },
  },
];

const baremetalInstanceTemplates = [
  {
    id: 'bm-template-standard',
    metadata: metadata('bm-standard', 'Standard bare metal template'),
    title: 'Standard Bare Metal',
    description: 'Standard bare metal provisioning template with default host type.',
    specDefaults: { hostType: 'host-type-standard' },
    parameters: [],
  },
  {
    id: 'bm-template-gpu',
    metadata: metadata('bm-gpu', 'GPU bare metal template', {
      labels: { gpu: 'true' },
    }),
    title: 'GPU Bare Metal',
    description: 'GPU-accelerated bare metal provisioning template using IBM MI300X host type.',
    specDefaults: { hostType: 'host-type-ibm-mi300x' },
    parameters: [],
  },
];

const baremetalInstanceCatalogItems = [
  {
    id: 'bm-catalog-standard',
    metadata: metadata('bm-standard-catalog', 'Standard bare metal catalog item', {
      labels: { os: 'rhel', arch: 'x86_64', price_per_hour: '0.40' },
    }),
    title: 'Bare Metal Standard',
    description:
      'Standard bare metal server with 32-core CPU, 128 GiB RAM, and high-performance NVMe storage.',
    template: 'bm-template-standard',
    published: true,
    tenant: '',
    allowed_tenants: [],
    field_definitions: [
      {
        path: 'ssh_public_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
    ],
  },
  {
    id: 'bm-catalog-gpu',
    metadata: metadata('bm-gpu-catalog', 'GPU-accelerated bare metal catalog item', {
      labels: { os: 'rhel', arch: 'aarch64', workload: 'ai', price_per_hour: '4.50' },
    }),
    title: 'Bare Metal GPU',
    description:
      'GPU-accelerated bare metal server with 48-core CPU, 256 GiB RAM, and 4x NVIDIA A100 GPUs. Ideal for ML training and HPC workloads.',
    template: 'bm-template-standard',
    published: true,
    tenant: '',
    allowed_tenants: [DEMO_TENANT_ID],
    field_definitions: [
      {
        path: 'ssh_public_key',
        display_name: 'SSH Public Key',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
    ],
  },
];

const hostTypes = [
  {
    id: 'host-type-standard-32',
    metadata: metadata('standard-32', 'Standard x86 server — 32 core / 128 GiB', {
      labels: { price_per_hour: '0.40' },
    }),
    title: 'Standard x86 — 32 core',
    description:
      'General-purpose x86 server with 32 cores, 128 GiB RAM, and 2 TiB NVMe storage. Suitable for web and application workloads.',
  },
  {
    id: 'host-type-standard',
    metadata: metadata('standard', 'Standard host type', {
      labels: { price_per_hour: '0.40' },
    }),
    title: 'Standard',
    description: 'Standard bare metal server with 32-core CPU, 128 GiB RAM.',
  },
  {
    id: 'host-type-ibm-mi300x',
    metadata: metadata('ibm-mi300x', 'IBM MI300X GPU server', {
      labels: { price_per_hour: '4.50', gpu: 'true', gpu_model: 'MI300X', gpu_count: '8' },
    }),
    title: 'IBM MI300X — GPU',
    description:
      'High-performance AI/ML accelerator node: 192 cores, 1.5 TiB RAM, 8× AMD MI300X GPUs. Optimised for LLM training and inference workloads.',
  },
  {
    id: 'host-type-acme-h100',
    metadata: metadata('acme-h100', 'ACME H100 GPU server', {
      labels: { price_per_hour: '2.80', gpu: 'true', gpu_model: 'H100', gpu_count: '4' },
    }),
    title: 'ACME H100 — GPU',
    description:
      'NVIDIA H100-accelerated node: 96 cores, 768 GiB RAM, 4× H100 SXM GPUs. Suitable for ML training, simulation, and rendering.',
  },
];

// ---------------------------------------------------------------------------
// Identity / Tenant / RBAC
// ---------------------------------------------------------------------------

const tenants = [
  {
    id: 'tenant-001',
    metadata: metadata('demo-tenant', 'Demo tenant organization'),
    spec: { domains: ['example.com'] },
  },
  {
    id: 'tenant-002',
    metadata: metadata('acme', 'Acme Corporation'),
    spec: { domains: ['acme.com'] },
  },
];

const organizations = [
  {
    id: 'org-001',
    metadata: metadata('demo-org', 'Demo organization'),
    spec: { displayName: 'Demo Organization', adminEmail: 'admin@example.com' },
    status: { state: 2 /* SYNCED */ },
  },
  {
    id: 'org-002',
    metadata: metadata('acme-org', 'Acme Corporation'),
    spec: { displayName: 'Acme Corporation', adminEmail: 'admin@acme.com' },
    status: { state: 2 },
  },
];

const projects = [
  {
    id: 'project-001',
    metadata: metadata('production', 'Production project', { labels: { env: 'production' } }),
    spec: { title: 'Production', description: 'Production workloads' },
    status: { state: ProjectState.ACTIVE },
  },
  {
    id: 'project-002',
    metadata: metadata('development', 'Development project', { labels: { env: 'development' } }),
    spec: { title: 'Development', description: 'Development workloads' },
    status: { state: ProjectState.ACTIVE },
  },
  {
    id: 'project-003',
    metadata: metadata('staging', 'Staging project', { labels: { env: 'staging' } }),
    spec: { title: 'Staging', description: 'Pre-production staging environment' },
    status: { state: ProjectState.PENDING, message: 'Initializing project resources' },
  },
];

const projectMemberships = [
  {
    id: 'pm-001',
    metadata: metadata('pm-alice-production', 'Alice in Production'),
    spec: {
      project: 'project-001',
      role: ProjectMembershipRole.MANAGER,
      member: { case: 'user', value: 'user-001' },
    },
    status: { state: ProjectMembershipState.READY },
  },
  {
    id: 'pm-002',
    metadata: metadata('pm-bob-production', 'Bob in Production'),
    spec: {
      project: 'project-001',
      role: ProjectMembershipRole.VIEWER,
      member: { case: 'user', value: 'user-002' },
    },
    status: { state: ProjectMembershipState.READY },
  },
  {
    id: 'pm-003',
    metadata: metadata('pm-carol-development', 'Carol in Development'),
    spec: {
      project: 'project-002',
      role: ProjectMembershipRole.MANAGER,
      member: { case: 'user', value: 'user-003' },
    },
    status: { state: ProjectMembershipState.READY },
  },
  {
    id: 'pm-004',
    metadata: metadata('pm-bob-development', 'Bob in Development'),
    spec: {
      project: 'project-002',
      role: ProjectMembershipRole.VIEWER,
      member: { case: 'user', value: 'user-002' },
    },
    status: { state: ProjectMembershipState.READY },
  },
  {
    id: 'pm-005',
    metadata: metadata('pm-alice-staging', 'Alice in Staging'),
    spec: {
      project: 'project-003',
      role: ProjectMembershipRole.MANAGER,
      member: { case: 'user', value: 'user-001' },
    },
    status: { state: ProjectMembershipState.PENDING },
  },
];

const users = [
  {
    id: 'user-001',
    metadata: metadata('alice', 'Primary admin user'),
    spec: {
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      roles: ['tenant-admin'],
    },
    status: { active: true, phase: 'active' },
    mfa_enrolled: true,
    role: 'tenantAdmin',
    last_login: '2026-06-30',
  },
  {
    id: 'user-002',
    metadata: metadata('bob', 'Developer'),
    spec: { email: 'bob@example.com', firstName: 'Bob', lastName: 'Jones', roles: ['tenant-user'] },
    status: { active: true, phase: 'active' },
    mfa_enrolled: false,
    role: 'tenantUser',
    last_login: '2026-06-28',
  },
  {
    id: 'user-003',
    metadata: metadata('carol', 'Developer'),
    spec: {
      email: 'carol@example.com',
      firstName: 'Carol',
      lastName: 'White',
      roles: ['tenant-user'],
    },
    status: { active: true, phase: 'active' },
    mfa_enrolled: true,
    role: 'tenantUser',
    last_login: '2026-07-01',
  },
  {
    id: 'user-004',
    metadata: metadata('provider-admin', 'Provider administrator'),
    spec: {
      email: 'provider@example.com',
      firstName: 'Provider',
      lastName: 'Admin',
      roles: ['cloud-provider-admin'],
    },
    status: { active: true, phase: 'active' },
    mfa_enrolled: true,
    role: 'tenantAdmin',
    last_login: '2026-07-02',
  },
];

const roles = [
  {
    id: 'role-001',
    metadata: metadata('tenant-admin-role', 'Tenant administrator role'),
    spec: { title: 'Tenant Admin', description: 'Full administrative access to tenant resources.' },
    status: { state: 2 /* READY */ },
  },
  {
    id: 'role-002',
    metadata: metadata('tenant-viewer-role', 'Tenant viewer role'),
    spec: { title: 'Tenant Viewer', description: 'Read-only access to tenant resources.' },
    status: { state: 2 /* READY */ },
  },
];

const roleBindings = [
  {
    id: 'rb-001',
    metadata: metadata('alice-admin-binding', 'Alice admin role binding'),
    spec: { role: 'role-001', users: ['user-001'] },
    status: { state: 2 /* READY */ },
  },
  {
    id: 'rb-002',
    metadata: metadata('bob-carol-viewer-binding', 'Bob and Carol viewer role binding'),
    spec: { role: 'role-002', users: ['user-002', 'user-003'] },
    status: { state: 2 /* READY */ },
  },
];

const identityProviders = [
  {
    id: 'idp-001',
    metadata: metadata('keycloak-oidc', 'Keycloak OIDC provider'),
    spec: {
      title: 'SSO (Keycloak)',
      enabled: true,
      config: {
        case: 'oidc',
        value: {
          authorizationUrl: 'https://sso.example.com/realms/osac/protocol/openid-connect/auth',
          tokenUrl: 'https://sso.example.com/realms/osac/protocol/openid-connect/token',
          clientId: 'osac-ui',
          clientSecret: '',
          issuer: 'https://sso.example.com/realms/osac',
        },
      },
    },
    status: { phase: 1 /* READY */, message: '', health: { status: 1 /* HEALTHY */ } },
  },
  {
    id: 'idp-002',
    metadata: metadata('corporate-ldap', 'Corporate LDAP'),
    spec: {
      title: 'Corporate LDAP',
      enabled: true,
      config: {
        case: 'ldap',
        value: {
          connectionUrl: 'ldap://ldap.corp.example.com:389',
          bindDn: 'cn=admin,dc=corp,dc=example,dc=com',
          bindCredential: '',
          usersDn: 'ou=users,dc=corp,dc=example,dc=com',
        },
      },
    },
    status: { phase: 1 /* READY */, message: '', health: { status: 2 /* UNHEALTHY */ } },
  },
];

// ---------------------------------------------------------------------------
// Load Balancers (@temp-api)
// ---------------------------------------------------------------------------

const loadBalancers = [
  {
    id: 'lb-001',
    metadata: { name: 'web-lb', creationTimestamp: '2025-03-01T10:00:00Z', creator: 'tenant-user' },
    spec: {
      virtualNetwork: 'vnet-001',
      subnet: 'subnet-001',
      listeners: [
        { protocol: 'HTTP', port: 80, targetPort: 8080 },
        { protocol: 'HTTPS', port: 443, targetPort: 8443 },
      ],
      description: 'Frontend load balancer',
    },
    status: {
      state: 'READY',
      internalIpAddress: '10.0.1.100',
      externalIpAddress: '203.0.113.10',
      message: '',
    },
  },
  {
    id: 'lb-002',
    metadata: { name: 'api-lb', creationTimestamp: '2025-04-10T08:30:00Z', creator: 'tenant-user' },
    spec: {
      virtualNetwork: 'vnet-001',
      subnet: 'subnet-002',
      listeners: [{ protocol: 'TCP', port: 5432, targetPort: 5432 }],
      description: 'Database access LB',
    },
    status: {
      state: 'PENDING',
      message: 'Provisioning…',
    },
  },
];

// ---------------------------------------------------------------------------
// Private-only: Hubs + Storage Backends
// ---------------------------------------------------------------------------

const hubs = [
  {
    id: 'hub-prod-1',
    metadata: metadata('hub-prod-1', 'Primary production hub'),
    spec: { namespace: 'osac-system', kubeconfig: '' },
    status: {},
  },
  {
    id: 'hub-dev-1',
    metadata: metadata('hub-dev-1', 'Development hub'),
    spec: { namespace: 'osac-dev', kubeconfig: '' },
    status: {},
  },
];

const storageBackends = [
  {
    id: 'storage-001',
    metadata: metadata('ceph-prod', 'Production Ceph storage'),
    spec: {
      provider: 'ceph',
      description: 'Production Ceph cluster',
      endpoint: 'https://ceph.example.com:8080',
      credentials: { username: 'osac', password: '' },
    },
    status: { state: 'READY' },
  },
];

// ---------------------------------------------------------------------------
// Storage: Storage Tiers (@temp-api)
// ---------------------------------------------------------------------------

const storageTiers = [
  {
    id: 'tier-001',
    metadata: {
      ...metadata('fast', 'High-performance NVMe-backed tier'),
      labels: { price_per_gib_month: '0.0800' },
    },
    spec: {
      displayName: 'Fast',
      protocol: 'rbd',
      qosClass: 'fast',
      storageClassName: 'ceph-rbd-fast',
      storageBackend: 'storage-001',
    },
    status: { available: true },
  },
  {
    id: 'tier-002',
    metadata: {
      ...metadata('standard', 'General-purpose balanced tier'),
      labels: { price_per_gib_month: '0.0300' },
    },
    spec: {
      displayName: 'Standard',
      protocol: 'nfs',
      qosClass: 'standard',
      storageClassName: 'ceph-nfs-standard',
      storageBackend: 'storage-001',
    },
    status: { available: true },
  },
  {
    id: 'tier-003',
    metadata: metadata('archival', 'Low-cost long-term storage'),
    spec: {
      displayName: 'Archival',
      protocol: 'nfs',
      qosClass: 'archival',
      storageClassName: 'ceph-nfs-archival',
      storageBackend: 'storage-001',
    },
    status: { available: false },
  },
];

// ---------------------------------------------------------------------------
// Storage: Block Volumes (@temp-api)
// ---------------------------------------------------------------------------

const blockVolumes = [
  {
    id: 'vol-001',
    metadata: metadata('data-vol-vm001', 'Primary data volume for vm-001'),
    spec: { sizeGib: 200, storageClass: 'ssd' },
    status: { state: 'ATTACHED', attachedTo: 'vm-001', attachedToName: 'web-frontend-01' },
  },
  {
    id: 'vol-002',
    metadata: metadata('backup-vol-vm001', 'Backup volume'),
    spec: { sizeGib: 500, storageClass: 'standard' },
    status: { state: 'ATTACHED', attachedTo: 'vm-001', attachedToName: 'web-frontend-01' },
  },
  {
    id: 'vol-003',
    metadata: metadata('nvme-scratch', 'High-performance scratch space'),
    spec: { sizeGib: 100, storageClass: 'nvme' },
    status: { state: 'AVAILABLE' },
  },
  {
    id: 'vol-004',
    metadata: metadata('ml-dataset-vol', 'ML training dataset'),
    spec: { sizeGib: 1000, storageClass: 'standard' },
    status: { state: 'PROVISIONING' },
  },
];

// ---------------------------------------------------------------------------
// Storage: Volume Snapshots (@temp-api)
// ---------------------------------------------------------------------------

const volumeSnapshots = [
  {
    id: 'snap-001',
    metadata: metadata('snap-boot-vm-001', 'Boot disk snapshot'),
    spec: { sourceInstanceId: 'vm-001', diskIndex: 0, description: 'Pre-upgrade snapshot' },
    status: { state: 'READY', sizeGib: 50 },
  },
  {
    id: 'snap-002',
    metadata: metadata('snap-boot-vm-001-b', 'Boot disk snapshot (pending)'),
    spec: { sourceInstanceId: 'vm-001', diskIndex: 0 },
    status: { state: 'PENDING' },
  },
  {
    id: 'snap-003',
    metadata: metadata('snap-data-vm-002', 'Data disk snapshot'),
    spec: { sourceInstanceId: 'vm-002', diskIndex: 1, description: 'Weekly backup' },
    status: { state: 'READY', sizeGib: 500 },
  },
];

// ---------------------------------------------------------------------------
// Storage: Object Storage Buckets (@temp-api)
// ---------------------------------------------------------------------------

const objectStorageBuckets = [
  {
    id: 'bucket-001',
    metadata: metadata('app-assets', 'Application static assets'),
    spec: { quotaGib: 100, versioning: true, description: 'Frontend static assets bucket' },
    status: {
      state: 'READY',
      endpoint: 'https://s3.example.com/app-assets',
      usedGib: 12,
      objectCount: 3842,
    },
  },
  {
    id: 'bucket-002',
    metadata: metadata('backups-2026', 'Database backups 2026'),
    spec: { quotaGib: 500, versioning: false, description: 'Daily database backup target' },
    status: {
      state: 'PROVISIONING',
    },
  },
];

// ---------------------------------------------------------------------------
// Storage: Bucket Access Keys (@temp-api)
// ---------------------------------------------------------------------------

const bucketAccessKeys = [
  {
    id: 'key-001',
    metadata: metadata('app-assets-key-1', 'Primary access key'),
    spec: { bucketId: 'bucket-001', description: 'CI/CD deploy key' },
    status: { state: 'ACTIVE', accessKeyId: 'AKIAIOSFODNN7EXAMPLE' },
  },
  {
    id: 'key-002',
    metadata: metadata('app-assets-key-2', 'Secondary access key'),
    spec: { bucketId: 'bucket-001' },
    status: { state: 'ACTIVE', accessKeyId: 'AKIAI44QH8DHBEXAMPLE' },
  },
];

// ---------------------------------------------------------------------------
// MaaS (@temp-api — not yet in fulfillment-service)
// ---------------------------------------------------------------------------

const aiEnvironments = [
  {
    id: 'ai-env-001',
    metadata: {
      name: 'prod-ai-cluster',
      creationTimestamp: ts(2880),
      labels: { price_per_hour: '1.20' },
    },
    spec: {
      clusterId: 'cluster-001',
      rhoaiVersion: '2.17',
      gatewayEndpoint: 'https://maas.apps.prod.rhoai.example.com',
      registeredModels: ['llama-3-2-3b', 'granite-3-3-8b'],
    },
    status: { state: 'READY', clusterName: 'prod-cluster', readyAt: ts(2800) },
  },
  {
    id: 'ai-env-002',
    metadata: {
      name: 'dev-ai-cluster',
      creationTimestamp: ts(720),
      labels: { price_per_hour: '0.60' },
    },
    spec: {
      clusterId: 'cluster-002',
      rhoaiVersion: '2.16',
      gatewayEndpoint: 'https://maas.apps.dev.rhoai.example.com',
      registeredModels: ['llama-3-2-3b'],
    },
    status: { state: 'PROVISIONING', clusterName: 'dev-cluster' },
  },
  // cluster-003 has no AiEnvironment entry → ProviderAiSetupPage shows "Not enabled"
];

const modelCatalogItems = [
  {
    id: 'maas-catalog-llama-3-2-3b',
    metadata: metadata('llama-3-2-3b', '', {
      labels: {
        model_provider: 'meta',
        context_window: '128k',
        workload: 'ai',
        price_per_input_token: '0.000002',
        price_per_output_token: '0.000006',
      },
    }),
    title: 'Llama 3.2 — 3B',
    description:
      'Meta Llama 3.2 3B model for text generation and RAG pipelines. Shared inference via OpenAI-compatible /v1 endpoint.',
    published: true,
    tenant: '',
    allowed_tenants: [],
    field_definitions: [
      {
        path: 'application_name',
        display_name: 'Application name',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'token_quota_monthly',
        display_name: 'Monthly token quota',
        editable: true,
        default: 1_000_000,
        validation_schema: '{"type":"integer","minimum":100000,"maximum":50000000}',
      },
    ],
  },
  {
    id: 'maas-catalog-granite-3-3-8b',
    metadata: metadata('granite-3-3-8b', '', {
      labels: {
        model_provider: 'ibm',
        context_window: '32k',
        workload: 'ai',
        price_per_input_token: '0.000001',
        price_per_output_token: '0.000003',
      },
    }),
    title: 'IBM Granite 3.3 — 8B',
    description:
      'IBM Granite 8B model optimised for enterprise code generation and document summarization.',
    published: true,
    tenant: '',
    allowed_tenants: [DEMO_TENANT_ID],
    field_definitions: [
      {
        path: 'application_name',
        display_name: 'Application name',
        editable: true,
        validation_schema: '{"type":"string","minLength":1}',
      },
      {
        path: 'token_quota_monthly',
        display_name: 'Monthly token quota',
        editable: true,
        default: 2_000_000,
        validation_schema: '{"type":"integer","minimum":100000,"maximum":50000000}',
      },
    ],
  },
];

const modelAccesses = [
  {
    id: 'maas-access-001',
    metadata: metadata('rag-pipeline-llama', '', { creator: 'alice@example.com' }),
    spec: {
      catalogItem: 'maas-catalog-llama-3-2-3b',
      applicationName: 'RAG Pipeline',
      tokenQuotaMonthly: 1_000_000,
    },
    status: {
      state: 'ACTIVE',
      endpoint: 'https://maas.apps.prod.rhoai.example.com/llama-3-2-3b/v1',
      apiKey: 'sk-maas-a1b2c3d4e5f6',
    },
  },
  {
    id: 'maas-access-002',
    metadata: metadata('code-assist-granite', '', { creator: 'bob@example.com' }),
    spec: {
      catalogItem: 'maas-catalog-granite-3-3-8b',
      applicationName: 'Code Assistant',
      tokenQuotaMonthly: 2_000_000,
    },
    status: {
      state: 'ACTIVE',
      endpoint: 'https://maas.apps.prod.rhoai.example.com/granite-3-3-8b/v1',
      apiKey: 'sk-maas-f6e5d4c3b2a1',
    },
  },
];

// ---------------------------------------------------------------------------
// Capabilities
// ---------------------------------------------------------------------------

const capabilities = {
  features: { multiTenancy: true, bareMetalProvisioning: true, clusterProvisioning: true },
  authnCapabilities: { oidcEnabled: true },
};

// ---------------------------------------------------------------------------
// Mock Store — keyed by ApiRoute
// ---------------------------------------------------------------------------

export type MockStore = Partial<Record<ApiRoute, unknown[]>>;

export const mockStore: MockStore = {
  // Compute
  'v1/compute_instances': [...computeInstances],
  'v1/compute_instance_templates': [...computeInstanceTemplates],
  'v1/compute_instance_catalog_items': [...computeInstanceCatalogItems],
  // Clusters
  'v1/clusters': [...clusters],
  'v1/cluster_templates': [...clusterTemplates],
  'v1/cluster_catalog_items': [...clusterCatalogItems],
  // Bare Metal
  'v1/baremetal_instances': [...baremetalInstances],
  'v1/baremetal_instance_templates': [...baremetalInstanceTemplates],
  'v1/baremetal_instance_catalog_items': [...baremetalInstanceCatalogItems],
  'v1/host_types': [...hostTypes],
  // Infrastructure
  'v1/instance_types': [...instanceTypes],
  // Networking
  'v1/virtual_networks': [...virtualNetworks],
  'v1/subnets': [...subnets],
  'v1/security_groups': [...securityGroups],
  'v1/network_classes': [...networkClasses],
  // IP
  'v1/public_ip_pools': [...publicIpPools],
  'v1/public_ips': [...publicIps],
  'v1/public_ip_attachments': [...publicIpAttachments],
  'v1/external_ip_pools': [...externalIpPools],
  'v1/external_ips': [...externalIps],
  'v1/external_ip_attachments': [...externalIpAttachments],
  // Identity / RBAC
  'v1/tenants': [...tenants],
  'v1/organizations': [...organizations],
  'v1/projects': [...projects],
  'v1/project_memberships': [...projectMemberships],
  'v1/users': [...users],
  'v1/roles': [...roles],
  'v1/role_bindings': [...roleBindings],
  'v1/identity_providers': [...identityProviders],
  // Load Balancer (@temp-api)
  'v1/load_balancers': [...loadBalancers],
  // Storage (@temp-api)
  'v1/storage_tiers': [...storageTiers],
  'v1/block_volumes': [...blockVolumes],
  'v1/volume_snapshots': [...volumeSnapshots],
  'v1/object_storage_buckets': [...objectStorageBuckets],
  'v1/bucket_access_keys': [...bucketAccessKeys],
  // MaaS (@temp-api)
  'v1/ai_environments': [...aiEnvironments],
  'v1/model_catalog_items': [...modelCatalogItems],
  'v1/model_accesses': [...modelAccesses],
  // Private-only
  'v1/hubs': [...hubs],
  'v1/storage_backends': [...storageBackends],
};

/** Singleton capabilities object (not a list — returned directly). */
export const mockCapabilities = capabilities;
