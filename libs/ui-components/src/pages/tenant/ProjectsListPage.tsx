/**
 * flow: projects
 * step: project_list
 * route: /projects
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
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

import { ProjectState } from '@osac/types';

import { type Project, useDeleteProject, useProjects } from '../../api/v1/project';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';

const ENV_OPTIONS = ['production', 'staging', 'development'] as const;
type EnvOption = (typeof ENV_OPTIONS)[number];

const ENV_LABELS: Record<EnvOption, { label: string; color: 'green' | 'blue' | 'grey' }> = {
  production: { label: 'Production', color: 'green' },
  staging: { label: 'Staging', color: 'blue' },
  development: { label: 'Development', color: 'grey' },
};

const STATE_CONFIG: Record<
  number,
  { label: string; color: 'green' | 'blue' | 'red' | 'orange' | 'grey' }
> = {
  [ProjectState.ACTIVE]: { label: 'Active', color: 'green' },
  [ProjectState.PENDING]: { label: 'Pending', color: 'blue' },
  [ProjectState.FAILED]: { label: 'Failed', color: 'red' },
  [ProjectState.DELETING]: { label: 'Deleting', color: 'orange' },
  [ProjectState.DELETE_FAILED]: { label: 'Delete failed', color: 'red' },
};

const FILTERABLE_STATES = [
  ProjectState.ACTIVE,
  ProjectState.PENDING,
  ProjectState.FAILED,
  ProjectState.DELETING,
  ProjectState.DELETE_FAILED,
] as const;
type StateFilter = (typeof FILTERABLE_STATES)[number];

const ProjectEnvBadge = ({ env }: { env?: string }) => {
  const cfg = env ? ENV_LABELS[env as EnvOption] : undefined;
  if (!cfg) {
    return <span>—</span>;
  }
  return (
    <Label color={cfg.color} isCompact>
      {cfg.label}
    </Label>
  );
};

const ProjectStateBadge = ({ state }: { state?: ProjectState }) => {
  if (state == null) {
    return <span>—</span>;
  }
  const cfg = STATE_CONFIG[state];
  if (!cfg) {
    return (
      <Label color="grey" isCompact>
        Unknown
      </Label>
    );
  }
  return (
    <Label color={cfg.color} isCompact>
      {cfg.label}
    </Label>
  );
};

export const ProjectsListPage = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, error } = useProjects();
  const { mutate: deleteProject } = useDeleteProject();
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const [search, setSearch] = useState('');
  const [envFilters, setEnvFilters] = useState<EnvOption[]>([]);
  const [stateFilters, setStateFilters] = useState<StateFilter[]>([]);
  const [envOpen, setEnvOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);

  const toggleEnv = (v: EnvOption) =>
    setEnvFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const toggleState = (v: StateFilter) =>
    setStateFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setEnvFilters([]);
    setStateFilters([]);
  };
  const hasFilters = search !== '' || envFilters.length > 0 || stateFilters.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (q) {
        const title = (p.spec?.title ?? p.metadata?.name ?? p.id).toLowerCase();
        const name = (p.metadata?.name ?? '').toLowerCase();
        const desc = (p.spec?.description ?? '').toLowerCase();
        if (!title.includes(q) && !name.includes(q) && !desc.includes(q)) {
          return false;
        }
      }
      if (envFilters.length > 0) {
        const env = p.metadata?.labels?.['env'] as EnvOption | undefined;
        if (!env || !envFilters.includes(env)) {
          return false;
        }
      }
      if (stateFilters.length > 0) {
        if (p.status?.state == null || !stateFilters.includes(p.status.state as StateFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [projects, search, envFilters, stateFilters]);

  const handleDelete = (project: Project) => {
    setProjectToDelete(null);
    deleteProject(project.id);
  };

  return (
    <ListPage title="Projects" description="Organize and isolate your resources using projects.">
      {projectToDelete && (
        <Alert
          variant="warning"
          isInline
          title={`Delete project "${projectToDelete.spec?.title ?? projectToDelete.id}"?`}
          style={{ marginBottom: '1rem' }}
          actionLinks={
            <>
              <Button variant="danger" onClick={() => handleDelete(projectToDelete)}>
                Delete
              </Button>
              <Button variant="link" onClick={() => setProjectToDelete(null)}>
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
                aria-label="Search projects"
                placeholder="Search by name, title, or description"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>

            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                chips={envFilters.map((e) => ENV_LABELS[e].label)}
                deleteChip={(_g, chip) => {
                  const found = ENV_OPTIONS.find((e) => ENV_LABELS[e].label === chip);
                  if (found) {
                    toggleEnv(found);
                  }
                }}
                deleteChipGroup={() => setEnvFilters([])}
                categoryName="Environment"
              >
                <Select
                  isOpen={envOpen}
                  onOpenChange={setEnvOpen}
                  onSelect={(_e, v) => toggleEnv(v as EnvOption)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setEnvOpen(!envOpen)}
                      isExpanded={envOpen}
                      badge={envFilters.length || undefined}
                    >
                      Environment
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {ENV_OPTIONS.map((e) => (
                      <SelectOption
                        key={e}
                        value={e}
                        hasCheckbox
                        isSelected={envFilters.includes(e)}
                      >
                        {ENV_LABELS[e].label}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>

              <ToolbarFilter
                chips={stateFilters.map((s) => STATE_CONFIG[s]?.label ?? String(s))}
                deleteChip={(_g, chip) => {
                  const found = FILTERABLE_STATES.find((s) => STATE_CONFIG[s]?.label === chip);
                  if (found != null) {
                    toggleState(found);
                  }
                }}
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
                    {FILTERABLE_STATES.map((s) => (
                      <SelectOption
                        key={s}
                        value={s}
                        hasCheckbox
                        isSelected={stateFilters.includes(s)}
                      >
                        {STATE_CONFIG[s]?.label}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>

            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={() => navigate('/projects/new')}>
                New project
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>No projects match the current filters.</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                Clear filters
              </Button>
            </FlexItem>
          </Flex>
        ) : projects.length === 0 ? (
          <Alert variant="info" isInline title="No projects yet">
            Create your first project to start organizing resources.
          </Alert>
        ) : (
          <Table aria-label="Projects" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Environment</Th>
                <Th>State</Th>
                <Th>Description</Th>
                <Th>Created</Th>
                <Td />
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((project) => {
                const title = project.spec?.title ?? project.metadata?.name ?? project.id;
                const env = project.metadata?.labels?.['env'];
                const created = project.metadata?.creationTimestamp
                  ? new Date(
                      project.metadata.creationTimestamp as unknown as string,
                    ).toLocaleDateString()
                  : '—';

                return (
                  <Tr key={project.id}>
                    <Td dataLabel="Name">
                      <Button
                        variant="link"
                        isInline
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        {title}
                      </Button>
                    </Td>
                    <Td dataLabel="Environment">
                      <ProjectEnvBadge env={env} />
                    </Td>
                    <Td dataLabel="State">
                      <ProjectStateBadge state={project.status?.state} />
                    </Td>
                    <Td dataLabel="Description">{project.spec?.description || '—'}</Td>
                    <Td dataLabel="Created">{created}</Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: 'Delete',
                            onClick: () => setProjectToDelete(project),
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
