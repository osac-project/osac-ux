/**
 * flow: provider-admin
 * route: /provider/instance-types/new
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  PageSection,
  Stack,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { type InstanceType, InstanceTypeState } from '@osac/types';

import { useCreateInstanceType } from '../../api/v1/instance-types';
import { getErrorMessage } from '../../utils/error';

export const ProviderInstanceTypeNewPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [cores, setCores] = useState('');
  const [memoryGib, setMemoryGib] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [isPending, setIsPending] = useState(false);

  const create = useCreateInstanceType();

  const isValid =
    name.trim() !== '' &&
    Number.isInteger(Number(cores)) &&
    Number(cores) > 0 &&
    Number.isInteger(Number(memoryGib)) &&
    Number(memoryGib) > 0;

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
          labels: pricePerHour.trim() ? { price_per_hour: pricePerHour.trim() } : {},
        },
        spec: {
          cores: Number(cores),
          memoryGib: Number(memoryGib),
          description: description.trim(),
          state: InstanceTypeState.ACTIVE,
        },
      } as unknown as Omit<InstanceType, 'id'>);
      navigate('/provider/instance-types');
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
              <Button variant="link" isInline onClick={() => navigate('/provider/instance-types')}>
                Instance Types
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create instance type</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create instance type
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="it-create-form">
          <FormGroup label="Identifier (name)" fieldId="it-name" isRequired>
            <TextInput
              id="it-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="small"
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label="CPU cores" fieldId="it-cores" isRequired>
            <TextInput
              id="it-cores"
              value={cores}
              onChange={(_e, v) => setCores(v)}
              placeholder="2"
              type="number"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Memory (GiB)" fieldId="it-memory" isRequired>
            <TextInput
              id="it-memory"
              value={memoryGib}
              onChange={(_e, v) => setMemoryGib(v)}
              placeholder="4"
              type="number"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="it-description">
            <TextArea
              id="it-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder="Small general-purpose instance type…"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Price per hour (USD)" fieldId="it-price">
            <TextInput
              id="it-price"
              value={pricePerHour}
              onChange={(_e, v) => setPricePerHour(v)}
              placeholder="0.05"
              type="number"
            />
          </FormGroup>

          {create.error && (
            <Alert variant="danger" title="Failed to create instance type" isInline>
              {getErrorMessage(create.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="it-create-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              Create
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/provider/instance-types')}
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
