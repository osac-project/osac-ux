/**
 * flow: provider-admin
 * route: /provider/storage-tiers
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Switch,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useStorageBackends } from '../../api/v1/storage-backend';
import type { StorageTier } from '../../api/v1/storage-tier';
import {
  useDeleteStorageTier,
  usePatchStorageTier,
  useStorageTiers,
} from '../../api/v1/storage-tier';
import OsacForm from '../../components/Form/OsacForm';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { getErrorMessage } from '../../utils/error';

type Protocol = 'nfs' | 'rbd' | 's3';
type QosClass = 'fast' | 'standard' | 'archival';
type AvailableFilter = 'yes' | 'no';

const PROTOCOL_OPTIONS: Protocol[] = ['nfs', 'rbd', 's3'];
const QOS_OPTIONS: QosClass[] = ['fast', 'standard', 'archival'];

const PROTOCOL_COLOR: Record<string, 'blue' | 'purple' | 'gold'> = {
  nfs: 'blue',
  rbd: 'purple',
  s3: 'gold',
};

const QOS_COLOR: Record<string, 'green' | 'blue' | 'grey'> = {
  fast: 'green',
  standard: 'blue',
  archival: 'grey',
};

// ---------------------------------------------------------------------------
// Set Price modal (kept as a quick single-field modal)
// ---------------------------------------------------------------------------

const SetPriceModal = ({ tier, onClose }: { tier: StorageTier; onClose: () => void }) => {
  const patch = usePatchStorageTier();
  const [price, setPrice] = useState(tier.metadata?.labels?.['price_per_gib_month'] ?? '');
  const [isPending, setIsPending] = useState(false);

  const onSubmit = async () => {
    setIsPending(true);
    patch.reset();
    try {
      await patch.mutateAsync({
        id: tier.id,
        patch: {
          metadata: {
            ...tier.metadata,
            labels: { ...(tier.metadata?.labels ?? {}), price_per_gib_month: price },
          },
        },
      });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="st-price-title"
    >
      <ModalHeader
        title={`Set price — ${tier.metadata?.name ?? tier.id}`}
        labelId="st-price-title"
      />
      <ModalBody>
        <OsacForm isResponsive={false}>
          <FormGroup label="Price per GiB / month (USD)" fieldId="sp-price" isRequired>
            <TextInput
              id="sp-price"
              value={price}
              onChange={(_e, v) => setPrice(v)}
              placeholder="0.05"
            />
          </FormGroup>
          {patch.error && (
            <Alert variant="danger" title="Failed to set price" isInline>
              {getErrorMessage(patch.error)}
            </Alert>
          )}
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={isPending || price.trim() === ''}
          isLoading={isPending}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const ProviderStorageTiersPage = () => {
  const navigate = useNavigate();
  const { data: tiers = [], isLoading, error } = useStorageTiers();
  const { data: backends = [] } = useStorageBackends();
  const patchTier = usePatchStorageTier();
  const deleteTier = useDeleteStorageTier();

  const [priceTarget, setPriceTarget] = useState<StorageTier | null>(null);
  const [pendingDelete, setPendingDelete] = useState<StorageTier | null>(null);

  const [search, setSearch] = useState('');
  const [protoFilters, setProtoFilters] = useState<Protocol[]>([]);
  const [qosFilters, setQosFilters] = useState<QosClass[]>([]);
  const [availFilters, setAvailFilters] = useState<AvailableFilter[]>([]);

  const [protoOpen, setProtoOpen] = useState(false);
  const [qosOpen, setQosOpen] = useState(false);
  const [availOpen, setAvailOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tiers.filter((t) => {
      if (q) {
        const name = (t.metadata?.name ?? t.id).toLowerCase();
        const dn = (t.spec.displayName ?? '').toLowerCase();
        if (!name.includes(q) && !dn.includes(q)) {
          return false;
        }
      }
      if (protoFilters.length > 0 && !protoFilters.includes(t.spec.protocol as Protocol)) {
        return false;
      }
      if (qosFilters.length > 0 && !qosFilters.includes(t.spec.qosClass as QosClass)) {
        return false;
      }
      if (availFilters.length > 0) {
        const isAvail = t.status.available ? 'yes' : 'no';
        if (!availFilters.includes(isAvail)) {
          return false;
        }
      }
      return true;
    });
  }, [tiers, search, protoFilters, qosFilters, availFilters]);

  const toggleSelect = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const backendName = (id?: string) => {
    if (!id) {
      return '—';
    }
    const b = backends.find((x) => x.id === id);
    return b?.metadata?.name ?? id;
  };

  const onToggleAvailability = async (tier: StorageTier) => {
    await patchTier.mutateAsync({
      id: tier.id,
      patch: { status: { available: !tier.status.available } },
    });
  };

  return (
    <>
      <ListPage
        title="Storage Tiers"
        description="Named storage classes that tenants can request when provisioning block or object volumes."
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar
            clearAllFilters={() => {
              setProtoFilters([]);
              setQosFilters([]);
              setAvailFilters([]);
              setSearch('');
            }}
          >
            <ToolbarContent>
              <ToolbarGroup variant="filter-group">
                <ToolbarItem>
                  <SearchInput
                    placeholder="Filter by name or display name"
                    value={search}
                    onChange={(_e, v) => setSearch(v)}
                    onClear={() => setSearch('')}
                  />
                </ToolbarItem>
                <ToolbarFilter
                  labels={protoFilters}
                  deleteLabel={(_cat, chip) => setProtoFilters((f) => f.filter((x) => x !== chip))}
                  deleteLabelGroup={() => setProtoFilters([])}
                  categoryName="Protocol"
                >
                  <Select
                    isOpen={protoOpen}
                    onOpenChange={setProtoOpen}
                    onSelect={(_e, v) => setProtoFilters((f) => toggleSelect(f, v as Protocol))}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setProtoOpen(!protoOpen)}
                        isExpanded={protoOpen}
                        badge={protoFilters.length || undefined}
                      >
                        Protocol
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {PROTOCOL_OPTIONS.map((p) => (
                        <SelectOption
                          key={p}
                          value={p}
                          hasCheckbox
                          isSelected={protoFilters.includes(p)}
                        >
                          {p.toUpperCase()}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
                <ToolbarFilter
                  labels={qosFilters}
                  deleteLabel={(_cat, chip) => setQosFilters((f) => f.filter((x) => x !== chip))}
                  deleteLabelGroup={() => setQosFilters([])}
                  categoryName="QoS class"
                >
                  <Select
                    isOpen={qosOpen}
                    onOpenChange={setQosOpen}
                    onSelect={(_e, v) => setQosFilters((f) => toggleSelect(f, v as QosClass))}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setQosOpen(!qosOpen)}
                        isExpanded={qosOpen}
                        badge={qosFilters.length || undefined}
                      >
                        QoS class
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {QOS_OPTIONS.map((q) => (
                        <SelectOption
                          key={q}
                          value={q}
                          hasCheckbox
                          isSelected={qosFilters.includes(q)}
                        >
                          {q.charAt(0).toUpperCase() + q.slice(1)}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
                <ToolbarFilter
                  labels={availFilters}
                  deleteLabel={(_cat, chip) => setAvailFilters((f) => f.filter((x) => x !== chip))}
                  deleteLabelGroup={() => setAvailFilters([])}
                  categoryName="Available"
                >
                  <Select
                    isOpen={availOpen}
                    onOpenChange={setAvailOpen}
                    onSelect={(_e, v) =>
                      setAvailFilters((f) => toggleSelect(f, v as AvailableFilter))
                    }
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setAvailOpen(!availOpen)}
                        isExpanded={availOpen}
                        badge={availFilters.length || undefined}
                      >
                        Available
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {(['yes', 'no'] as AvailableFilter[]).map((a) => (
                        <SelectOption
                          key={a}
                          value={a}
                          hasCheckbox
                          isSelected={availFilters.includes(a)}
                        >
                          {a === 'yes' ? 'Available' : 'Unavailable'}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarFilter>
              </ToolbarGroup>
              <ToolbarItem align={{ default: 'alignRight' }}>
                <Button variant="primary" onClick={() => navigate('/provider/storage-tiers/new')}>
                  Create storage tier
                </Button>
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>

          {filtered.length === 0 ? (
            <Alert variant="info" isInline title="No storage tiers match the current filters" />
          ) : (
            <Table aria-label="Storage tiers" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Display name</Th>
                  <Th>Protocol</Th>
                  <Th>QoS class</Th>
                  <Th>Storage class</Th>
                  <Th>Backend</Th>
                  <Th>Price / GiB / mo</Th>
                  <Th>Available</Th>
                  <Th aria-label="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {filtered.map((tier) => (
                  <Tr key={tier.id}>
                    <Td dataLabel="Name">
                      <strong>{tier.metadata?.name ?? tier.id}</strong>
                    </Td>
                    <Td dataLabel="Display name">{tier.spec.displayName ?? '—'}</Td>
                    <Td dataLabel="Protocol">
                      <Label color={PROTOCOL_COLOR[tier.spec.protocol] ?? 'grey'} isCompact>
                        {tier.spec.protocol.toUpperCase()}
                      </Label>
                    </Td>
                    <Td dataLabel="QoS class">
                      <Label color={QOS_COLOR[tier.spec.qosClass] ?? 'grey'} isCompact>
                        {tier.spec.qosClass}
                      </Label>
                    </Td>
                    <Td dataLabel="Storage class">
                      <code style={{ fontSize: '0.8em' }}>{tier.spec.storageClassName}</code>
                    </Td>
                    <Td dataLabel="Backend">{backendName(tier.spec.storageBackend)}</Td>
                    <Td dataLabel="Price / GiB / mo">
                      {tier.metadata?.labels?.['price_per_gib_month']
                        ? `$${tier.metadata.labels['price_per_gib_month']}`
                        : '—'}
                    </Td>
                    <Td dataLabel="Available">
                      <Switch
                        aria-label={`Toggle availability for ${tier.metadata?.name ?? tier.id}`}
                        isChecked={tier.status.available}
                        onChange={() => onToggleAvailability(tier)}
                      />
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: 'Edit',
                            onClick: () => navigate(`/provider/storage-tiers/${tier.id}/edit`),
                          },
                          { title: 'Set price', onClick: () => setPriceTarget(tier) },
                          {
                            title: 'Delete',
                            onClick: () => setPendingDelete(tier),
                            isDanger: true,
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>

      {priceTarget && <SetPriceModal tier={priceTarget} onClose={() => setPriceTarget(null)} />}
      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.metadata?.name ?? pendingDelete.id}
          resourceKind="storage tier"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteTier.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteTier.error}
        />
      )}
    </>
  );
};
