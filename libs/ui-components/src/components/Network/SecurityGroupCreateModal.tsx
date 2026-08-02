import React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';

import { Protocol } from '@osac/types';

import { SecurityRulesFields } from './SecurityRulesFields';
import {
  resourceDisplayName,
  useCreateSecurityGroup,
  useVirtualNetworks,
} from '../../api/v1/networking';
import type { SecurityRuleInput } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import OsacForm from '../Form/OsacForm';

interface SecurityGroupCreateModalProps {
  virtualNetworkId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const defaultEgressRule = (): SecurityRuleInput => ({
  protocol: Protocol.ALL,
  ipv4Cidr: '0.0.0.0/0',
});

export const SecurityGroupCreateModal = ({
  virtualNetworkId: preselectedVNetId,
  onClose,
  onSuccess,
}: SecurityGroupCreateModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [ingress, setIngress] = React.useState<SecurityRuleInput[]>([]);
  const [egress, setEgress] = React.useState<SecurityRuleInput[]>([defaultEgressRule()]);
  const [selectedVNetId, setSelectedVNetId] = React.useState(preselectedVNetId ?? '');
  const [vnetSelectOpen, setVnetSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const createSG = useCreateSecurityGroup();
  const { data: virtualNetworks = [] } = useVirtualNetworks({}, { enabled: !preselectedVNetId });

  const effectiveVNetId = preselectedVNetId ?? selectedVNetId;

  const onSubmit = async () => {
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
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  const selectedVNet = virtualNetworks.find((vn) => vn.id === selectedVNetId);

  return (
    <Modal
      variant="large"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="sg-create-title"
    >
      <ModalHeader title={t('Create security group')} labelId="sg-create-title" />
      <ModalBody>
        <OsacForm isResponsive={false}>
          {!preselectedVNetId && (
            <FormGroup label={t('Virtual network')} fieldId="sg-vnet" isRequired>
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
                      : t('Select virtual network')}
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

          <FormGroup label={t('Name')} fieldId="sg-name" isRequired>
            <TextInput
              id="sg-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="my-security-group"
              isRequired
            />
          </FormGroup>

          <SecurityRulesFields label={t('Ingress rules')} rules={ingress} onChange={setIngress} />
          <SecurityRulesFields label={t('Egress rules')} rules={egress} onChange={setEgress} />

          {createSG.error && (
            <Alert variant="danger" title={t('Failed to create security group')} isInline>
              {getErrorMessage(createSG.error)}
            </Alert>
          )}
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={isPending || !name.trim() || !effectiveVNetId}
          isLoading={isPending}
        >
          {t('Create')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
