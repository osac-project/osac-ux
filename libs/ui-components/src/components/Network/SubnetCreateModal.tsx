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

import { resourceDisplayName, useCreateSubnet, useVirtualNetworks } from '../../api/v1/networking';
import { getErrorMessage } from '../../utils/error';
import OsacForm from '../Form/OsacForm';

interface SubnetCreateModalProps {
  virtualNetworkId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubnetCreateModal = ({
  virtualNetworkId: preselectedVNetId,
  onClose,
  onSuccess,
}: SubnetCreateModalProps) => {
  const [name, setName] = React.useState('');
  const [ipv4Cidr, setIpv4Cidr] = React.useState('');
  const [selectedVNetId, setSelectedVNetId] = React.useState(preselectedVNetId ?? '');
  const [vnetSelectOpen, setVnetSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const createSubnet = useCreateSubnet();
  const { data: virtualNetworks = [] } = useVirtualNetworks({}, { enabled: !preselectedVNetId });

  const effectiveVNetId = preselectedVNetId ?? selectedVNetId;

  const onSubmit = async () => {
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
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  const selectedVNet = virtualNetworks.find((vn) => vn.id === selectedVNetId);

  return (
    <Modal
      variant="small"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="subnet-create-title"
    >
      <ModalHeader title="Create subnet" labelId="subnet-create-title" />
      <ModalBody>
        <OsacForm>
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
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={isPending || !name.trim() || !ipv4Cidr.trim() || !effectiveVNetId}
          isLoading={isPending}
        >
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
};
