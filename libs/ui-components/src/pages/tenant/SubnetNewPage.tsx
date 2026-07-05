/**
 * flow: manage-networking
 * route: /networks/subnets/new
 */
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

import { resourceDisplayName, useCreateSubnet, useVirtualNetworks } from '../../api/v1/networking';
import OsacForm from '../../components/Form/OsacForm';
import { getErrorMessage } from '../../utils/error';

export const SubnetNewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVNetId = searchParams.get('vnetId') ?? '';

  const [name, setName] = React.useState('');
  const [ipv4Cidr, setIpv4Cidr] = React.useState('');
  const [selectedVNetId, setSelectedVNetId] = React.useState(preselectedVNetId);
  const [vnetSelectOpen, setVnetSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const createSubnet = useCreateSubnet();
  const { data: virtualNetworks = [] } = useVirtualNetworks({}, { enabled: !preselectedVNetId });

  const effectiveVNetId = preselectedVNetId || selectedVNetId;
  const selectedVNet = virtualNetworks.find((vn) => vn.id === selectedVNetId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ipv4Cidr.trim() || !effectiveVNetId) {
      return;
    }
    setIsPending(true);
    createSubnet.reset();
    try {
      await createSubnet.mutateAsync({
        name: name.trim(),
        virtualNetworkId: effectiveVNetId,
        ipv4Cidr: ipv4Cidr.trim(),
      });
      navigate('/networks?tab=subnets');
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
              <Button variant="link" isInline onClick={() => navigate('/networks?tab=subnets')}>
                Networks
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create subnet</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create subnet
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <OsacForm style={{ maxWidth: '480px' }} onSubmit={onSubmit} id="subnet-create-form">
          {!preselectedVNetId && (
            <FormGroup label="Virtual network" fieldId="subnet-vnet" isRequired>
              <Select
                isOpen={vnetSelectOpen}
                selected={selectedVNetId}
                onSelect={(_, value) => {
                  setSelectedVNetId(value as string);
                  setVnetSelectOpen(false);
                }}
                onOpenChange={setVnetSelectOpen}
                toggle={(ref: React.Ref<MenuToggleElement>) => (
                  <MenuToggle
                    ref={ref}
                    onClick={() => setVnetSelectOpen((o) => !o)}
                    isExpanded={vnetSelectOpen}
                    style={{ width: '100%' }}
                  >
                    {selectedVNet
                      ? resourceDisplayName(selectedVNet.metadata, selectedVNet.id)
                      : 'Select virtual network'}
                  </MenuToggle>
                )}
              >
                {virtualNetworks.map((vn) => (
                  <SelectOption key={vn.id} value={vn.id}>
                    {resourceDisplayName(vn.metadata, vn.id)}
                  </SelectOption>
                ))}
              </Select>
            </FormGroup>
          )}

          <FormGroup label="Name" fieldId="subnet-name" isRequired>
            <TextInput
              id="subnet-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="my-subnet"
              isRequired
            />
          </FormGroup>

          <FormGroup label="IPv4 CIDR" fieldId="subnet-cidr" isRequired>
            <TextInput
              id="subnet-cidr"
              value={ipv4Cidr}
              onChange={(_e, v) => setIpv4Cidr(v)}
              placeholder="10.0.1.0/24"
              isRequired
            />
          </FormGroup>

          {createSubnet.error && (
            <Alert variant="danger" title="Failed to create subnet" isInline>
              {getErrorMessage(createSubnet.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="subnet-create-form"
              isLoading={isPending}
              isDisabled={isPending || !name.trim() || !ipv4Cidr.trim() || !effectiveVNetId}
            >
              Create
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/networks?tab=subnets')}
              isDisabled={isPending}
            >
              Cancel
            </Button>
          </ActionGroup>
        </OsacForm>
      </PageSection>
    </>
  );
};
