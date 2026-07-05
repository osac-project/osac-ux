/**
 * flow: projects
 * step: project_detail
 * route: /projects/:id
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Select,
  SelectOption,
  Spinner,
  Stack,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { ProjectMembershipRole, ProjectMembershipState, ProjectState } from '@osac/types';

import { useProject } from '../../api/v1/project';
import {
  useCreateProjectMembership,
  useDeleteProjectMembership,
  useProjectMemberships,
} from '../../api/v1/project-membership';
import { useUsers } from '../../api/v1/user';
import { getErrorMessage } from '../../utils/error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OVERVIEW_TAB = 0;
const MEMBERS_TAB = 1;

const ROLE_LABELS: Record<ProjectMembershipRole, { label: string; color: 'blue' | 'grey' }> = {
  [ProjectMembershipRole.MANAGER]: { label: 'Manager', color: 'blue' },
  [ProjectMembershipRole.VIEWER]: { label: 'Viewer', color: 'grey' },
  [ProjectMembershipRole.UNSPECIFIED]: { label: 'Unknown', color: 'grey' },
};

const MEMBERSHIP_STATE_LABELS: Record<
  ProjectMembershipState,
  { label: string; color: 'green' | 'blue' | 'red' | 'grey' }
> = {
  [ProjectMembershipState.READY]: { label: 'Ready', color: 'green' },
  [ProjectMembershipState.PENDING]: { label: 'Pending', color: 'blue' },
  [ProjectMembershipState.FAILED]: { label: 'Failed', color: 'red' },
  [ProjectMembershipState.UNSPECIFIED]: { label: 'Unknown', color: 'grey' },
};

const PROJECT_STATE_LABELS: Record<
  ProjectState,
  { label: string; color: 'green' | 'blue' | 'red' | 'orange' | 'grey' }
> = {
  [ProjectState.ACTIVE]: { label: 'Active', color: 'green' },
  [ProjectState.PENDING]: { label: 'Pending', color: 'blue' },
  [ProjectState.FAILED]: { label: 'Failed', color: 'red' },
  [ProjectState.DELETING]: { label: 'Deleting', color: 'orange' },
  [ProjectState.DELETE_FAILED]: { label: 'Delete failed', color: 'red' },
  [ProjectState.UNSPECIFIED]: { label: 'Unknown', color: 'grey' },
};

const ENV_LABELS: Record<string, { label: string; color: 'green' | 'blue' | 'grey' }> = {
  production: { label: 'Production', color: 'green' },
  staging: { label: 'Staging', color: 'blue' },
  development: { label: 'Development', color: 'grey' },
};

const ROLE_OPTIONS: { value: ProjectMembershipRole; label: string }[] = [
  { value: ProjectMembershipRole.MANAGER, label: 'Manager' },
  { value: ProjectMembershipRole.VIEWER, label: 'Viewer' },
];

// ---------------------------------------------------------------------------
// Add Member Modal
// ---------------------------------------------------------------------------

interface AddMemberModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

const AddMemberModal = ({ projectId, isOpen, onClose }: AddMemberModalProps) => {
  const [userId, setUserId] = useState('');
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [role, setRole] = useState<ProjectMembershipRole>(ProjectMembershipRole.VIEWER);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);

  const { data: users = [] } = useUsers();
  const { mutateAsync, isPending, error } = useCreateProjectMembership();

  const selectedUser = users.find((u) => u.id === userId);
  const selectedRoleLabel = ROLE_OPTIONS.find((o) => o.value === role)?.label ?? 'Select role';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      return;
    }
    await mutateAsync({
      spec: {
        project: projectId,
        role,
        member: { case: 'user', value: userId },
      },
    });
    setUserId('');
    setRole(ProjectMembershipRole.VIEWER);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="small">
      <ModalHeader title="Add member" />
      <ModalBody>
        <Form id="add-member-form" onSubmit={handleSubmit}>
          <FormGroup label="User" fieldId="member-user" isRequired>
            <Select
              isOpen={userSelectOpen}
              selected={userId}
              onSelect={(_, value) => {
                setUserId(value as string);
                setUserSelectOpen(false);
              }}
              onOpenChange={setUserSelectOpen}
              toggle={(ref: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setUserSelectOpen((o) => !o)}
                  isExpanded={userSelectOpen}
                  style={{ width: '100%' }}
                >
                  {selectedUser
                    ? `${selectedUser.spec?.firstName ?? ''} ${selectedUser.spec?.lastName ?? ''} (${selectedUser.spec?.email ?? ''})`
                    : 'Select user'}
                </MenuToggle>
              )}
            >
              {users.map((u) => (
                <SelectOption key={u.id} value={u.id}>
                  {u.spec?.firstName} {u.spec?.lastName}{' '}
                  <span style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}>
                    {u.spec?.email}
                  </span>
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label="Role" fieldId="member-role" isRequired>
            <Select
              isOpen={roleSelectOpen}
              selected={role}
              onSelect={(_, value) => {
                setRole(value as ProjectMembershipRole);
                setRoleSelectOpen(false);
              }}
              onOpenChange={setRoleSelectOpen}
              toggle={(ref: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setRoleSelectOpen((o) => !o)}
                  isExpanded={roleSelectOpen}
                  style={{ width: '100%' }}
                >
                  {selectedRoleLabel}
                </MenuToggle>
              )}
            >
              {ROLE_OPTIONS.map((o) => (
                <SelectOption key={o.value} value={o.value}>
                  {o.label}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title="Failed to add member">
              {getErrorMessage(error)}
            </Alert>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            form="add-member-form"
            type="submit"
            isLoading={isPending}
            isDisabled={isPending || !userId}
          >
            Add member
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// ProjectDetailPage
// ---------------------------------------------------------------------------

export const ProjectDetailPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<number>(OVERVIEW_TAB);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id);
  const { data: memberships = [], isLoading: membershipsLoading } = useProjectMemberships({
    projectId: id,
  });
  const { data: users = [] } = useUsers();
  const { mutate: deleteMembership } = useDeleteProjectMembership();

  const title = project?.spec?.title ?? project?.metadata?.name ?? id;
  const env = project?.metadata?.labels?.['env'];
  const envCfg = env ? ENV_LABELS[env] : undefined;
  const stateCfg =
    project?.status?.state != null ? PROJECT_STATE_LABELS[project.status.state] : undefined;
  const created = project?.metadata?.creationTimestamp
    ? new Date(project.metadata.creationTimestamp as unknown as string).toLocaleDateString()
    : '—';

  if (projectLoading) {
    return (
      <PageSection>
        <Spinner />
      </PageSection>
    );
  }

  if (projectError || !project) {
    return (
      <PageSection>
        <Alert variant="danger" isInline title="Failed to load project">
          {projectError ? getErrorMessage(projectError) : 'Project not found.'}
        </Alert>
      </PageSection>
    );
  }

  const getUserLabel = (userId: string) => {
    const u = users.find((user) => user.id === userId);
    if (!u) {
      return userId;
    }
    const name = [u.spec?.firstName, u.spec?.lastName].filter(Boolean).join(' ');
    return name || u.spec?.email || userId;
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/projects')}>
                Projects
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{title}</BreadcrumbItem>
          </Breadcrumb>
          <Stack hasGutter>
            <Title headingLevel="h1" size="3xl">
              {title}{' '}
              {stateCfg && (
                <Label color={stateCfg.color} isCompact style={{ verticalAlign: 'middle' }}>
                  {stateCfg.label}
                </Label>
              )}
              {envCfg && (
                <Label
                  color={envCfg.color}
                  isCompact
                  style={{ verticalAlign: 'middle', marginLeft: '0.5rem' }}
                >
                  {envCfg.label}
                </Label>
              )}
            </Title>
            {project.spec?.description && (
              <span style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}>
                {project.spec.description}
              </span>
            )}
          </Stack>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false} type="tabs">
        <Tabs
          activeKey={activeTab}
          onSelect={(_, key) => setActiveTab(key as number)}
          isBox={false}
        >
          <Tab eventKey={OVERVIEW_TAB} title={<TabTitleText>Overview</TabTitleText>} />
          <Tab
            eventKey={MEMBERS_TAB}
            title={
              <TabTitleText>
                Members <Badge isRead>{memberships.length}</Badge>
              </TabTitleText>
            }
          />
        </Tabs>
      </PageSection>

      <TabContent id="tab-overview" hidden={activeTab !== OVERVIEW_TAB}>
        <TabContentBody>
          <PageSection hasBodyWrapper={false}>
            <Card>
              <CardBody>
                <DescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Name</DescriptionListTerm>
                    <DescriptionListDescription>
                      {project.metadata?.name ?? '—'}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>ID</DescriptionListTerm>
                    <DescriptionListDescription>
                      <code>{project.id}</code>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Environment</DescriptionListTerm>
                    <DescriptionListDescription>
                      {envCfg ? (
                        <Label color={envCfg.color} isCompact>
                          {envCfg.label}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>State</DescriptionListTerm>
                    <DescriptionListDescription>
                      {stateCfg ? (
                        <Label color={stateCfg.color} isCompact>
                          {stateCfg.label}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Created</DescriptionListTerm>
                    <DescriptionListDescription>{created}</DescriptionListDescription>
                  </DescriptionListGroup>
                  {project.spec?.parent && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Parent project</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Button
                          variant="link"
                          isInline
                          onClick={() => navigate(`/projects/${project.spec?.parent}`)}
                        >
                          {project.spec.parent}
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {project.spec?.description && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Description</DescriptionListTerm>
                      <DescriptionListDescription>
                        {project.spec.description}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                  {project.status?.message && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status message</DescriptionListTerm>
                      <DescriptionListDescription>
                        {project.status.message}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>
          </PageSection>
        </TabContentBody>
      </TabContent>

      <TabContent id="tab-members" hidden={activeTab !== MEMBERS_TAB}>
        <TabContentBody>
          <PageSection hasBodyWrapper={false}>
            <Stack hasGutter>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" onClick={() => setAddMemberOpen(true)}>
                  Add member
                </Button>
              </div>
              <Card>
                <CardBody>
                  <Stack hasGutter>
                    {membershipsLoading ? (
                      <Spinner />
                    ) : memberships.length === 0 ? (
                      <Alert variant="info" isInline title="No members yet">
                        Add members to grant them access to this project.
                      </Alert>
                    ) : (
                      <Table aria-label="Project members" variant="compact">
                        <Thead>
                          <Tr>
                            <Th>User</Th>
                            <Th>Role</Th>
                            <Th>Status</Th>
                            <Td />
                          </Tr>
                        </Thead>
                        <Tbody>
                          {memberships.map((membership) => {
                            const memberUserId =
                              membership.spec?.member?.case === 'user'
                                ? membership.spec.member.value
                                : '';
                            const roleCfg =
                              membership.spec?.role != null
                                ? ROLE_LABELS[membership.spec.role]
                                : undefined;
                            const stateMemberCfg =
                              membership.status?.state != null
                                ? MEMBERSHIP_STATE_LABELS[membership.status.state]
                                : undefined;

                            return (
                              <Tr key={membership.id}>
                                <Td dataLabel="User">{getUserLabel(memberUserId)}</Td>
                                <Td dataLabel="Role">
                                  {roleCfg ? (
                                    <Label color={roleCfg.color} isCompact>
                                      {roleCfg.label}
                                    </Label>
                                  ) : (
                                    '—'
                                  )}
                                </Td>
                                <Td dataLabel="Status">
                                  {stateMemberCfg ? (
                                    <Label color={stateMemberCfg.color} isCompact>
                                      {stateMemberCfg.label}
                                    </Label>
                                  ) : (
                                    '—'
                                  )}
                                </Td>
                                <Td isActionCell>
                                  <ActionsColumn
                                    items={[
                                      {
                                        title: 'Remove',
                                        onClick: () => deleteMembership(membership.id),
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
                  </Stack>
                </CardBody>
              </Card>
            </Stack>
          </PageSection>
        </TabContentBody>
      </TabContent>

      <AddMemberModal
        projectId={id}
        isOpen={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
      />
    </>
  );
};
