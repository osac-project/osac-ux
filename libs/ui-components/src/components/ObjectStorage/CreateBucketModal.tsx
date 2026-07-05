import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
  TextInput,
} from '@patternfly/react-core';

import { useCreateObjectStorageBucket } from '../../api/v1/object-storage';

interface CreateBucketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBucketModal = ({ isOpen, onClose }: CreateBucketModalProps) => {
  const [name, setName] = useState('');
  const [quotaGib, setQuotaGib] = useState<number | undefined>(undefined);
  const [versioning, setVersioning] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useCreateObjectStorageBucket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutateAsync({
        name: name.trim(),
        quotaGib: quotaGib ?? undefined,
        versioning,
        description: description.trim() || undefined,
      });
      onClose();
      setName('');
      setQuotaGib(undefined);
      setVersioning(false);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bucket');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label="Create bucket">
      <ModalHeader title="Create object storage bucket" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="create-bucket-form">
          <FormGroup label="Bucket name" isRequired fieldId="bucket-name">
            <TextInput
              id="bucket-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              isRequired
              placeholder="my-bucket"
            />
          </FormGroup>
          <FormGroup label="Quota (GiB)" fieldId="bucket-quota">
            <NumberInput
              id="bucket-quota"
              value={quotaGib ?? ''}
              onMinus={() => setQuotaGib((q) => Math.max(1, (q ?? 1) - 1))}
              onPlus={() => setQuotaGib((q) => (q ?? 0) + 1)}
              onChange={(e) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                setQuotaGib(isNaN(v) ? undefined : v);
              }}
              min={1}
              placeholder="No limit"
            />
          </FormGroup>
          <FormGroup fieldId="bucket-versioning">
            <Checkbox
              id="bucket-versioning"
              label="Enable versioning"
              isChecked={versioning}
              onChange={(_e, checked) => setVersioning(checked)}
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="bucket-desc">
            <TextInput
              id="bucket-desc"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder="Optional description"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="create-bucket-form"
            isLoading={isPending}
            isDisabled={isPending || !name.trim()}
          >
            Create bucket
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
