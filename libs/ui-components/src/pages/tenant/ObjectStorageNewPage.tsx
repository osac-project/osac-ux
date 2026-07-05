/**
 * flow: object-storage
 * route: /bucket-storage/new (tenantUser, tenantAdmin)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Form,
  FormGroup,
  NumberInput,
  PageSection,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreateObjectStorageBucket } from '../../api/v1/object-storage';

export const ObjectStorageNewPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [quotaGib, setQuotaGib] = useState<number | undefined>(undefined);
  const [versioning, setVersioning] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useCreateObjectStorageBucket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutateAsync({
        name: name.trim(),
        quotaGib: quotaGib ?? undefined,
        versioning,
        description: description.trim() || undefined,
      });
      navigate('/bucket-storage');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/bucket-storage')}>
                Storage Buckets
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create bucket</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create object storage bucket
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="create-bucket-form">
          {error && (
            <Alert variant="danger" isInline title="Error">
              {error}
            </Alert>
          )}

          <FormGroup label="Bucket name" isRequired fieldId="bucket-name">
            <TextInput
              id="bucket-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              isRequired
              placeholder="my-bucket"
              autoFocus
            />
          </FormGroup>

          <FormGroup label="Quota (GiB)" fieldId="bucket-quota">
            <NumberInput
              id="bucket-quota"
              value={quotaGib ?? ''}
              onMinus={() => setQuotaGib((q) => Math.max(1, (q ?? 1) - 1))}
              onPlus={() => setQuotaGib((q) => (q ?? 0) + 1)}
              onChange={(e) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                setQuotaGib(isNaN(v) ? undefined : v);
              }}
              min={1}
              placeholder="No limit"
            />
          </FormGroup>

          <FormGroup fieldId="bucket-versioning">
            <Checkbox
              id="bucket-versioning"
              label="Enable versioning"
              isChecked={versioning}
              onChange={(_e, checked) => setVersioning(checked)}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="bucket-desc">
            <TextInput
              id="bucket-desc"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder="Optional description"
            />
          </FormGroup>

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="create-bucket-form"
              isLoading={isPending}
              isDisabled={isPending || !name.trim()}
            >
              Create bucket
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/bucket-storage')}
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
