/**
 * flow: object-storage
 * step: buckets_storage_list
 * route: /bucket-storage
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  ClipboardCopy,
  Flex,
  FlexItem,
  Label,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ObjectStorageBucket } from '../../api/v1/object-storage';
import { useDeleteObjectStorageBucket, useObjectStorageBuckets } from '../../api/v1/object-storage';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

const STATE_COLORS = {
  READY: 'green',
  PROVISIONING: 'blue',
  DELETING: 'orange',
  FAILED: 'red',
} as const;

type StateFilter = ObjectStorageBucket['status']['state'];
type VersioningFilter = 'Enabled' | 'Disabled';

const BucketStateLabel = ({ state }: { state: ObjectStorageBucket['status']['state'] }) => (
  <Label color={STATE_COLORS[state] ?? 'grey'} isCompact>
    {state}
  </Label>
);

export const ObjectStoragePage = () => {
  const navigate = useNavigate();
  const { data: buckets = [], isLoading, error } = useObjectStorageBuckets();
  const { mutate: deleteBucket } = useDeleteObjectStorageBucket();

  const [bucketToDelete, setBucketToDelete] = useState<ObjectStorageBucket | null>(null);

  const [search, setSearch] = useState('');
  const [stateFilters, setStateFilters] = useState<StateFilter[]>([]);
  const [versioningFilters, setVersioningFilters] = useState<VersioningFilter[]>([]);
  const [stateOpen, setStateOpen] = useState(false);
  const [versioningOpen, setVersioningOpen] = useState(false);

  const toggleState = (v: StateFilter) =>
    setStateFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleVersioning = (v: VersioningFilter) =>
    setVersioningFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setStateFilters([]);
    setVersioningFilters([]);
  };

  const hasFilters = search !== '' || stateFilters.length > 0 || versioningFilters.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return buckets.filter((b) => {
      if (q) {
        const name = (b.metadata?.name ?? b.id).toLowerCase();
        const desc = (b.spec.description ?? '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      if (stateFilters.length > 0 && !stateFilters.includes(b.status.state)) {
        return false;
      }
      if (versioningFilters.length > 0) {
        const v: VersioningFilter = b.spec.versioning ? 'Enabled' : 'Disabled';
        if (!versioningFilters.includes(v)) {
          return false;
        }
      }
      return true;
    });
  }, [buckets, search, stateFilters, versioningFilters]);

  const handleDelete = (bucket: ObjectStorageBucket) => {
    setBucketToDelete(null);
    deleteBucket(bucket.id);
  };

  return (
    <ListPage
      title="Storage Buckets"
      description="S3-compatible object storage buckets for your organization."
    >
      {bucketToDelete && (
        <Alert
          variant="warning"
          isInline
          title={`Delete bucket "${bucketToDelete.metadata?.name ?? bucketToDelete.id}"?`}
          actionLinks={
            <>
              <Button variant="danger" onClick={() => handleDelete(bucketToDelete)}>
                Delete
              </Button>
              <Button variant="link" onClick={() => setBucketToDelete(null)}>
                Cancel
              </Button>
            </>
          }
        />
      )}

      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar clearAllFilters={clearAll} collapseListedFiltersBreakpoint="xl">
          <ToolbarContent>
            <ToolbarItem variant="search-filter">
              <SearchInput
                aria-label="Search buckets"
                placeholder="Search by name or description"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>

            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                chips={stateFilters}
                deleteChip={(_g, v) => toggleState(v as StateFilter)}
                deleteChipGroup={() => setStateFilters([])}
                categoryName="State"
              >
                <Select
                  isOpen={stateOpen}
                  onOpenChange={setStateOpen}
                  onSelect={(_e, v) => toggleState(v as StateFilter)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setStateOpen(!stateOpen)}
                      isExpanded={stateOpen}
                      badge={stateFilters.length || undefined}
                    >
                      State
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(Object.keys(STATE_COLORS) as StateFilter[]).map((s) => (
                      <SelectOption
                        key={s}
                        value={s}
                        hasCheckbox
                        isSelected={stateFilters.includes(s)}
                      >
                        {s}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                chips={versioningFilters}
                deleteChip={(_g, v) => toggleVersioning(v as VersioningFilter)}
                deleteChipGroup={() => setVersioningFilters([])}
                categoryName="Versioning"
              >
                <Select
                  isOpen={versioningOpen}
                  onOpenChange={setVersioningOpen}
                  onSelect={(_e, v) => toggleVersioning(v as VersioningFilter)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setVersioningOpen(!versioningOpen)}
                      isExpanded={versioningOpen}
                      badge={versioningFilters.length || undefined}
                    >
                      Versioning
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['Enabled', 'Disabled'] as VersioningFilter[]).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={versioningFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>

            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={() => navigate('/bucket-storage/new')}>
                Create bucket
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>No buckets match the current filters.</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                Clear filters
              </Button>
            </FlexItem>
          </Flex>
        ) : buckets.length === 0 ? (
          <Alert variant="info" isInline title="No buckets yet">
            Create your first object storage bucket to get started.
          </Alert>
        ) : (
          <Table aria-label="Object storage buckets" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>State</Th>
                <Th>Endpoint</Th>
                <Th>Versioning</Th>
                <Th>Used</Th>
                <Th>Objects</Th>
                <Th>Created</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((bucket) => {
                const name = bucket.metadata?.name ?? bucket.id;
                const created = bucket.metadata?.creationTimestamp
                  ? new Date(bucket.metadata.creationTimestamp).toLocaleDateString()
                  : '—';
                const usedLabel =
                  bucket.status.usedGib != null && bucket.spec.quotaGib
                    ? `${bucket.status.usedGib} / ${bucket.spec.quotaGib} GiB`
                    : bucket.status.usedGib != null
                      ? `${bucket.status.usedGib} GiB`
                      : '—';

                return (
                  <Tr key={bucket.id}>
                    <Td dataLabel="Name">
                      <Button
                        variant="link"
                        isInline
                        onClick={() => navigate(`/bucket-storage/${bucket.id}`)}
                      >
                        {name}
                      </Button>
                    </Td>
                    <Td dataLabel="State">
                      <BucketStateLabel state={bucket.status.state} />
                    </Td>
                    <Td dataLabel="Endpoint">
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
                    </Td>
                    <Td dataLabel="Versioning">
                      <Label color={bucket.spec.versioning ? 'green' : 'grey'} isCompact>
                        {bucket.spec.versioning ? 'Enabled' : 'Disabled'}
                      </Label>
                    </Td>
                    <Td dataLabel="Used">{usedLabel}</Td>
                    <Td dataLabel="Objects">
                      {bucket.status.objectCount != null
                        ? bucket.status.objectCount.toLocaleString()
                        : '—'}
                    </Td>
                    <Td dataLabel="Created">{created}</Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: 'View details',
                            onClick: () => navigate(`/bucket-storage/${bucket.id}`),
                          },
                          {
                            title: 'Delete',
                            onClick: () => setBucketToDelete(bucket),
                            isDanger: true,
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
      </ListPageBody>
    </ListPage>
  );
};
