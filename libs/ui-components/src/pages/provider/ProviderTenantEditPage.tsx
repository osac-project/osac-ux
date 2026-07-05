/**
 * flow: provider-admin
 * route: /provider/organizations/:id/edit
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Spinner,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { usePatchTenant, useTenants } from '../../api/v1/tenant';
import { getErrorMessage } from '../../utils/error';

export const ProviderTenantEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: tenants = [], isLoading } = useTenants();
  const tenant = tenants.find((t) => t.id === id);

  const [domainInput, setDomainInput] = useState('');
  const [domains, setDomains] = useState<string[] | null>(null);

  const { mutateAsync, isPending, error } = usePatchTenant();

  const effectiveDomains = domains ?? tenant?.spec?.domains ?? [];

  const addDomain = () => {
    const trimmed = domainInput.trim().toLowerCase();
    if (trimmed && !effectiveDomains.includes(trimmed)) {
      setDomains([...effectiveDomains, trimmed]);
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
    if (!tenant) {
      return;
    }
    const allDomains = domainInput.trim()
      ? [...effectiveDomains, domainInput.trim().toLowerCase()]
      : effectiveDomains;
    await mutateAsync({ id: tenant.id, patch: { spec: { domains: allDomains } } });
    navigate('/provider/organizations');
  };

  if (isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading tenant" />
      </PageSection>
    );
  }

  if (!tenant) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="danger" isInline title={`Tenant "${id}" not found`} />
      </PageSection>
    );
  }

  const tenantName = tenant.metadata?.name ?? tenant.id;

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
            <BreadcrumbItem isActive>Edit — {tenantName}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Edit tenant — {tenantName}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="edit-tenant-form">
          {error && (
            <Alert variant="danger" isInline title="Error">
              {getErrorMessage(error)}
            </Alert>
          )}

          <FormGroup label="Email domains" fieldId="edit-tenant-domains">
            {effectiveDomains.length > 0 && (
              <LabelGroup style={{ marginBottom: '0.5rem' }}>
                {effectiveDomains.map((d) => (
                  <Label
                    key={d}
                    isCompact
                    onClose={() => setDomains(effectiveDomains.filter((x) => x !== d))}
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
