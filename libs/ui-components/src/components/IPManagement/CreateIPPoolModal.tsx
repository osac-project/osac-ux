import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';

import { useCreateExternalIPPool, useCreatePublicIPPool } from '../../api/v1/ip-management';
import { useTenants } from '../../api/v1/tenant';
import { getErrorMessage } from '../../utils/error';

interface CreateIPPoolModalProps {
  poolType: 'public' | 'external';
  isOpen: boolean;
  onClose: () => void;
}

const IP_FAMILIES = [
  { label: 'IPv4', value: 1 },
  { label: 'IPv6', value: 2 },
];

// Basic CIDR validation: x.x.x.x/n or IPv6-like/n
const CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$|^[0-9a-fA-F:]+\/\d{1,3}$/;

export const CreateIPPoolModal = ({ poolType, isOpen, onClose }: CreateIPPoolModalProps) => {
  const [name, setName] = useState('');
  const [ipFamily, setIpFamily] = useState(1);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [cidr, setCidr] = useState('');
  const [zone, setZone] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenantOpen, setTenantOpen] = useState(false);

  const { data: tenants = [] } = useTenants();

  const createPublic = useCreatePublicIPPool();
  const createExternal = useCreateExternalIPPool();
  const { mutateAsync, isPending, error } = poolType === 'public' ? createPublic : createExternal;

  const cidrInvalid = cidr.trim().length > 0 && !CIDR_RE.test(cidr.trim());
  const isValid = name.trim().length > 0 && !cidrInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const meta: { name: string; tenant?: string } = { name: name.trim() };
    if (tenantId) {
      meta.tenant = tenantId;
    }
    const spec: { ipFamily: number; cidr?: string; zone?: string } = { ipFamily };
    if (cidr.trim()) {
      spec.cidr = cidr.trim();
    }
    if (zone.trim()) {
      spec.zone = zone.trim();
    }
    await mutateAsync({ metadata: meta, spec });
    onClose();
  };

  const selectedTenantName = tenants.find((t) => t.id === tenantId)?.metadata?.name ?? tenantId;

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Create IP pool">
      <ModalHeader title={`Create ${poolType === 'public' ? 'public' : 'external'} IP pool`} />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="ip-pool-create-form">
          <FormGroup label="Pool name" isRequired fieldId="pool-name">
            <TextInput id="pool-name" value={name} onChange={(_e, v) => setName(v)} isRequired />
          </FormGroup>
          <FormGroup label="IP family" isRequired fieldId="pool-ip-family">
            <Select
              isOpen={familyOpen}
              onSelect={(_e, val) => {
                setIpFamily(val as number);
                setFamilyOpen(false);
              }}
              onOpenChange={setFamilyOpen}
              selected={ipFamily}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setFamilyOpen(!familyOpen)}
                  isExpanded={familyOpen}
                >
                  {IP_FAMILIES.find((f) => f.value === ipFamily)?.label ?? 'Select'}
                </MenuToggle>
              )}
            >
              {IP_FAMILIES.map((f) => (
                <SelectOption key={f.value} value={f.value}>
                  {f.label}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>
          <FormGroup
            label={
              <>
                CIDR block{' '}
                <Label isCompact color="gold" variant="outline">
                  predicted
                </Label>
              </>
            }
            fieldId="pool-cidr"
          >
            <TextInput
              id="pool-cidr"
              value={cidr}
              onChange={(_e, v) => setCidr(v)}
              placeholder={ipFamily === 2 ? 'fd00::/48' : '203.0.113.0/24'}
              validated={cidrInvalid ? 'error' : 'default'}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={cidrInvalid ? 'error' : 'default'}>
                  {cidrInvalid
                    ? 'Must be valid CIDR notation (e.g. 203.0.113.0/24)'
                    : 'Address range for this pool. Leave blank if managed by the backend.'}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup
            label={
              <>
                Zone{' '}
                <Label isCompact color="gold" variant="outline">
                  predicted
                </Label>
              </>
            }
            fieldId="pool-zone"
          >
            <TextInput
              id="pool-zone"
              value={zone}
              onChange={(_e, v) => setZone(v)}
              placeholder="us-east-1"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>Datacenter or availability zone. Optional.</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup label="Assign to tenant" fieldId="pool-tenant">
            <Select
              isOpen={tenantOpen}
              onSelect={(_e, val) => {
                setTenantId(val as string);
                setTenantOpen(false);
              }}
              onOpenChange={setTenantOpen}
              selected={tenantId || undefined}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setTenantOpen(!tenantOpen)}
                  isExpanded={tenantOpen}
                >
                  {tenantId ? selectedTenantName : 'No tenant (shared)'}
                </MenuToggle>
              )}
            >
              <SelectOption value="">No tenant (shared)</SelectOption>
              {tenants.map((t) => (
                <SelectOption key={t.id} value={t.id}>
                  {t.metadata?.name ?? t.id}
                  {t.spec?.domains?.length ? ` (${t.spec.domains.join(', ')})` : ''}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="ip-pool-create-form"
            isLoading={isPending}
            isDisabled={isPending || !isValid}
          >
            Create
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
