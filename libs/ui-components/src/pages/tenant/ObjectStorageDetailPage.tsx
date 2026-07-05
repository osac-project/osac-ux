/**
 * flow: object-storage
 * step: bucket_detail
 * route: /bucket-storage/:id
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  CardTitle,
  Checkbox,
  ClipboardCopy,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  NumberInput,
  PageSection,
  Table as PfTable,
  Spinner,
  Stack,
  StackItem,
  Switch,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
  TextArea,
  Title,
} from '@patternfly/react-core';
import DatabaseIcon from '@patternfly/react-icons/dist/esm/icons/database-icon';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import EditIcon from '@patternfly/react-icons/dist/esm/icons/edit-icon';
import KeyIcon from '@patternfly/react-icons/dist/esm/icons/key-icon';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import {
  type BucketAccessKey,
  useBucketAccessKeys,
  useCreateBucketAccessKey,
  useDeleteBucketAccessKey,
} from '../../api/v1/bucket-access-keys';
import {
  type ObjectStorageBucket,
  useDeleteObjectStorageBucket,
  useObjectStorageBucket,
} from '../../api/v1/object-storage';
import { ResourceDetailsPageError } from '../../components/Resource/ResourceDetailsPageError';
import { ResourceDetailsPageLoading } from '../../components/Resource/ResourceDetailsPageLoading';
import { DeleteConfirmModal } from '../../components/shared/DeleteConfirmModal';
import { getErrorMessage } from '../../utils/error';

const OVERVIEW_TAB_ID = 'bucket-detail-overview';
const ACCESS_KEYS_TAB_ID = 'bucket-detail-access-keys';

const BucketStateLabel = ({ state }: { state: ObjectStorageBucket['status']['state'] }) => {
  const colorMap = {
    READY: 'green',
    PROVISIONING: 'blue',
    DELETING: 'orange',
    FAILED: 'red',
  } as const;
  return (
    <Label color={colorMap[state] ?? 'grey'} isCompact>
      {state}
    </Label>
  );
};

// ---------------------------------------------------------------------------
// Create access key modal
// ---------------------------------------------------------------------------

interface CreateAccessKeyModalProps {
  bucketId: string;
  onClose: () => void;
}

const CreateAccessKeyModal = ({ bucketId, onClose }: CreateAccessKeyModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdKey, setCreatedKey] = useState<BucketAccessKey | null>(null);
  const { mutateAsync, isPending, error } = useCreateBucketAccessKey(bucketId);

  const handleCreate = async () => {
    const key = await mutateAsync({ name, description: description || undefined });
    setCreatedKey(key);
  };

  if (createdKey) {
    return (
      <Modal isOpen onClose={onClose} variant="medium" aria-label="Access key created">
        <ModalHeader title="Access key created" />
        <ModalBody>
          <Stack hasGutter>
            <StackItem>
              <Alert variant="warning" isInline title="Copy your secret now">
                The secret access key is shown only once. Store it securely — it cannot be retrieved
                later.
              </Alert>
            </StackItem>
            <StackItem>
              <FormGroup label="Access key ID" fieldId="created-key-id">
                <ClipboardCopy isReadOnly>{createdKey.status.accessKeyId}</ClipboardCopy>
              </FormGroup>
            </StackItem>
            {createdKey.status.secretAccessKey && (
              <StackItem>
                <FormGroup label="Secret access key" fieldId="created-secret">
                  <ClipboardCopy isReadOnly>{createdKey.status.secretAccessKey}</ClipboardCopy>
                </FormGroup>
              </StackItem>
            )}
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} variant="medium" aria-label="Create access key">
      <ModalHeader title="Create access key" />
      <ModalBody>
        <Stack hasGutter>
          {error && (
            <StackItem>
              <Alert variant="danger" isInline title="Failed to create key">
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <FormGroup label="Name" isRequired fieldId="key-name">
              <input
                id="key-name"
                className="pf-v6-c-form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ci-deploy-key"
              />
            </FormGroup>
          </StackItem>
          <StackItem>
            <FormGroup label="Description" fieldId="key-description">
              <TextArea
                id="key-description"
                value={description}
                onChange={(_e, v) => setDescription(v)}
                rows={2}
                resizeOrientation="vertical"
              />
            </FormGroup>
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleCreate}
          isLoading={isPending}
          isDisabled={isPending || !name.trim()}
        >
          Create
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// Access keys tab
// ---------------------------------------------------------------------------

const AccessKeysTab = ({ bucketId }: { bucketId: string }) => {
  const { data: keys = [], isLoading } = useBucketAccessKeys(bucketId);
  const { mutateAsync: deleteKey } = useDeleteBucketAccessKey(bucketId);
  const [createOpen, setCreateOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<BucketAccessKey | null>(null);

  return (
    <>
      {createOpen && (
        <CreateAccessKeyModal bucketId={bucketId} onClose={() => setCreateOpen(false)} />
      )}
      {keyToDelete && (
        <DeleteConfirmModal
          resourceName={keyToDelete.metadata?.name ?? keyToDelete.id}
          resourceKind="access key"
          onConfirm={async () => {
            await deleteKey(keyToDelete.id);
            setKeyToDelete(null);
          }}
          onClose={() => setKeyToDelete(null)}
        />
      )}

      <Stack hasGutter>
        <StackItem>
          <Flex justifyContent={{ default: 'justifyContentFlexEnd' }}>
            <FlexItem>
              <Button variant="primary" icon={<PlusIcon />} onClick={() => setCreateOpen(true)}>
                Create access key
              </Button>
            </FlexItem>
          </Flex>
        </StackItem>
        <StackItem>
          <Card>
            <CardBody>
              {isLoading ? (
                <Spinner size="md" aria-label="Loading access keys" />
              ) : keys.length === 0 ? (
                <Alert variant="info" isInline title="No access keys">
                  Create an access key to enable programmatic access to this bucket via
                  S3-compatible APIs.
                </Alert>
              ) : (
                <Table aria-label="Bucket access keys" variant="compact">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Access key ID</Th>
                      <Th>Description</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Td />
                    </Tr>
                  </Thead>
                  <Tbody>
                    {keys.map((key) => (
                      <Tr key={key.id}>
                        <Td dataLabel="Name">{key.metadata?.name ?? key.id}</Td>
                        <Td dataLabel="Access key ID">
                          <code>{key.status.accessKeyId}</code>
                        </Td>
                        <Td dataLabel="Description">{key.spec.description || '—'}</Td>
                        <Td dataLabel="Status">
                          <Label
                            color={key.status.state === 'ACTIVE' ? 'green' : 'orange'}
                            isCompact
                          >
                            {key.status.state}
                          </Label>
                        </Td>
                        <Td dataLabel="Created">
                          {key.metadata?.creationTimestamp
                            ? new Date(key.metadata.creationTimestamp).toLocaleDateString()
                            : '—'}
                        </Td>
                        <Td isActionCell>
                          <ActionsColumn
                            items={[
                              {
                                title: 'Revoke',
                                isDisabled: key.status.state === 'REVOKING',
                                onClick: (e) => {
                                  e.stopPropagation();
                                  setKeyToDelete(key);
                                },
                              },
                            ]}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </StackItem>
      </Stack>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export const ObjectStorageDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: bucket, isLoading, error } = useObjectStorageBucket(id);
  const { mutate: deleteBucket, isPending: isDeleting } = useDeleteObjectStorageBucket();

  if (isLoading) {
    return <ResourceDetailsPageLoading />;
  }
  if (error || !bucket) {
    return <ResourceDetailsPageError error={error} />;
  }

  const name = bucket.metadata?.name ?? bucket.id;
  const created = bucket.metadata?.creationTimestamp
    ? new Date(bucket.metadata.creationTimestamp).toLocaleString()
    : '—';
  const usedLabel =
    bucket.status.usedGib != null && bucket.spec.quotaGib
      ? `${bucket.status.usedGib} / ${bucket.spec.quotaGib} GiB`
      : bucket.status.usedGib != null
        ? `${bucket.status.usedGib} GiB`
        : '—';

  const handleDelete = () => {
    deleteBucket(bucket.id, {
      onSuccess: () => navigate('/bucket-storage'),
    });
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Breadcrumb>
              <BreadcrumbItem>
                <Button variant="link" isInline onClick={() => navigate('/bucket-storage')}>
                  Storage Buckets
                </Button>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{name}</BreadcrumbItem>
            </Breadcrumb>
          </StackItem>
          <StackItem>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  {name}
                </Title>
              </FlexItem>
              <FlexItem>
                <BucketStateLabel state={bucket.status.state} />
              </FlexItem>
              <FlexItem align={{ default: 'alignRight' }}>
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <Button
                      variant="secondary"
                      icon={<EditIcon />}
                      onClick={() => navigate(`/bucket-storage/${id}/edit`)}
                    >
                      Edit
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="danger"
                      icon={<DumpsterIcon />}
                      onClick={() => setDeleteConfirm(true)}
                      isDisabled={isDeleting}
                    >
                      Delete
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            </Flex>
          </StackItem>
          {deleteConfirm && (
            <StackItem>
              <Alert
                variant="warning"
                isInline
                title={`Delete bucket "${name}"? This action cannot be undone.`}
                actionLinks={
                  <>
                    <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                      Delete
                    </Button>
                    <Button variant="link" onClick={() => setDeleteConfirm(false)}>
                      Cancel
                    </Button>
                  </>
                }
              />
            </StackItem>
          )}
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false} type="tabs">
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(key as number)}
          aria-label="Bucket details tabs"
        >
          <Tab
            eventKey={0}
            title={<TabTitleText>Overview</TabTitleText>}
            tabContentId={OVERVIEW_TAB_ID}
          />
          <Tab
            eventKey={1}
            title={
              <TabTitleText>
                <KeyIcon /> Access keys
              </TabTitleText>
            }
            tabContentId={ACCESS_KEYS_TAB_ID}
          />
        </Tabs>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <TabContent
          eventKey={0}
          id={OVERVIEW_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 0}
        >
          <TabContentBody>
            <Card>
              <CardTitle>
                <DatabaseIcon aria-hidden /> Bucket details
              </CardTitle>
              <CardBody>
                <DescriptionList columnModifier={{ default: '2Col' }} isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>State</DescriptionListTerm>
                    <DescriptionListDescription>
                      <BucketStateLabel state={bucket.status.state} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Endpoint</DescriptionListTerm>
                    <DescriptionListDescription>
                      {bucket.status.endpoint ? (
                        <ClipboardCopy
                          isReadOnly
                          variant="inline-compact"
                          hoverTip="Copy"
                          clickTip="Copied"
                        >
                          {bucket.status.endpoint}
                        </ClipboardCopy>
                      ) : (
                        '—'
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Used storage</DescriptionListTerm>
                    <DescriptionListDescription>{usedLabel}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Object count</DescriptionListTerm>
                    <DescriptionListDescription>
                      {bucket.status.objectCount != null
                        ? bucket.status.objectCount.toLocaleString()
                        : '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Versioning</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Checkbox
                        id="bucket-versioning-ro"
                        isChecked={bucket.spec.versioning ?? false}
                        isDisabled
                        aria-label="Versioning enabled"
                      />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Quota</DescriptionListTerm>
                    <DescriptionListDescription>
                      {bucket.spec.quotaGib != null ? `${bucket.spec.quotaGib} GiB` : 'No limit'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Description</DescriptionListTerm>
                    <DescriptionListDescription>
                      {bucket.spec.description || '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>{created}</DescriptionListDescription>
                  </DescriptionListGroup>
                  {bucket.metadata?.creator && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Creator</DescriptionListTerm>
                      <DescriptionListDescription>
                        {bucket.metadata.creator}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>
          </TabContentBody>
        </TabContent>

        <TabContent
          eventKey={1}
          id={ACCESS_KEYS_TAB_ID}
          activeKey={activeTab}
          hidden={activeTab !== 1}
        >
          <TabContentBody>
            <AccessKeysTab bucketId={bucket.id} />
          </TabContentBody>
        </TabContent>
      </PageSection>
    </>
  );
};
