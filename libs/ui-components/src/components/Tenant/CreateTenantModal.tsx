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

import { useCreateTenant } from '../../api/v1/tenant';
import { getErrorMessage } from '../../utils/error';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTenantModal = ({ isOpen, onClose }: CreateTenantModalProps) => {
  const [name, setName] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[]>([]);

  const { mutateAsync, isPending, error } = useCreateTenant();

  const isValid = name.trim().length > 0;

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
    if (!isValid) {
      return;
    }
    // flush any pending domain input
    const allDomains = domainInput.trim()
      ? [...domains, domainInput.trim().toLowerCase()]
      : domains;
    await mutateAsync({
      metadata: { name: name.trim() },
      spec: { domains: allDomains },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Create tenant">
      <ModalHeader title="Create tenant" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="create-tenant-form">
          <FormGroup label="Internal name" isRequired fieldId="tenant-name">
            <TextInput
              id="tenant-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="acme-corp"
              isRequired
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>DNS label (lowercase letters, digits, hyphens)</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
          <FormGroup label="Email domains" fieldId="tenant-domains">
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
              id="tenant-domains"
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
            form="create-tenant-form"
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
