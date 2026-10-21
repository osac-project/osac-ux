import { type Ref, useState } from 'react';
import {
  Alert,
  Button,
  Content,
  Divider,
  FormGroup,
  MenuToggle,
  type MenuToggleElement,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
  SearchInput,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import { useResizeComputeInstance } from '../../../api/v1/compute-instance';
import { INSTANCE_TYPE_ACTIVE_LIST_FILTER, useInstanceTypes } from '../../../api/v1/instance-types';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import { formatInstanceTypeSizing, instanceTypeName } from '../utils';

import './VmResizeModal.css';

interface VmResizeModalProps {
  vm: ComputeInstance;
  onClose: () => void;
}

const FIELD_ID = 'vm-resize-instance-type';
const RATE_HOURLY_ANNOTATION = 'osac.io/rate-hourly';

const VmResizeModal = ({ vm, onClose }: VmResizeModalProps) => {
  const { t } = useTranslation();
  const currentInstanceTypeId = vm.spec?.instanceType?.id ?? '';

  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentInstanceTypeId);
  const [search, setSearch] = useState('');

  const { data: instanceTypes = [], isLoading, error: loadError } = useInstanceTypes({
    filter: INSTANCE_TYPE_ACTIVE_LIST_FILTER,
  });

  const resize = useResizeComputeInstance();

  const selectedItem = instanceTypes.find((it) => it.id === selectedId);
  const filteredInstanceTypes = instanceTypes.filter((it) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return `${instanceTypeName(it)} ${formatInstanceTypeSizing(it)}`.toLowerCase().includes(query);
  });
  const toggleLabel = selectedItem
    ? instanceTypeName(selectedItem)
    : isLoading
      ? t('Loading...')
      : t('Select an instance type');

  const isSameAsCurrent = selectedId === currentInstanceTypeId;
  const isSaveDisabled = isSameAsCurrent || !selectedId || isLoading || resize.isPending;

  const toggle = (ref: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={ref}
      id={FIELD_ID}
      className="vm-resize-modal__instance-type-toggle"
      onClick={() => setIsOpen((prev) => !prev)}
      isExpanded={isOpen}
      isDisabled={isLoading || Boolean(loadError)}
      isFullWidth
      aria-busy={isLoading || undefined}
    >
      <Stack className="vm-resize-modal__instance-type-toggle-content">
        <StackItem className="vm-resize-modal__instance-type-name">
          {selectedItem ? instanceTypeName(selectedItem) : toggleLabel}
        </StackItem>
        {selectedItem ? (
          <StackItem className="vm-resize-modal__instance-type-sizing">
            {formatInstanceTypeSizing(selectedItem)}
          </StackItem>
        ) : null}
      </Stack>
    </MenuToggle>
  );

  const handleSave = async () => {
    if (!selectedId || isSameAsCurrent) {
      return;
    }
    await resize.mutateAsync({ id: vm.id, instanceTypeId: selectedId });
    onClose();
  };

  return (
    <Modal
      variant="small"
      isOpen
      onClose={resize.isPending ? undefined : onClose}
      aria-labelledby="vm-resize-modal-title"
    >
      <ModalHeader title={t('Edit instance type')} labelId="vm-resize-modal-title" />
      <ModalBody>
        {loadError ? (
          <Alert variant="danger" isInline title={t('Error loading instance types')}>
            {getErrorMessage(loadError)}
          </Alert>
        ) : null}
        <Content component="p">
          {t('Select a new instance type for this virtual machine.')}
        </Content>
        <FormGroup label={t('Instance type')} fieldId={FIELD_ID} isRequired>
          <Select
            id={`${FIELD_ID}-select`}
            isOpen={isOpen}
            selected={selectedId}
            onSelect={(_e, value) => {
              setSelectedId(value as string);
              setIsOpen(false);
            }}
            onOpenChange={setIsOpen}
            toggle={toggle}
            shouldFocusToggleOnSelect
          >
            <div className="vm-resize-modal__instance-type-menu">
              <SearchInput
                aria-label={t('Search instance types')}
                placeholder={t('Search instance types')}
                value={search}
                onChange={(_event, value) => setSearch(value)}
                onClear={() => setSearch('')}
              />
              <Divider />
              <SelectList>
                {filteredInstanceTypes.map((it) => {
                  const hourlyRate = it.metadata?.annotations?.[RATE_HOURLY_ANNOTATION];
                  const description = hourlyRate
                    ? `${formatInstanceTypeSizing(it)} · $${Number(hourlyRate).toFixed(2)}/hr`
                    : formatInstanceTypeSizing(it);

                  return (
                    <SelectOption key={it.id} value={it.id} description={description}>
                      {instanceTypeName(it)}
                    </SelectOption>
                  );
                })}
              </SelectList>
            </div>
          </Select>
        </FormGroup>
        {resize.isError ? (
          <Alert variant="danger" isInline title={t('Failed to resize virtual machine')}>
            {getErrorMessage(resize.error)}
          </Alert>
        ) : null}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          isDisabled={isSaveDisabled}
          isLoading={resize.isPending}
        >
          {t('Save')}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={resize.isPending}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default VmResizeModal;
