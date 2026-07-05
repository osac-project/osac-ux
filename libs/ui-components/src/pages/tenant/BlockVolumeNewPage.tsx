/**
 * flow: block-volumes
 * route: /storage/volumes/new (tenantUser, tenantAdmin)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  MenuToggle,
  NumberInput,
  PageSection,
  Select,
  SelectOption,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { type BlockVolumeStorageClass, useCreateBlockVolume } from '../../api/v1/block-volumes';
import { STORAGE_CLASS_LABELS } from '../../api/v1/compute-instance-disk';
import { getErrorMessage } from '../../utils/error';

const STORAGE_CLASSES: { value: BlockVolumeStorageClass; label: string }[] = [
  { value: 'ssd', label: 'SSD' },
  { value: 'nvme', label: 'NVMe' },
  { value: 'standard', label: 'Standard' },
];

export const BlockVolumeNewPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [sizeGib, setSizeGib] = useState(50);
  const [storageClass, setStorageClass] = useState<BlockVolumeStorageClass>('ssd');
  const [scOpen, setScOpen] = useState(false);
  const { mutateAsync, isPending, error } = useCreateBlockVolume();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      return;
    }
    await mutateAsync({ name: name.trim(), sizeGib, storageClass });
    navigate('/storage/volumes');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/storage/volumes')}>
                Block volumes
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create volume</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create block volume
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="vol-create-form">
          <FormGroup label="Name" isRequired fieldId="vol-name">
            <TextInput
              id="vol-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="e.g. data-vol-01"
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label="Size (GiB)" isRequired fieldId="vol-size">
            <NumberInput
              id="vol-size"
              value={sizeGib}
              min={1}
              onMinus={() => setSizeGib((v) => Math.max(1, v - 1))}
              onPlus={() => setSizeGib((v) => v + 1)}
              onChange={(e) => {
                const val = parseInt((e.target as HTMLInputElement).value, 10);
                if (!isNaN(val) && val > 0) {
                  setSizeGib(val);
                }
              }}
            />
          </FormGroup>

          <FormGroup label="Storage class" isRequired fieldId="vol-class">
            <Select
              isOpen={scOpen}
              onSelect={(_e, val) => {
                setStorageClass(val as BlockVolumeStorageClass);
                setScOpen(false);
              }}
              onOpenChange={setScOpen}
              selected={storageClass}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setScOpen(!scOpen)}
                  isExpanded={scOpen}
                  style={{ width: '100%' }}
                >
                  {STORAGE_CLASS_LABELS[storageClass] ?? storageClass}
                </MenuToggle>
              )}
            >
              {STORAGE_CLASSES.map((sc) => (
                <SelectOption key={sc.value} value={sc.value}>
                  {sc.label}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title="Failed to create volume">
              {getErrorMessage(error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="vol-create-form"
              isLoading={isPending}
              isDisabled={isPending || !name.trim()}
            >
              Create
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/storage/volumes')}
              isDisabled={isPending}
            >
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
