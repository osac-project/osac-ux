/**
 * flow: object-storage
 * route: /bucket-storage/:id/edit (tenantUser, tenantAdmin)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  NumberInput,
  PageSection,
  Spinner,
  Stack,
  Switch,
  TextArea,
  Title,
} from '@patternfly/react-core';

import { useObjectStorageBucket, useUpdateObjectStorageBucket } from '../../api/v1/object-storage';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { getErrorMessage } from '../../utils/error';

export const ObjectStorageEditPage = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();

  const { data: bucket, isLoading, error: loadError } = useObjectStorageBucket(id);
  const { mutateAsync, isPending, error: saveError } = useUpdateObjectStorageBucket();

  const [quotaGib, setQuotaGib] = useState<number | ''>(0);
  const [versioning, setVersioning] = useState(false);
  const [description, setDescription] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (bucket && !initialized) {
      setQuotaGib(bucket.spec.quotaGib ?? '');
      setVersioning(bucket.spec.versioning ?? false);
      setDescription(bucket.spec.description ?? '');
      setInitialized(true);
    }
  }, [bucket, initialized]);

  if (isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading bucket" />
      </PageSection>
    );
  }

  if (loadError || !bucket) {
    return <ResourceDetailsPageError error={loadError} />;
  }

  const name = bucket.metadata?.name ?? bucket.id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await mutateAsync({
      id: bucket.id,
      patch: {
        quotaGib: quotaGib === '' ? undefined : quotaGib,
        versioning,
        description: description.trim() || undefined,
      },
    });
    navigate(`/bucket-storage/${bucket.id}`);
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
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(`/bucket-storage/${id}`)}>
                {name}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Edit</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Edit — {name}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="edit-bucket-form">
          {saveError && (
            <Alert variant="danger" isInline title="Failed to update bucket">
              {getErrorMessage(saveError)}
            </Alert>
          )}

          <FormGroup
            label="Quota (GiB)"
            fieldId="edit-quota"
            helperText="Set to 0 or leave empty for no limit."
          >
            <NumberInput
              id="edit-quota"
              value={quotaGib === '' ? 0 : quotaGib}
              min={0}
              onMinus={() => setQuotaGib((v) => Math.max(0, (v === '' ? 0 : v) - 1))}
              onPlus={() => setQuotaGib((v) => (v === '' ? 1 : v + 1))}
              onChange={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                setQuotaGib(isNaN(val) ? '' : val);
              }}
            />
          </FormGroup>

          <FormGroup label="Versioning" fieldId="edit-versioning">
            <Switch
              id="edit-versioning"
              label="Enabled"
              labelOff="Disabled"
              isChecked={versioning}
              onChange={(_e, checked) => setVersioning(checked)}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="edit-description">
            <TextArea
              id="edit-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
              resizeOrientation="vertical"
              placeholder="Optional description"
            />
          </FormGroup>

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="edit-bucket-form"
              isLoading={isPending}
              isDisabled={isPending}
            >
              Save changes
            </Button>
            <Button
              variant="link"
              onClick={() => navigate(`/bucket-storage/${id}`)}
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
