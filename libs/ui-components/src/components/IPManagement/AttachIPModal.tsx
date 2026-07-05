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

import {
  useCreateExternalIPAttachment,
  useCreatePublicIPAttachment,
} from '../../api/v1/ip-management';
import { getErrorMessage } from '../../utils/error';

type TargetCase = 'computeInstance' | 'cluster' | 'baremetalInstance';

interface AttachIPModalProps {
  ipType: 'public' | 'external';
  ipId: string;
  isOpen: boolean;
  onClose: () => void;
}

const TARGET_TYPES: { label: string; value: TargetCase }[] = [
  { label: 'Virtual Machine', value: 'computeInstance' },
  { label: 'Cluster', value: 'cluster' },
  { label: 'Bare Metal Instance', value: 'baremetalInstance' },
];

export const AttachIPModal = ({ ipType, ipId, isOpen, onClose }: AttachIPModalProps) => {
  const [targetType, setTargetType] = useState<TargetCase>('computeInstance');
  const [targetId, setTargetId] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);

  const createPublicAttachment = useCreatePublicIPAttachment();
  const createExternalAttachment = useCreateExternalIPAttachment();
  const { isPending, error } =
    ipType === 'public' ? createPublicAttachment : createExternalAttachment;

  const isValid = targetId.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    if (ipType === 'public') {
      await createPublicAttachment.mutateAsync({
        spec: { publicIp: ipId, target: { case: targetType, value: targetId.trim() } },
      });
    } else {
      await createExternalAttachment.mutateAsync({
        spec: { externalIp: ipId, target: { case: targetType, value: targetId.trim() } },
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Attach IP">
      <ModalHeader title={`Attach ${ipType === 'public' ? 'public' : 'external'} IP`} />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="attach-ip-form">
          <FormGroup label="Attach to" isRequired fieldId="attach-target-type">
            <Select
              isOpen={typeOpen}
              onSelect={(_e, val) => {
                setTargetType(val as TargetCase);
                setTypeOpen(false);
              }}
              onOpenChange={setTypeOpen}
              selected={targetType}
              toggle={(ref) => (
                <MenuToggle ref={ref} onClick={() => setTypeOpen(!typeOpen)} isExpanded={typeOpen}>
                  {TARGET_TYPES.find((t) => t.value === targetType)?.label ?? 'Select type'}
                </MenuToggle>
              )}
            >
              {TARGET_TYPES.map((t) => (
                <SelectOption key={t.value} value={t.value}>
                  {t.label}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label="Resource ID" isRequired fieldId="attach-target-id">
            <TextInput
              id="attach-target-id"
              value={targetId}
              onChange={(_e, v) => setTargetId(v)}
              placeholder="e.g. vm-001"
              isRequired
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="attach-ip-form"
            isLoading={isPending}
            isDisabled={isPending || !isValid}
          >
            Attach
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
