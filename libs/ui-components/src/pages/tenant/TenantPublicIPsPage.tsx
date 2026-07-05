/**
 * flow: tenant-ip-management
 * route: /ips (tenantUser, tenantAdmin)
 */
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectOption,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useComputeInstances } from '../../api/v1/compute-instance';
import {
  type PublicIP,
  type PublicIPPool,
  useCreatePublicIP,
  useCreatePublicIPAttachment,
  useDeletePublicIP,
  useDeletePublicIPAttachment,
  usePublicIPAttachments,
  usePublicIPPools,
  usePublicIPs,
} from '../../api/v1/ip-management';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { getErrorMessage } from '../../utils/error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IP_FAMILY_LABELS: Record<number, string> = { 1: 'IPv4', 2: 'IPv6' };

const PublicIPStateLabel = ({ state }: { state?: number }) => {
  if (state === 2) {
    return (
      <Label color="green" isCompact>
        Allocated
      </Label>
    );
  }
  if (state === 1) {
    return (
      <Label color="orange" isCompact>
        Pending
      </Label>
    );
  }
  if (state === 3) {
    return (
      <Label color="red" isCompact>
        Failed
      </Label>
    );
  }
  return (
    <Label color="grey" isCompact>
      Unknown
    </Label>
  );
};

// ---------------------------------------------------------------------------
// Allocate IP modal
// ---------------------------------------------------------------------------

interface AllocateIPModalProps {
  pools: PublicIPPool[];
  isOpen: boolean;
  onClose: () => void;
}

const AllocateIPModal = ({ pools, isOpen, onClose }: AllocateIPModalProps) => {
  const [poolId, setPoolId] = useState(pools[0]?.id ?? '');
  const [poolOpen, setPoolOpen] = useState(false);
  const { mutateAsync, isPending, error } = useCreatePublicIP();

  const handleAllocate = async () => {
    if (!poolId) {
      return;
    }
    await mutateAsync({ spec: { pool: poolId } });
    onClose();
  };

  const selectedPool = pools.find((p) => p.id === poolId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Allocate public IP">
      <ModalHeader title="Allocate public IP" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Select
          isOpen={poolOpen}
          onSelect={(_e, val) => {
            setPoolId(val as string);
            setPoolOpen(false);
          }}
          onOpenChange={setPoolOpen}
          selected={poolId || undefined}
          toggle={(ref) => (
            <MenuToggle
              ref={ref}
              onClick={() => setPoolOpen(!poolOpen)}
              isExpanded={poolOpen}
              style={{ width: '100%' }}
            >
              {selectedPool
                ? `${selectedPool.metadata?.name ?? selectedPool.id} (${IP_FAMILY_LABELS[selectedPool.spec?.ipFamily ?? 0] ?? '?'}, ${String(selectedPool.status?.available ?? '?')} available)`
                : 'Select pool'}
            </MenuToggle>
          )}
        >
          {pools.map((p) => (
            <SelectOption key={p.id} value={p.id}>
              {p.metadata?.name ?? p.id} — {IP_FAMILY_LABELS[p.spec?.ipFamily ?? 0] ?? '?'},{' '}
              {String(p.status?.available ?? '?')} available
            </SelectOption>
          ))}
        </Select>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleAllocate}
          isLoading={isPending}
          isDisabled={isPending || !poolId}
        >
          Allocate
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Attach IP modal
// ---------------------------------------------------------------------------

interface AttachIPModalProps {
  ip: PublicIP;
  isOpen: boolean;
  onClose: () => void;
}

const AttachIPModal = ({ ip, isOpen, onClose }: AttachIPModalProps) => {
  const { data: vms = [] } = useComputeInstances();
  const [vmId, setVmId] = useState('');
  const [vmOpen, setVmOpen] = useState(false);
  const { mutateAsync, isPending, error } = useCreatePublicIPAttachment();

  const handleAttach = async () => {
    if (!vmId) {
      return;
    }
    await mutateAsync({
      spec: { publicIp: ip.id, target: { case: 'computeInstance', value: vmId } },
    });
    onClose();
  };

  const selectedVm = vms.find((v) => v.id === vmId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Attach public IP">
      <ModalHeader title={`Attach ${ip.status?.address ?? ip.id} to a VM`} />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Select
          isOpen={vmOpen}
          onSelect={(_e, val) => {
            setVmId(val as string);
            setVmOpen(false);
          }}
          onOpenChange={setVmOpen}
          selected={vmId || undefined}
          toggle={(ref) => (
            <MenuToggle
              ref={ref}
              onClick={() => setVmOpen(!vmOpen)}
              isExpanded={vmOpen}
              style={{ width: '100%' }}
            >
              {selectedVm ? (selectedVm.metadata?.name ?? selectedVm.id) : 'Select virtual machine'}
            </MenuToggle>
          )}
        >
          {vms.length === 0 ? (
            <SelectOption value="" isDisabled>
              No VMs available
            </SelectOption>
          ) : (
            vms.map((v) => (
              <SelectOption key={v.id} value={v.id}>
                {v.metadata?.name ?? v.id}
              </SelectOption>
            ))
          )}
        </Select>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleAttach}
          isLoading={isPending}
          isDisabled={isPending || !vmId}
        >
          Attach
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Release confirm modal
// ---------------------------------------------------------------------------

interface ReleaseIPModalProps {
  ip: PublicIP;
  isOpen: boolean;
  onClose: () => void;
}

const ReleaseIPModal = ({ ip, isOpen, onClose }: ReleaseIPModalProps) => {
  const { mutateAsync, isPending } = useDeletePublicIP();

  const handleRelease = async () => {
    await mutateAsync(ip.id);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Release public IP">
      <ModalHeader title="Release public IP" />
      <ModalBody>
        Release <strong>{ip.status?.address ?? ip.id}</strong>? This returns it to the pool and
        cannot be undone.
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={handleRelease}
          isLoading={isPending}
          isDisabled={isPending}
        >
          Release
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// My Public IPs section
// ---------------------------------------------------------------------------

const MyPublicIPsSection = ({ pools }: { pools: PublicIPPool[] }) => {
  const { data: ips = [], isLoading, error } = usePublicIPs();
  const { data: attachments = [] } = usePublicIPAttachments();
  const { mutate: deleteAttachment } = useDeletePublicIPAttachment();

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [attachIP, setAttachIP] = useState<PublicIP | null>(null);
  const [releaseIP, setReleaseIP] = useState<PublicIP | null>(null);

  const poolName = (id: string) => pools.find((p) => p.id === id)?.metadata?.name ?? id;

  const attachmentFor = (ipId: string) => attachments.find((a) => a.spec?.publicIp === ipId);

  const attachedToLabel = (ipId: string) => {
    const att = attachmentFor(ipId);
    if (!att) {
      return '—';
    }
    return att.spec?.target?.value ?? '—';
  };

  return (
    <>
      {allocateOpen && (
        <AllocateIPModal pools={pools} isOpen onClose={() => setAllocateOpen(false)} />
      )}
      {attachIP && <AttachIPModal ip={attachIP} isOpen onClose={() => setAttachIP(null)} />}
      {releaseIP && <ReleaseIPModal ip={releaseIP} isOpen onClose={() => setReleaseIP(null)} />}

      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsCenter' }}
        style={{ marginBottom: '0.75rem' }}
      >
        <FlexItem>
          <Title headingLevel="h3" size="md">
            My public IPs
          </Title>
        </FlexItem>
        <FlexItem>
          <Button variant="primary" size="sm" onClick={() => setAllocateOpen(true)}>
            Allocate IP
          </Button>
        </FlexItem>
      </Flex>

      <ListPageBody isLoading={isLoading} error={error}>
        {ips.length === 0 ? (
          <Alert variant="info" isInline title="No IPs allocated">
            Click &ldquo;Allocate IP&rdquo; to reserve a public IP address from a pool.
          </Alert>
        ) : (
          <Table aria-label="My public IPs" variant="compact">
            <Thead>
              <Tr>
                <Th>Address</Th>
                <Th>Pool</Th>
                <Th>State</Th>
                <Th>Attached to</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {ips.map((ip) => {
                const att = attachmentFor(ip.id);
                const isAttached = !!att;
                return (
                  <Tr key={ip.id}>
                    <Td dataLabel="Address">
                      {ip.status?.address ? (
                        <strong>{ip.status.address}</strong>
                      ) : (
                        <Spinner size="sm" aria-label="Allocating" />
                      )}
                    </Td>
                    <Td dataLabel="Pool">{poolName(ip.spec?.pool ?? '')}</Td>
                    <Td dataLabel="State">
                      <PublicIPStateLabel state={ip.status?.state} />
                    </Td>
                    <Td dataLabel="Attached to">
                      {isAttached ? (
                        <>
                          <Label color="green" isCompact>
                            Attached
                          </Label>{' '}
                          {attachedToLabel(ip.id)}
                        </>
                      ) : (
                        <Label color="grey" isCompact>
                          Not attached
                        </Label>
                      )}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: 'Attach',
                            isDisabled: isAttached,
                            onClick: (e) => {
                              e.stopPropagation();
                              setAttachIP(ip);
                            },
                          },
                          {
                            title: 'Detach',
                            isDisabled: !isAttached,
                            onClick: (e) => {
                              e.stopPropagation();
                              if (att) {
                                deleteAttachment(att.id);
                              }
                            },
                          },
                          { isSeparator: true },
                          {
                            title: 'Release',
                            isDisabled: isAttached,
                            onClick: (e) => {
                              e.stopPropagation();
                              setReleaseIP(ip);
                            },
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const TenantPublicIPsPage = () => {
  const { data: pools = [], isLoading: poolsLoading, error: poolsError } = usePublicIPPools();
  const { data: myIPs = [] } = usePublicIPs();

  return (
    <ListPage
      title="Public IPs"
      description="View available IP pools and manage your allocated public IP addresses."
    >
      <Stack hasGutter>
        <StackItem>
          <Card>
            <CardTitle>
              <Title headingLevel="h3" size="md">
                Available pools
              </Title>
            </CardTitle>
            <CardBody>
              <ListPageBody isLoading={poolsLoading} error={poolsError}>
                {pools.length === 0 ? (
                  <Alert variant="info" isInline title="No pools available">
                    No public IP pools have been assigned to your tenant yet.
                  </Alert>
                ) : (
                  <Table aria-label="Public IP pools" variant="compact">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>IP family</Th>
                        <Th>Available</Th>
                        <Th>My allocations</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {pools.map((pool) => (
                        <Tr key={pool.id}>
                          <Td dataLabel="Name">{pool.metadata?.name ?? pool.id}</Td>
                          <Td dataLabel="IP family">
                            <Label color="blue" isCompact>
                              {IP_FAMILY_LABELS[pool.spec?.ipFamily ?? 0] ?? '—'}
                            </Label>
                          </Td>
                          <Td dataLabel="Available">{String(pool.status?.available ?? '—')}</Td>
                          <Td dataLabel="My allocations">
                            {myIPs.filter((ip) => ip.spec?.pool === pool.id).length}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </ListPageBody>
            </CardBody>
          </Card>
        </StackItem>

        <StackItem>
          <Card>
            <CardBody>
              <MyPublicIPsSection pools={pools} />
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </ListPage>
  );
};
