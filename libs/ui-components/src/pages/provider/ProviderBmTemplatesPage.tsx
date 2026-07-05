/**
 * flow: provider-admin
 * route: /provider/bm-templates
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

import type { BareMetalInstanceTemplate } from '@osac/types';

import {
  useBareMetalInstanceTemplates,
  useCreateBareMetalInstanceTemplate,
  useDeleteBareMetalInstanceTemplate,
} from '../../api/v1/baremetal-instance-templates';
import { useHostTypes } from '../../api/v1/host-types';
import OsacForm from '../../components/Form/OsacForm';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { getErrorMessage } from '../../utils/error';

const BmTemplateCreateModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [hostTypeId, setHostTypeId] = React.useState('');
  const [selectOpen, setSelectOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const { data: hostTypes = [] } = useHostTypes();
  const create = useCreateBareMetalInstanceTemplate();

  const onSubmit = async () => {
    if (!name.trim() || !title.trim()) {
      return;
    }
    setIsPending(true);
    create.reset();
    try {
      await create.mutateAsync({
        metadata: { name: name.trim() },
        title: title.trim(),
        description: description.trim(),
        specDefaults: { hostType: hostTypeId || undefined },
        parameters: [],
      } as unknown as Omit<BareMetalInstanceTemplate, 'id'>);
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  const selectedHt = hostTypes.find((h) => h.id === hostTypeId);

  return (
    <Modal
      variant="medium"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="bmt-create-title"
    >
      <ModalHeader title="Create BM template" labelId="bmt-create-title" />
      <ModalBody>
        <OsacForm>
          <FormGroup label="Identifier (name)" fieldId="bmt-name" isRequired>
            <TextInput
              id="bmt-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="bm-standard"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Title" fieldId="bmt-title" isRequired>
            <TextInput
              id="bmt-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="Standard Bare Metal"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="bmt-description">
            <TextArea
              id="bmt-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
            />
          </FormGroup>
          <FormGroup label="Default host type" fieldId="bmt-host-type">
            <Select
              isOpen={selectOpen}
              onOpenChange={setSelectOpen}
              selected={hostTypeId}
              onSelect={(_e, v) => {
                setHostTypeId(v as string);
                setSelectOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setSelectOpen(!selectOpen)}
                  isExpanded={selectOpen}
                >
                  {selectedHt?.metadata?.name ?? 'Select host type'}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="">None</SelectOption>
                {hostTypes.map((ht) => (
                  <SelectOption key={ht.id} value={ht.id}>
                    {ht.metadata?.name ?? ht.id}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>
          {create.error && (
            <Alert variant="danger" title="Failed to create BM template" isInline>
              {getErrorMessage(create.error)}
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
          isDisabled={isPending || !name.trim() || !title.trim()}
          isLoading={isPending}
        >
          Create
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const ProviderBmTemplatesPage = () => {
  const { data: templates = [], isLoading, error } = useBareMetalInstanceTemplates();
  const deleteT = useDeleteBareMetalInstanceTemplate();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<BareMetalInstanceTemplate | null>(null);

  return (
    <>
      <ListPage
        title="Bare Metal Templates"
        description="Bare metal templates define default host types and provisioning configurations for bare metal instances."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create BM template
          </Button>
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          {templates.length === 0 ? (
            <Alert variant="info" isInline title="No bare metal templates defined" />
          ) : (
            <Table aria-label="BM templates" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Title</Th>
                  <Th>Default host type</Th>
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
                    <Td dataLabel="Default host type">
                      {(t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType ? (
                        <Label isCompact color="blue">
                          {(t as { specDefaults?: { hostType?: string } }).specDefaults?.hostType}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="Actions" isActionCell>
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
        <BmTemplateCreateModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => setCreateOpen(false)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="BM template"
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
