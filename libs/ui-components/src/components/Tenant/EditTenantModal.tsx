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
  LabelGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@patternfly/react-core';

import type { Tenant } from '../../api/v1/tenant';
import { usePatchTenant } from '../../api/v1/tenant';
import { getErrorMessage } from '../../utils/error';

interface EditTenantModalProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTenantModal = ({ tenant, isOpen, onClose }: EditTenantModalProps) => {
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[]>(tenant.spec?.domains ?? []);

  const { mutateAsync, isPending, error } = usePatchTenant();

  const addDomain = () => {
    const trimmed = domainInput.trim().toLowerCase();
    if (trimmed && !domains.includes(trimmed)) {
      setDomains((prev) => [...prev, trimmed]);
      setDomainInput('');
    }
  };

  const handleDomainKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addDomain();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allDomains = domainInput.trim()
      ? [...domains, domainInput.trim().toLowerCase()]
      : domains;
    await mutateAsync({ id: tenant.id, patch: { spec: { domains: allDomains } } });
    onClose();
  };

  const tenantName = tenant.metadata?.name ?? tenant.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Edit tenant">
      <ModalHeader title={`Edit "${tenantName}"`} />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="edit-tenant-form">
          <FormGroup label="Email domains" fieldId="edit-tenant-domains">
            {domains.length > 0 && (
              <LabelGroup style={{ marginBottom: '0.5rem' }}>
                {domains.map((d) => (
                  <Label
                    key={d}
                    isCompact
                    onClose={() => setDomains((prev) => prev.filter((x) => x !== d))}
                  >
                    {d}
                  </Label>
                ))}
              </LabelGroup>
            )}
            <TextInput
              id="edit-tenant-domains"
              value={domainInput}
              onChange={(_e, v) => setDomainInput(v)}
              onKeyDown={handleDomainKeyDown}
              onBlur={addDomain}
              placeholder="example.com (press Enter to add)"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  Used for IdP login routing. Press Enter or comma to add each domain.
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="edit-tenant-form"
            isLoading={isPending}
            isDisabled={isPending}
          >
            Save
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
