/**
 * flow: provider-admin
 * route: /provider/organizations/new
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  LabelGroup,
  PageSection,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreateTenant } from '../../api/v1/tenant';
import { getErrorMessage } from '../../utils/error';

export const ProviderTenantNewPage = () => {
  const navigate = useNavigate();

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
    const allDomains = domainInput.trim()
      ? [...domains, domainInput.trim().toLowerCase()]
      : domains;
    await mutateAsync({
      metadata: { name: name.trim() },
      spec: { domains: allDomains },
    });
    navigate('/provider/organizations');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/provider/organizations')}>
                Organizations
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create tenant</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create tenant
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="create-tenant-form">
          {error && (
            <Alert variant="danger" isInline title="Error">
              {getErrorMessage(error)}
            </Alert>
          )}

          <FormGroup label="Internal name" isRequired fieldId="tenant-name">
            <TextInput
              id="tenant-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="acme-corp"
              isRequired
              autoFocus
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
            <Button
              variant="link"
              onClick={() => navigate('/provider/organizations')}
              isDisabled={isPending}
            >
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
