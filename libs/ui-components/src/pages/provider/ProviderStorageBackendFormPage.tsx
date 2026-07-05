/**
 * flow: storage-backends
 * route: /provider/storage-backends/new
 * route: /provider/storage-backends/:id/edit
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
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import type { StorageBackend } from '../../api/v1/storage-backend';
import {
  usePatchStorageBackend,
  useRegisterStorageBackend,
  useStorageBackends,
} from '../../api/v1/storage-backend';
import { getErrorMessage } from '../../utils/error';

const PROVIDERS = ['ceph', 'nfs', 's3'] as const;
type Provider = (typeof PROVIDERS)[number];

const BACK = '/provider/storage-backends';

export const ProviderStorageBackendFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: backends = [], isLoading: loadingList } = useStorageBackends();
  const existing: StorageBackend | undefined = isEdit
    ? backends.find((b) => b.id === id)
    : undefined;

  const [name, setName] = useState('');
  const [provider, setProvider] = useState<Provider | ''>('');
  const [providerOpen, setProviderOpen] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [description, setDescription] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);

  useEffect(() => {
    if (isEdit && existing && !hydrated) {
      setEndpoint(existing.spec.endpoint);
      setDescription(existing.spec.description ?? existing.metadata?.description ?? '');
      setUsername(existing.spec.credentials?.username ?? '');
      setHydrated(true);
    }
  }, [isEdit, existing, hydrated]);

  const register = useRegisterStorageBackend();
  const patch = usePatchStorageBackend();

  const mutationError = isEdit ? patch.error : register.error;
  const isValid = isEdit
    ? endpoint.trim() !== ''
    : name.trim() !== '' && provider !== '' && endpoint.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    setIsPending(true);
    register.reset();
    patch.reset();
    try {
      if (isEdit && existing) {
        await patch.mutateAsync({
          id: existing.id,
          patch: {
            metadata: { ...existing.metadata, description: description.trim() || undefined },
            spec: {
              ...existing.spec,
              endpoint: endpoint.trim(),
              description: description.trim() || undefined,
              credentials: username.trim()
                ? {
                    username: username.trim(),
                    password: password || existing.spec.credentials?.password,
                  }
                : undefined,
            },
          },
        });
      } else {
        await register.mutateAsync({
          metadata: { name: name.trim(), description: description.trim() || undefined },
          spec: {
            provider: provider as Provider,
            endpoint: endpoint.trim(),
            description: description.trim() || undefined,
            credentials: username.trim() ? { username: username.trim(), password } : undefined,
          },
        });
      }
      navigate(BACK);
    } finally {
      setIsPending(false);
    }
  };

  if (isEdit && (loadingList || !hydrated)) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading storage backend" />
      </PageSection>
    );
  }

  if (isEdit && !existing) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="danger" isInline title={`Storage backend "${id}" not found`} />
      </PageSection>
    );
  }

  const backendName = isEdit ? (existing?.metadata?.name ?? id) : undefined;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACK)}>
                Storage Backends
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit ? `Edit — ${backendName}` : 'Register storage backend'}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? 'Edit storage backend' : 'Register storage backend'}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="sb-form">
          {!isEdit && (
            <FormGroup label="Identifier (name)" fieldId="sb-name" isRequired>
              <TextInput
                id="sb-name"
                value={name}
                onChange={(_e, v) => setName(v)}
                placeholder="ceph-prod"
                isRequired
                autoFocus
              />
            </FormGroup>
          )}

          {!isEdit && (
            <FormGroup label="Provider" fieldId="sb-provider" isRequired>
              <Select
                isOpen={providerOpen}
                onOpenChange={setProviderOpen}
                selected={provider}
                onSelect={(_e, v) => {
                  setProvider(v as Provider);
                  setProviderOpen(false);
                }}
                toggle={(ref) => (
                  <MenuToggle
                    ref={ref}
                    onClick={() => setProviderOpen(!providerOpen)}
                    isExpanded={providerOpen}
                  >
                    {provider ? provider.toUpperCase() : 'Select provider'}
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {PROVIDERS.map((p) => (
                    <SelectOption key={p} value={p}>
                      {p.toUpperCase()}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </FormGroup>
          )}

          <FormGroup label="Endpoint" fieldId="sb-endpoint" isRequired>
            <TextInput
              id="sb-endpoint"
              value={endpoint}
              onChange={(_e, v) => setEndpoint(v)}
              placeholder="https://ceph.example.com:8080"
              isRequired
              autoFocus={isEdit}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="sb-description">
            <TextArea
              id="sb-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Credentials — username" fieldId="sb-username">
            <TextInput
              id="sb-username"
              value={username}
              onChange={(_e, v) => setUsername(v)}
              placeholder="osac"
              autoComplete="off"
            />
          </FormGroup>

          <FormGroup
            label={
              isEdit
                ? 'Credentials — new password (leave blank to keep current)'
                : 'Credentials — password'
            }
            fieldId="sb-password"
          >
            <TextInput
              id="sb-password"
              type="password"
              value={password}
              onChange={(_e, v) => setPassword(v)}
              autoComplete="new-password"
            />
          </FormGroup>

          {mutationError && (
            <Alert
              variant="danger"
              title={
                isEdit ? 'Failed to update storage backend' : 'Failed to register storage backend'
              }
              isInline
            >
              {getErrorMessage(mutationError)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="sb-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              {isEdit ? 'Save changes' : 'Register'}
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
