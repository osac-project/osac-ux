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

import { useCreateVirtualNetwork, useNetworkClasses } from '../../api/v1/networking';
import { getErrorMessage } from '../../utils/error';
import OsacForm from '../Form/OsacForm';

interface VirtualNetworkCreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const VirtualNetworkCreateModal = ({
  onClose,
  onSuccess,
}: VirtualNetworkCreateModalProps) => {
  const [name, setName] = React.useState('');
  const [networkClass, setNetworkClass] = React.useState('');
  const [ipv4Cidr, setIpv4Cidr] = React.useState('');
  const [classSelectOpen, setClassSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const { data: networkClasses = [] } = useNetworkClasses();
  const createVNet = useCreateVirtualNetwork();

  const defaultClass = networkClasses.find((nc) => nc.isDefault);
  const selectedClassId = networkClass || defaultClass?.id || '';

  const onSubmit = async () => {
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
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  const selectedClass = networkClasses.find((nc) => nc.id === selectedClassId);

  return (
    <Modal
      variant="medium"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="vnet-create-title"
    >
      <ModalHeader title="Create virtual network" labelId="vnet-create-title" />
      <ModalBody>
        <OsacForm>
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
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          isDisabled={isPending || !name.trim() || !selectedClassId}
          isLoading={isPending}
        >
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
};
