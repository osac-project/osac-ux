/**
 * flow: provider-admin
 * route: /provider/host-types/new
 */
import React, { useState } from 'react';
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
  PageSection,
  Stack,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import type { HostType } from '@osac/types';

import { useCreateHostType } from '../../api/v1/host-types';
import { getErrorMessage } from '../../utils/error';

export const ProviderHostTypeNewPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [isGpu, setIsGpu] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const create = useCreateHostType();

  const isValid = Boolean(name.trim() && title.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    setIsPending(true);
    create.reset();
    try {
      await create.mutateAsync({
        metadata: {
          name: name.trim(),
          labels: {
            ...(pricePerHour.trim() ? { price_per_hour: pricePerHour.trim() } : {}),
            ...(isGpu ? { gpu: 'true' } : {}),
          },
        },
        title: title.trim(),
        description: description.trim(),
      } as unknown as Omit<HostType, 'id'>);
      navigate('/provider/host-types');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/provider/host-types')}>
                Host Types
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create host type</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create host type
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="ht-create-form">
          <FormGroup label="Identifier (name)" fieldId="ht-name" isRequired>
            <TextInput
              id="ht-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="ibm-mi300x"
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label="Title" fieldId="ht-title" isRequired>
            <TextInput
              id="ht-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="IBM MI300X GPU Server"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="ht-description">
            <TextArea
              id="ht-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder="Hardware characteristics, CPU, RAM, GPU, storage… (Markdown supported)"
              rows={4}
            />
          </FormGroup>

          <FormGroup label="Price per hour (USD)" fieldId="ht-price">
            <TextInput
              id="ht-price"
              value={pricePerHour}
              onChange={(_e, v) => setPricePerHour(v)}
              placeholder="4.50"
              type="number"
            />
          </FormGroup>

          <FormGroup fieldId="ht-gpu">
            <Checkbox
              id="ht-gpu"
              label="GPU accelerator node"
              isChecked={isGpu}
              onChange={(_e, v) => setIsGpu(v)}
            />
          </FormGroup>

          {create.error && (
            <Alert variant="danger" title="Failed to create host type" isInline>
              {getErrorMessage(create.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="ht-create-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              Create
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/provider/host-types')}
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
