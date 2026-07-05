/**
 * flow: manage-networking
 * route: /networks/security-groups/new
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

import { Protocol } from '@osac/types';

import {
  resourceDisplayName,
  useCreateSecurityGroup,
  useVirtualNetworks,
} from '../../api/v1/networking';
import type { SecurityRuleInput } from '../../api/v1/networking';
import OsacForm from '../../components/Form/OsacForm';
import { SecurityRulesFields } from '../../components/Network/SecurityRulesFields';
import { getErrorMessage } from '../../utils/error';

const defaultEgressRule = (): SecurityRuleInput => ({
  protocol: Protocol.ALL,
  ipv4Cidr: '0.0.0.0/0',
});

export const SecurityGroupNewPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVNetId = searchParams.get('vnetId') ?? '';

  const [name, setName] = React.useState('');
  const [ingress, setIngress] = React.useState<SecurityRuleInput[]>([]);
  const [egress, setEgress] = React.useState<SecurityRuleInput[]>([defaultEgressRule()]);
  const [selectedVNetId, setSelectedVNetId] = React.useState(preselectedVNetId);
  const [vnetSelectOpen, setVnetSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const createSG = useCreateSecurityGroup();
  const { data: virtualNetworks = [] } = useVirtualNetworks({}, { enabled: !preselectedVNetId });

  const effectiveVNetId = preselectedVNetId || selectedVNetId;
  const selectedVNet = virtualNetworks.find((vn) => vn.id === selectedVNetId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !effectiveVNetId) {
      return;
    }
    setIsPending(true);
    createSG.reset();
    try {
      await createSG.mutateAsync({
        name: name.trim(),
        virtualNetworkId: effectiveVNetId,
        ingress,
        egress,
      });
      navigate('/networks?tab=security-groups');
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
              <Button
                variant="link"
                isInline
                onClick={() => navigate('/networks?tab=security-groups')}
              >
                Networks
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create security group</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create security group
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <OsacForm
          isResponsive={false}
          style={{ maxWidth: '720px' }}
          onSubmit={onSubmit}
          id="sg-create-form"
        >
          {!preselectedVNetId && (
            <FormGroup label="Virtual network" fieldId="sg-vnet" isRequired>
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

          <FormGroup label="Name" fieldId="sg-name" isRequired>
            <TextInput
              id="sg-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="my-security-group"
              isRequired
            />
          </FormGroup>

          <SecurityRulesFields label="Ingress rules" rules={ingress} onChange={setIngress} />
          <SecurityRulesFields label="Egress rules" rules={egress} onChange={setEgress} />

          {createSG.error && (
            <Alert variant="danger" title="Failed to create security group" isInline>
              {getErrorMessage(createSG.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="sg-create-form"
              isLoading={isPending}
              isDisabled={isPending || !name.trim() || !effectiveVNetId}
            >
              Create
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/networks?tab=security-groups')}
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
