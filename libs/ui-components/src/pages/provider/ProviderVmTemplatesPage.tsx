/**
 * flow: provider-admin
 * route: /provider/vm-templates
 */
import React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstanceTemplate } from '@osac/types';

import {
  useComputeInstanceTemplates,
  useCreateComputeInstanceTemplate,
  useDeleteComputeInstanceTemplate,
  usePatchComputeInstanceTemplate,
} from '../../api/v1/compute-instance-templates';
import { useInstanceTypes } from '../../api/v1/instance-types';
import OsacForm from '../../components/Form/OsacForm';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { getErrorMessage } from '../../utils/error';

const VmTemplateModal = ({
  editItem,
  onClose,
  onSuccess,
}: {
  editItem?: ComputeInstanceTemplate;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const isEdit = Boolean(editItem);
  const [name, setName] = React.useState(editItem?.metadata?.name ?? '');
  const [title, setTitle] = React.useState(editItem?.title ?? '');
  const [description, setDescription] = React.useState(editItem?.description ?? '');
  const [instanceTypeId, setInstanceTypeId] = React.useState(
    editItem?.specDefaults?.instanceType ?? '',
  );
  const [imageRef, setImageRef] = React.useState(editItem?.specDefaults?.image?.sourceRef ?? '');
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const { data: instanceTypes = [] } = useInstanceTypes();
  const create = useCreateComputeInstanceTemplate();
  const patch = usePatchComputeInstanceTemplate();

  const mutationError = isEdit ? patch.error : create.error;

  const onSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    setIsPending(true);
    create.reset();
    patch.reset();
    try {
      if (isEdit && editItem) {
        await patch.mutateAsync({
          id: editItem.id,
          patch: {
            title: title.trim(),
            description: description.trim(),
            specDefaults: {
              instanceType: instanceTypeId || undefined,
              image: imageRef.trim() ? { sourceRef: imageRef.trim() } : undefined,
            },
          } as Partial<ComputeInstanceTemplate>,
        });
      } else {
        if (!name.trim()) {
          return;
        }
        await create.mutateAsync({
          metadata: { name: name.trim() },
          title: title.trim(),
          description: description.trim(),
          specDefaults: {
            instanceType: instanceTypeId || undefined,
            image: imageRef.trim() ? { sourceRef: imageRef.trim() } : undefined,
          },
          parameters: [],
        } as unknown as Omit<ComputeInstanceTemplate, 'id'>);
      }
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  const selectedIt = instanceTypes.find((it) => it.id === instanceTypeId);
  const isValid = isEdit ? Boolean(title.trim()) : Boolean(name.trim() && title.trim());

  return (
    <Modal
      variant="medium"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="vmt-modal-title"
    >
      <ModalHeader
        title={
          isEdit
            ? `Edit VM template — ${editItem?.metadata?.name ?? editItem?.id}`
            : 'Create VM template'
        }
        labelId="vmt-modal-title"
      />
      <ModalBody>
        <OsacForm>
          {!isEdit && (
            <FormGroup label="Identifier (name)" fieldId="vmt-name" isRequired>
              <TextInput
                id="vmt-name"
                value={name}
                onChange={(_e, v) => setName(v)}
                placeholder="rhel9-standard"
                isRequired
              />
            </FormGroup>
          )}
          <FormGroup label="Title" fieldId="vmt-title" isRequired>
            <TextInput
              id="vmt-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="RHEL 9 Standard"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="vmt-description">
            <TextArea
              id="vmt-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
            />
          </FormGroup>
          <FormGroup label="Default instance type" fieldId="vmt-instance-type">
            <Select
              isOpen={selectOpen}
              onOpenChange={setSelectOpen}
              selected={instanceTypeId}
              onSelect={(_e, v) => {
                setInstanceTypeId(v as string);
                setSelectOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setSelectOpen(!selectOpen)}
                  isExpanded={selectOpen}
                >
                  {selectedIt?.metadata?.name ?? 'Select instance type'}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="">None</SelectOption>
                {instanceTypes.map((it) => (
                  <SelectOption key={it.id} value={it.id}>
                    {it.metadata?.name ?? it.id}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>
          <FormGroup label="Default image source ref" fieldId="vmt-image">
            <TextInput
              id="vmt-image"
              value={imageRef}
              onChange={(_e, v) => setImageRef(v)}
              placeholder="quay.io/containerdisks/rhel:9.4"
            />
          </FormGroup>
          {mutationError && (
            <Alert
              variant="danger"
              title={isEdit ? 'Failed to update VM template' : 'Failed to create VM template'}
              isInline
            >
              {getErrorMessage(mutationError)}
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
          isDisabled={isPending || !isValid}
          isLoading={isPending}
        >
          {isEdit ? 'Save' : 'Create'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const ProviderVmTemplatesPage = () => {
  const { data: templates = [], isLoading, error } = useComputeInstanceTemplates();
  const deleteT = useDeleteComputeInstanceTemplate();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<ComputeInstanceTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<ComputeInstanceTemplate | null>(null);

  return (
    <>
      <ListPage
        title="VM Templates"
        description="VM templates define default configurations (image, instance type, disk) used when provisioning compute instances from catalog items."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create VM template
          </Button>
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          {templates.length === 0 ? (
            <Alert variant="info" isInline title="No VM templates defined" />
          ) : (
            <Table aria-label="VM templates" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Title</Th>
                  <Th>Default instance type</Th>
                  <Th>Default image</Th>
                  <Th aria-label="Actions" />
                </Tr>
              </Thead>
              <Tbody>
                {templates.map((t) => (
                  <Tr key={t.id}>
                    <Td dataLabel="Name">
                      <strong>{t.metadata?.name ?? t.id}</strong>
                    </Td>
                    <Td dataLabel="Title">{t.title || '—'}</Td>
                    <Td dataLabel="Default instance type">
                      {t.specDefaults?.instanceType ? (
                        <Label isCompact color="blue">
                          {t.specDefaults.instanceType}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="Default image">
                      {t.specDefaults?.image?.sourceRef ? (
                        <code style={{ fontSize: '0.8em' }}>{t.specDefaults.image.sourceRef}</code>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="Actions" isActionCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditItem(t)}
                        style={{ marginRight: '0.5rem' }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setPendingDelete(t)}
                        isDisabled={deleteT.isPending}
                      >
                        Delete
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>

      {createOpen && (
        <VmTemplateModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => setCreateOpen(false)}
        />
      )}

      {editItem && (
        <VmTemplateModal
          editItem={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => setEditItem(null)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="VM template"
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            await deleteT.mutateAsync(pendingDelete.id);
            setPendingDelete(null);
          }}
          error={deleteT.error}
        />
      )}
    </>
  );
};
