import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import { useCreateVolumeSnapshot } from '../../../api/v1/volume-snapshot';
import { useTranslation } from '../../../hooks/useTranslation';

interface CreateVolumeSnapshotModalProps {
  vm: ComputeInstance;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateVolumeSnapshotModal = ({
  vm,
  isOpen,
  onClose,
}: CreateVolumeSnapshotModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [diskIndex, setDiskIndex] = useState(0);
  const [diskSelectOpen, setDiskSelectOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const instanceId = vm.id ?? '';
  const { mutateAsync, isPending } = useCreateVolumeSnapshot(instanceId);

  const additionalCount = vm.spec?.additionalDisks?.length ?? 0;
  const diskOptions = [
    {
      value: 0,
      label: t('Boot disk ({{size}} GiB)', { size: vm.spec?.bootDisk?.sizeGib ?? '?' }),
    },
    ...Array.from({ length: additionalCount }, (_, i) => ({
      value: i + 1,
      label: t('Disk {{index}} ({{size}} GiB)', {
        index: i + 1,
        size: vm.spec?.additionalDisks?.[i]?.sizeGib ?? '?',
      }),
    })),
  ];

  const selectedDiskLabel = diskOptions.find((o) => o.value === diskIndex)?.label ?? t('Boot disk');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await mutateAsync({
        name: name.trim(),
        diskIndex,
        description: description.trim() || undefined,
      });
      onClose();
      setName('');
      setDiskIndex(0);
      setDescription('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Failed to create snapshot'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small" aria-label={t('Take snapshot')}>
      <ModalHeader title={t('Take snapshot')} />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title={t('Error')} style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="create-snapshot-form">
          <FormGroup label={t('Snapshot name')} isRequired fieldId="snapshot-name">
            <TextInput
              id="snapshot-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              isRequired
              placeholder="my-snapshot"
            />
          </FormGroup>
          <FormGroup label={t('Source disk')} fieldId="snapshot-disk">
            <Select
              id="snapshot-disk"
              isOpen={diskSelectOpen}
              onToggle={(_e: unknown, open: boolean) => setDiskSelectOpen(open)}
              onSelect={(_e, value) => {
                setDiskIndex(value as number);
                setDiskSelectOpen(false);
              }}
              selected={diskIndex}
              toggle={(toggleRef) => (
                <Button
                  ref={toggleRef}
                  variant="control"
                  onClick={() => setDiskSelectOpen((o) => !o)}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  {selectedDiskLabel}
                </Button>
              )}
            >
              {diskOptions.map((o) => (
                <SelectOption key={o.value} value={o.value}>
                  {o.label}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>
          <FormGroup label={t('Description')} fieldId="snapshot-desc">
            <TextInput
              id="snapshot-desc"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder={t('Optional description')}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="create-snapshot-form"
            isLoading={isPending}
            isDisabled={isPending || !name.trim()}
          >
            {t('Take snapshot')}
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
