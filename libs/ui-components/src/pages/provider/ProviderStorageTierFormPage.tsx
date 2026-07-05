/**
 * flow: provider-admin
 * route: /provider/storage-tiers/new
 * route: /provider/storage-tiers/:id/edit
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useStorageBackends } from '../../api/v1/storage-backend';
import type { StorageTier } from '../../api/v1/storage-tier';
import {
  useCreateStorageTier,
  usePatchStorageTier,
  useStorageTiers,
} from '../../api/v1/storage-tier';
import { getErrorMessage } from '../../utils/error';

type Protocol = 'nfs' | 'rbd' | 's3';
type QosClass = 'fast' | 'standard' | 'archival';

const PROTOCOL_OPTIONS: Protocol[] = ['nfs', 'rbd', 's3'];
const QOS_OPTIONS: QosClass[] = ['fast', 'standard', 'archival'];

const BACK = '/provider/storage-tiers';

export const ProviderStorageTierFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: tiers = [], isLoading: loadingTiers } = useStorageTiers();
  const { data: backends = [] } = useStorageBackends();
  const existing: StorageTier | undefined = isEdit ? tiers.find((t) => t.id === id) : undefined;

  const create = useCreateStorageTier();
  const patch = usePatchStorageTier();
  const mutationError = isEdit ? patch.error : create.error;
  const isPending = isEdit ? patch.isPending : create.isPending;

  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [protocol, setProtocol] = useState<Protocol | ''>('');
  const [qosClass, setQosClass] = useState<QosClass | ''>('');
  const [storageClassName, setStorageClassName] = useState('');
  const [storageBackend, setStorageBackend] = useState('');
  const [pricePerGibMonth, setPricePerGibMonth] = useState('');

  const [protocolOpen, setProtocolOpen] = useState(false);
  const [qosOpen, setQosOpen] = useState(false);
  const [backendOpen, setBackendOpen] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);

  useEffect(() => {
    if (isEdit && existing && !hydrated) {
      setDisplayName(existing.spec.displayName ?? '');
      setProtocol((existing.spec.protocol as Protocol) ?? '');
      setQosClass((existing.spec.qosClass as QosClass) ?? '');
      setStorageClassName(existing.spec.storageClassName);
      setStorageBackend(existing.spec.storageBackend ?? '');
      setPricePerGibMonth(existing.metadata?.labels?.['price_per_gib_month'] ?? '');
      setHydrated(true);
    }
  }, [isEdit, existing, hydrated]);

  const isValid = isEdit
    ? displayName.trim() !== '' &&
      protocol !== '' &&
      qosClass !== '' &&
      storageClassName.trim() !== ''
    : name.trim() !== '' &&
      displayName.trim() !== '' &&
      protocol !== '' &&
      qosClass !== '' &&
      storageClassName.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    create.reset();
    patch.reset();
    if (isEdit && existing) {
      await patch.mutateAsync({
        id: existing.id,
        patch: {
          metadata: {
            ...existing.metadata,
            labels: pricePerGibMonth ? { price_per_gib_month: pricePerGibMonth } : {},
          },
          spec: {
            displayName,
            protocol: protocol as Protocol,
            qosClass: qosClass as QosClass,
            storageClassName,
            storageBackend: storageBackend || undefined,
          },
        },
      });
    } else {
      await create.mutateAsync({
        metadata: {
          name: name.trim(),
          labels: pricePerGibMonth ? { price_per_gib_month: pricePerGibMonth } : undefined,
        },
        spec: {
          displayName,
          protocol: protocol as Protocol,
          qosClass: qosClass as QosClass,
          storageClassName,
          storageBackend: storageBackend || undefined,
        },
        status: { available: true },
      });
    }
    navigate(BACK);
  };

  if (isEdit && (loadingTiers || !hydrated)) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading storage tier" />
      </PageSection>
    );
  }

  if (isEdit && !existing) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="danger" isInline title={`Storage tier "${id}" not found`} />
      </PageSection>
    );
  }

  const tierName = isEdit ? (existing?.metadata?.name ?? id) : undefined;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACK)}>
                Storage Tiers
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit ? `Edit — ${tierName}` : 'Create storage tier'}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? 'Edit storage tier' : 'Create storage tier'}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="st-form">
          {!isEdit && (
            <FormGroup label="Name (identifier)" fieldId="st-name" isRequired>
              <TextInput
                id="st-name"
                value={name}
                onChange={(_e, v) => setName(v)}
                placeholder="standard-hdd"
                isRequired
                autoFocus
              />
            </FormGroup>
          )}

          <FormGroup label="Display name" fieldId="st-display-name" isRequired>
            <TextInput
              id="st-display-name"
              value={displayName}
              onChange={(_e, v) => setDisplayName(v)}
              placeholder="Standard HDD"
              isRequired
              autoFocus={isEdit}
            />
          </FormGroup>

          <FormGroup label="Protocol" fieldId="st-protocol" isRequired>
            <Select
              isOpen={protocolOpen}
              onOpenChange={setProtocolOpen}
              selected={protocol}
              onSelect={(_e, v) => {
                setProtocol(v as Protocol);
                setProtocolOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setProtocolOpen(!protocolOpen)}
                  isExpanded={protocolOpen}
                >
                  {protocol ? protocol.toUpperCase() : 'Select protocol'}
                </MenuToggle>
              )}
            >
              <SelectList>
                {PROTOCOL_OPTIONS.map((p) => (
                  <SelectOption key={p} value={p}>
                    {p.toUpperCase()}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="QoS class" fieldId="st-qos" isRequired>
            <Select
              isOpen={qosOpen}
              onOpenChange={setQosOpen}
              selected={qosClass}
              onSelect={(_e, v) => {
                setQosClass(v as QosClass);
                setQosOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setQosOpen(!qosOpen)} isExpanded={qosOpen}>
                  {qosClass
                    ? qosClass.charAt(0).toUpperCase() + qosClass.slice(1)
                    : 'Select QoS class'}
                </MenuToggle>
              )}
            >
              <SelectList>
                {QOS_OPTIONS.map((q) => (
                  <SelectOption key={q} value={q}>
                    {q.charAt(0).toUpperCase() + q.slice(1)}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Storage class name (k8s)" fieldId="st-sc" isRequired>
            <TextInput
              id="st-sc"
              value={storageClassName}
              onChange={(_e, v) => setStorageClassName(v)}
              placeholder="ceph-rbd-fast"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Storage backend" fieldId="st-backend">
            <Select
              isOpen={backendOpen}
              onOpenChange={setBackendOpen}
              selected={storageBackend || undefined}
              onSelect={(_e, v) => {
                setStorageBackend(v as string);
                setBackendOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setBackendOpen(!backendOpen)}
                  isExpanded={backendOpen}
                >
                  {storageBackend
                    ? (backends.find((b) => b.id === storageBackend)?.metadata?.name ??
                      storageBackend)
                    : 'Select backend (optional)'}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="">— none —</SelectOption>
                {backends.map((b) => (
                  <SelectOption key={b.id} value={b.id}>
                    {b.metadata?.name ?? b.id} ({b.spec.provider.toUpperCase()})
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Price / GiB / month (USD)" fieldId="st-price">
            <TextInput
              id="st-price"
              value={pricePerGibMonth}
              onChange={(_e, v) => setPricePerGibMonth(v)}
              placeholder="0.05"
            />
          </FormGroup>

          {mutationError && (
            <Alert
              variant="danger"
              title={isEdit ? 'Failed to update storage tier' : 'Failed to create storage tier'}
              isInline
            >
              {getErrorMessage(mutationError)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="st-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              {isEdit ? 'Save changes' : 'Create'}
            </Button>
            <Button variant="link" onClick={() => navigate(BACK)} isDisabled={isPending}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
