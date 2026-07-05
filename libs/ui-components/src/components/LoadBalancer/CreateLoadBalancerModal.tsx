import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
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

import { type LoadBalancerListener, useCreateLoadBalancer } from '../../api/v1/load-balancer';
import { getErrorMessage } from '../../utils/error';

interface CreateLoadBalancerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROTOCOLS = ['HTTP', 'HTTPS', 'TCP', 'UDP'] as const;

const defaultListener = (): LoadBalancerListener => ({
  protocol: 'HTTP',
  port: 80,
  targetPort: 8080,
});

export const CreateLoadBalancerModal = ({ isOpen, onClose }: CreateLoadBalancerModalProps) => {
  const [name, setName] = useState('');
  const [virtualNetwork, setVirtualNetwork] = useState('');
  const [subnet, setSubnet] = useState('');
  const [description, setDescription] = useState('');
  const [listeners, setListeners] = useState<LoadBalancerListener[]>([defaultListener()]);
  const [protoOpen, setProtoOpen] = useState<number | null>(null);

  const { mutateAsync, isPending, error } = useCreateLoadBalancer();

  const isValid = name.trim() && virtualNetwork.trim() && subnet.trim() && listeners.length > 0;

  const updateListener = <K extends keyof LoadBalancerListener>(
    idx: number,
    key: K,
    value: LoadBalancerListener[K],
  ) => setListeners((prev) => prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    await mutateAsync({
      metadata: { name: name.trim() },
      spec: {
        virtualNetwork: virtualNetwork.trim(),
        subnet: subnet.trim(),
        listeners,
        description: description.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="medium" aria-label="Create load balancer">
      <ModalHeader title="Create load balancer" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="lb-create-form">
          <FormGroup label="Name" isRequired fieldId="lb-name">
            <TextInput id="lb-name" value={name} onChange={(_e, v) => setName(v)} isRequired />
          </FormGroup>
          <FormGroup label="Virtual network" isRequired fieldId="lb-vnet">
            <TextInput
              id="lb-vnet"
              value={virtualNetwork}
              onChange={(_e, v) => setVirtualNetwork(v)}
              placeholder="vnet-id"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Subnet" isRequired fieldId="lb-subnet">
            <TextInput
              id="lb-subnet"
              value={subnet}
              onChange={(_e, v) => setSubnet(v)}
              placeholder="subnet-id"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="lb-desc">
            <TextInput id="lb-desc" value={description} onChange={(_e, v) => setDescription(v)} />
          </FormGroup>
          <FormGroup label="Listeners" fieldId="lb-listeners">
            {listeners.map((l, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  alignItems: 'center',
                }}
              >
                <Select
                  isOpen={protoOpen === idx}
                  onSelect={(_e, val) => {
                    updateListener(idx, 'protocol', val as LoadBalancerListener['protocol']);
                    setProtoOpen(null);
                  }}
                  onOpenChange={(o) => setProtoOpen(o ? idx : null)}
                  selected={l.protocol}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setProtoOpen(protoOpen === idx ? null : idx)}
                      isExpanded={protoOpen === idx}
                    >
                      {l.protocol}
                    </MenuToggle>
                  )}
                >
                  {PROTOCOLS.map((p) => (
                    <SelectOption key={p} value={p}>
                      {p}
                    </SelectOption>
                  ))}
                </Select>
                <TextInput
                  type="number"
                  value={l.port}
                  onChange={(_e, v) => updateListener(idx, 'port', parseInt(v, 10) || 0)}
                  placeholder="Port"
                  style={{ width: '100px' }}
                />
                <span>→</span>
                <TextInput
                  type="number"
                  value={l.targetPort}
                  onChange={(_e, v) => updateListener(idx, 'targetPort', parseInt(v, 10) || 0)}
                  placeholder="Target port"
                  style={{ width: '120px' }}
                />
                {listeners.length > 1 && (
                  <Button
                    variant="plain"
                    onClick={() => setListeners((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="link"
              onClick={() => setListeners((prev) => [...prev, defaultListener()])}
            >
              + Add listener
            </Button>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="lb-create-form"
            isLoading={isPending}
            isDisabled={isPending || !isValid}
          >
            Create
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
