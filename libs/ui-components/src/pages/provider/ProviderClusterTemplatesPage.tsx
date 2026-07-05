/**
 * flow: provider-admin
 * route: /provider/cluster-templates
 */
import React from 'react';
import {
  Alert,
  Button,
  FormGroup,
  Label,
  LabelGroup,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
  Split,
  SplitItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ClusterTemplate } from '@osac/types';

import {
  clusterTemplateNodeSetsSummary,
  isAiGridTemplate,
  useClusterTemplates,
  useCreateClusterTemplate,
  useDeleteClusterTemplate,
} from '../../api/v1/cluster-templates';
import { useHostTypes } from '../../api/v1/host-types';
import OsacForm from '../../components/Form/OsacForm';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { getErrorMessage } from '../../utils/error';

interface NodeSetRow {
  key: string;
  hostTypeId: string;
  size: string;
}

const ClusterTemplateCreateModal = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [name, setName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [releaseImage, setReleaseImage] = React.useState('');
  const [isGpu] = React.useState(false);
  const [nodeSets, setNodeSets] = React.useState<NodeSetRow[]>([
    { key: 'workers', hostTypeId: '', size: '3' },
  ]);
  const [openSelects, setOpenSelects] = React.useState<Record<number, boolean>>({});
  const [isPending, setIsPending] = React.useState(false);

  const { data: hostTypes = [] } = useHostTypes();
  const create = useCreateClusterTemplate();

  const addNodeSet = () => setNodeSets((prev) => [...prev, { key: '', hostTypeId: '', size: '1' }]);

  const removeNodeSet = (i: number) => setNodeSets((prev) => prev.filter((_, idx) => idx !== i));

  const updateNodeSet = (i: number, field: keyof NodeSetRow, val: string) =>
    setNodeSets((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const onSubmit = async () => {
    if (!name.trim() || !title.trim()) {
      return;
    }
    setIsPending(true);
    create.reset();
    try {
      const nodeSetMap: Record<string, { hostType: string; size: number }> = {};
      for (const row of nodeSets) {
        if (row.key.trim() && row.hostTypeId) {
          nodeSetMap[row.key.trim()] = {
            hostType: row.hostTypeId,
            size: Number(row.size) || 1,
          };
        }
      }
      await create.mutateAsync({
        metadata: {
          name: name.trim(),
          labels: { ...(isGpu ? { workload: 'ai', gpu: 'true' } : {}) },
        },
        title: title.trim(),
        description: description.trim(),
        nodeSets: nodeSetMap,
        specDefaults: {
          releaseImage: releaseImage.trim() || undefined,
        },
        parameters: [],
      } as unknown as Omit<ClusterTemplate, 'id'>);
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="large"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="clt-create-title"
    >
      <ModalHeader title="Create cluster template" labelId="clt-create-title" />
      <ModalBody>
        <OsacForm>
          <FormGroup label="Identifier (name)" fieldId="clt-name" isRequired>
            <TextInput
              id="clt-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="ocp417-ha"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Title" fieldId="clt-title" isRequired>
            <TextInput
              id="clt-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="OpenShift 4.17 — HA"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="clt-description">
            <TextArea
              id="clt-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={3}
            />
          </FormGroup>
          <FormGroup label="OCP release image" fieldId="clt-release">
            <TextInput
              id="clt-release"
              value={releaseImage}
              onChange={(_e, v) => setReleaseImage(v)}
              placeholder="quay.io/openshift-release-dev/ocp-release:4.17.0-x86_64"
            />
          </FormGroup>

          <FormGroup label="Node sets" fieldId="clt-nodesets">
            {nodeSets.map((row, i) => (
              <Split key={i} hasGutter style={{ marginBottom: 8 }}>
                <SplitItem>
                  <TextInput
                    value={row.key}
                    onChange={(_e, v) => updateNodeSet(i, 'key', v)}
                    placeholder="workers"
                    aria-label="Node set name"
                    style={{ width: 120 }}
                  />
                </SplitItem>
                <SplitItem>
                  <Select
                    isOpen={openSelects[i] ?? false}
                    onOpenChange={(o) => setOpenSelects((prev) => ({ ...prev, [i]: o }))}
                    selected={row.hostTypeId}
                    onSelect={(_e, v) => {
                      updateNodeSet(i, 'hostTypeId', v as string);
                      setOpenSelects((prev) => ({ ...prev, [i]: false }));
                    }}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setOpenSelects((prev) => ({ ...prev, [i]: !prev[i] }))}
                        isExpanded={openSelects[i] ?? false}
                        style={{ width: 200 }}
                      >
                        {hostTypes.find((h) => h.id === row.hostTypeId)?.metadata?.name ??
                          'Select host type'}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      {hostTypes.map((ht) => (
                        <SelectOption key={ht.id} value={ht.id}>
                          {ht.metadata?.name ?? ht.id}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={row.size}
                    onChange={(_e, v) => updateNodeSet(i, 'size', v)}
                    placeholder="3"
                    type="number"
                    aria-label="Size"
                    style={{ width: 70 }}
                  />
                </SplitItem>
                <SplitItem>
                  <Button
                    variant="plain"
                    onClick={() => removeNodeSet(i)}
                    isDisabled={nodeSets.length <= 1}
                  >
                    ✕
                  </Button>
                </SplitItem>
              </Split>
            ))}
            <Button variant="link" onClick={addNodeSet}>
              + Add node set
            </Button>
          </FormGroup>

          {create.error && (
            <Alert variant="danger" title="Failed to create cluster template" isInline>
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

export const ProviderClusterTemplatesPage = () => {
  const { data: templates = [], isLoading, error } = useClusterTemplates();
  const deleteT = useDeleteClusterTemplate();

  const [createOpen, setCreateOpen] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<ClusterTemplate | null>(null);

  return (
    <>
      <ListPage
        title="Cluster Templates"
        description="Cluster templates define the node sets, OCP release image, and defaults used when provisioning managed OpenShift clusters. AI Grid templates include dedicated GPU node sets."
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create cluster template
          </Button>
        }
      >
        <ListPageBody isLoading={isLoading} error={error}>
          {templates.length === 0 ? (
            <Alert variant="info" isInline title="No cluster templates defined" />
          ) : (
            <Table aria-label="Cluster templates" variant="compact">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Title</Th>
                  <Th>Node sets</Th>
                  <Th>Tags</Th>
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
                    <Td dataLabel="Node sets">{clusterTemplateNodeSetsSummary(t)}</Td>
                    <Td dataLabel="Tags">
                      <LabelGroup>
                        {isAiGridTemplate(t) && (
                          <Label isCompact color="orange">
                            AI Grid
                          </Label>
                        )}
                        {t.metadata?.labels?.['gpu'] === 'true' && (
                          <Label isCompact color="yellow">
                            GPU
                          </Label>
                        )}
                      </LabelGroup>
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
        <ClusterTemplateCreateModal
          onClose={() => setCreateOpen(false)}
          onSuccess={() => setCreateOpen(false)}
        />
      )}

      {pendingDelete && (
        <DeleteConfirmModal
          resourceName={pendingDelete.title || pendingDelete.metadata?.name || pendingDelete.id}
          resourceKind="cluster template"
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
