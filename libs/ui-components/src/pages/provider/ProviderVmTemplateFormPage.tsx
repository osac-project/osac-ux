/**
 * flow: provider-admin
 * route: /provider/templates/vm/new
 * route: /provider/templates/vm/:id/edit
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

import {
  useComputeInstanceTemplate,
  useCreateComputeInstanceTemplate,
  usePatchComputeInstanceTemplate,
} from '../../api/v1/compute-instance-templates';
import { useInstanceTypes } from '../../api/v1/instance-types';
import { getErrorMessage } from '../../utils/error';

const BACK = '/provider/templates?tab=vm';

export const ProviderVmTemplateFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: existing, isLoading: loadingExisting } = useComputeInstanceTemplate(id ?? '');
  const { data: instanceTypes = [] } = useInstanceTypes();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instanceTypeId, setInstanceTypeId] = useState('');
  const [imageRef, setImageRef] = useState('');
  const [selectOpen, setSelectOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(!isEdit);

  useEffect(() => {
    if (isEdit && existing && !hydrated) {
      setName(existing.metadata?.name ?? '');
      setTitle(existing.title ?? '');
      setDescription(existing.description ?? '');
      setInstanceTypeId(existing.specDefaults?.instanceType ?? '');
      setImageRef(existing.specDefaults?.image?.sourceRef ?? '');
      setHydrated(true);
    }
  }, [isEdit, existing, hydrated]);

  const create = useCreateComputeInstanceTemplate();
  const patch = usePatchComputeInstanceTemplate();

  const mutationError = isEdit ? patch.error : create.error;
  const selectedIt = instanceTypes.find((it) => it.id === instanceTypeId);
  const isValid = isEdit ? Boolean(title.trim()) : Boolean(name.trim() && title.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    setIsPending(true);
    create.reset();
    patch.reset();
    try {
      if (isEdit && existing) {
        await patch.mutateAsync({
          id: existing.id,
          patch: {
            title: title.trim(),
            description: description.trim(),
            specDefaults: {
              instanceType: instanceTypeId || undefined,
              image: imageRef.trim() ? { sourceRef: imageRef.trim() } : undefined,
            },
          } as Parameters<typeof patch.mutateAsync>[0]['patch'],
        });
      } else {
        await create.mutateAsync({
          metadata: { name: name.trim() },
          title: title.trim(),
          description: description.trim(),
          specDefaults: {
            instanceType: instanceTypeId || undefined,
            image: imageRef.trim() ? { sourceRef: imageRef.trim() } : undefined,
          },
          parameters: [],
        } as never);
      }
      navigate(BACK);
    } finally {
      setIsPending(false);
    }
  };

  if (isEdit && loadingExisting) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading VM template" />
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/provider/templates')}>
                Templates
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit
                ? `Edit VM template — ${existing?.metadata?.name ?? id}`
                : 'Create VM template'}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? 'Edit VM template' : 'Create VM template'}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="vmt-form">
          {!isEdit && (
            <FormGroup label="Identifier (name)" fieldId="vmt-name" isRequired>
              <TextInput
                id="vmt-name"
                value={name}
                onChange={(_e, v) => setName(v)}
                placeholder="rhel9-standard"
                isRequired
                autoFocus
              />
            </FormGroup>
          )}

          <FormGroup label="Title" fieldId="vmt-title" isRequired>
            <TextInput
              id="vmt-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="RHEL 9 Standard"
              isRequired
              autoFocus={isEdit}
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="vmt-description">
            <TextArea
              id="vmt-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Default instance type" fieldId="vmt-instance-type">
            <Select
              isOpen={selectOpen}
              onOpenChange={setSelectOpen}
              selected={instanceTypeId}
              onSelect={(_e, v) => {
                setInstanceTypeId(v as string);
                setSelectOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setSelectOpen(!selectOpen)}
                  isExpanded={selectOpen}
                >
                  {selectedIt?.metadata?.name ?? 'Select instance type'}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="">None</SelectOption>
                {instanceTypes.map((it) => (
                  <SelectOption key={it.id} value={it.id}>
                    {it.metadata?.name ?? it.id}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label="Default image source ref" fieldId="vmt-image">
            <TextInput
              id="vmt-image"
              value={imageRef}
              onChange={(_e, v) => setImageRef(v)}
              placeholder="quay.io/containerdisks/rhel:9.4"
            />
          </FormGroup>

          {mutationError && (
            <Alert
              variant="danger"
              title={isEdit ? 'Failed to update VM template' : 'Failed to create VM template'}
              isInline
            >
              {getErrorMessage(mutationError)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="vmt-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              {isEdit ? 'Save' : 'Create'}
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
