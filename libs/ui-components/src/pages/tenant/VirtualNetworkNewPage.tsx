/**
 * flow: manage-networking
 * route: /networks/new
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectOption,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';

import { useCreateVirtualNetwork, useNetworkClasses } from '../../api/v1/networking';
import OsacForm from '../../components/Form/OsacForm';
import { getErrorMessage } from '../../utils/error';

export const VirtualNetworkNewPage = () => {
  const navigate = useNavigate();
  const [name, setName] = React.useState('');
  const [networkClass, setNetworkClass] = React.useState('');
  const [ipv4Cidr, setIpv4Cidr] = React.useState('');
  const [classSelectOpen, setClassSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const { data: networkClasses = [] } = useNetworkClasses();
  const createVNet = useCreateVirtualNetwork();

  const defaultClass = networkClasses.find((nc) => nc.isDefault);
  const selectedClassId = networkClass || defaultClass?.id || '';
  const selectedClass = networkClasses.find((nc) => nc.id === selectedClassId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedClassId) {
      return;
    }
    setIsPending(true);
    createVNet.reset();
    try {
      await createVNet.mutateAsync({
        name: name.trim(),
        networkClass: selectedClassId,
        ipv4Cidr: ipv4Cidr.trim() || undefined,
      });
      navigate('/networks');
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
              <Button variant="link" isInline onClick={() => navigate('/networks')}>
                Networks
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create virtual network</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create virtual network
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <OsacForm style={{ maxWidth: '480px' }} onSubmit={onSubmit} id="vnet-create-form">
          <FormGroup label="Name" fieldId="vnet-name" isRequired>
            <TextInput
              id="vnet-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="my-network"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Network class" fieldId="vnet-class" isRequired>
            <Select
              isOpen={classSelectOpen}
              selected={selectedClassId}
              onSelect={(_, value) => {
                setNetworkClass(value as string);
                setClassSelectOpen(false);
              }}
              onOpenChange={setClassSelectOpen}
              toggle={(ref: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setClassSelectOpen(!classSelectOpen)}
                  isExpanded={classSelectOpen}
                  style={{ width: '100%' }}
                >
                  {selectedClass
                    ? selectedClass.title || selectedClass.metadata?.name || selectedClass.id
                    : 'Select network class'}
                </MenuToggle>
              )}
            >
              {networkClasses.map((nc) => (
                <SelectOption key={nc.id} value={nc.id}>
                  {nc.title || nc.metadata?.name || nc.id}
                  {nc.isDefault ? ' (default)' : ''}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="IPv4 CIDR (optional)" fieldId="vnet-cidr">
            <TextInput
              id="vnet-cidr"
              value={ipv4Cidr}
              onChange={(_e, v) => setIpv4Cidr(v)}
              placeholder="10.0.0.0/16"
            />
          </FormGroup>

          {createVNet.error && (
            <Alert variant="danger" title="Failed to create virtual network" isInline>
              {getErrorMessage(createVNet.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="vnet-create-form"
              isLoading={isPending}
              isDisabled={isPending || !name.trim() || !selectedClassId}
            >
              Create
            </Button>
            <Button variant="link" onClick={() => navigate('/networks')} isDisabled={isPending}>
              Cancel
            </Button>
          </ActionGroup>
        </OsacForm>
      </PageSection>
    </>
  );
};
