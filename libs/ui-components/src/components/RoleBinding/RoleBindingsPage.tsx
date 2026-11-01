import { useMemo, useState } from 'react';
import {
  Button,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { type RoleBinding, RoleBindings, Roles, Users } from '@osac/types';
import {
  useDeleteResource,
  useListResource,
  useUpdateResource,
} from '@osac/ui-components/api/use-resource';
import CreateButton from '@osac/ui-components/components/Primitives/CreateButton.tsx';
import { SEARCH_PARAM, usePageFilter } from '@osac/ui-components/hooks/use-page-filter.ts';

import RoleBindingActionsMenu from './RoleBindingActionsMenu';
import { useTranslation } from '../../hooks/useTranslation';
import ListPage from '../Page/ListPage';
import ListPageBody from '../Page/ListPageBody';
import { SubtleContent } from '../SubtleContent/SubtleContent';

const ROLE_PARAM = 'role';

interface RemoveTarget {
  userId: string;
  userName: string;
  roleBinding: RoleBinding;
}

// ── RoleBindingsPage ─────────────────────────────────────────────────────────

const RoleBindingsPage = () => {
  const { t } = useTranslation();

  const [search, setSearch] = usePageFilter(SEARCH_PARAM);
  const [roleFilter, setRoleFilter] = usePageFilter(ROLE_PARAM);

  const { data: roleBindings, isLoading, error } = useListResource(RoleBindings);
  const { data: roles } = useListResource(Roles);
  const { data: users } = useListResource(Users);

  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  const updateRoleBinding = useUpdateResource(RoleBindings);
  const deleteRoleBinding = useDeleteResource(RoleBindings);

  const rolesById = useMemo(
    () =>
      new Map(
        roles?.items.map((role) => [role.id, role.spec?.title || role.metadata?.name || role.id]),
      ),
    [roles?.items],
  );

  const usersById = useMemo(
    () => new Map(users?.items.map((user) => [user.id, user])),
    [users?.items],
  );

  // Flatten role bindings → one row per user
  const assignments = useMemo(
    () =>
      roleBindings?.items.flatMap((rb) =>
        (rb.spec?.users ?? []).map((userRef) => {
          const user = usersById.get(userRef.id);
          return {
            key: `${rb.id}-${userRef.id}`,
            userId: userRef.id,
            userName:
              user?.metadata?.name || user?.spec?.username || userRef.name || userRef.id,
            userEmail: user?.spec?.email,
            roleId: rb.spec?.role?.id ?? '',
            roleTitle: rb.spec?.role
              ? (rolesById.get(rb.spec.role.id) ?? rb.spec.role.name)
              : t('Unknown role'),
            roleBinding: rb,
          };
        }),
      ) ?? [],
    [roleBindings?.items, rolesById, usersById, t],
  );

  // Role options for the select filter
  const roleOptions = useMemo(
    () =>
      (roles?.items ?? []).map((role) => ({
        value: role.id,
        label: role.spec?.title || role.metadata?.name || role.id,
      })),
    [roles?.items],
  );

  const [roleSelectOpen, setRoleSelectOpen] = useState(false);
  const selectedRoleLabel =
    roleOptions.find((o) => o.value === roleFilter)?.label ?? t('All roles');

  // Apply filters
  const filteredAssignments = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return assignments.filter((a) => {
      if (roleFilter && a.roleId !== roleFilter) {
        return false;
      }
      if (lowerSearch) {
        const matchesName = a.userName.toLowerCase().includes(lowerSearch);
        const matchesEmail = a.userEmail?.toLowerCase().includes(lowerSearch) ?? false;
        if (!matchesName && !matchesEmail) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, search, roleFilter]);

  const handleRemove = () => {
    if (!removeTarget) {
      return;
    }

    const { userId, roleBinding } = removeTarget;
    const remainingUsers = (roleBinding.spec?.users ?? []).filter((u) => u.id !== userId);

    if (remainingUsers.length === 0) {
      deleteRoleBinding.mutate(
        { id: roleBinding.id },
        { onSuccess: () => setRemoveTarget(null) },
      );
    } else {
      updateRoleBinding.mutate(
        {
          object: {
            id: roleBinding.id,
            spec: { ...roleBinding.spec, users: remainingUsers },
          },
        },
        { onSuccess: () => setRemoveTarget(null) },
      );
    }
  };

  const isPending = updateRoleBinding.isPending || deleteRoleBinding.isPending;

  const hasNoResults = !isLoading && assignments.length > 0 && filteredAssignments.length === 0;
  const isEmpty = !isLoading && assignments.length === 0;

  return (
    <>
      <ListPage
        title={t('Roles')}
        description={t('Manage who has tenant admin access to catalog, networking, and projects for your tenant.')}
        error={error}
        actions={<CreateButton to="create">{t('Add tenant')}</CreateButton>}
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Toolbar>
            <ToolbarContent>
              <ToolbarGroup>
                <ToolbarItem>
                  <Select
                    isOpen={roleSelectOpen}
                    onOpenChange={setRoleSelectOpen}
                    onSelect={(_e, value) => {
                      setRoleFilter(value === '' ? '' : (value as string));
                      setRoleSelectOpen(false);
                    }}
                    toggle={(ref) => (
                      <MenuToggle
                        ref={ref}
                        onClick={() => setRoleSelectOpen((o) => !o)}
                        isExpanded={roleSelectOpen}
                        style={{ borderRadius: 'var(--pf-v6-global--BorderRadius--sm, 3px)' }}
                      >
                        {selectedRoleLabel}
                      </MenuToggle>
                    )}
                  >
                    <SelectList>
                      <SelectOption value="" isSelected={!roleFilter}>
                        {t('All roles')}
                      </SelectOption>
                      {roleOptions.map((option) => (
                        <SelectOption
                          key={option.value}
                          value={option.value}
                          isSelected={roleFilter === option.value}
                        >
                          {option.label}
                        </SelectOption>
                      ))}
                    </SelectList>
                  </Select>
                </ToolbarItem>
                <ToolbarItem>
                  <SearchInput
                    placeholder={t('Search by name or email…')}
                    value={search}
                    onChange={(_e, v) => setSearch(v)}
                    onClear={() => setSearch('')}
                    aria-label={t('Search users')}
                  />
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>

          {isEmpty ? (
            <SubtleContent component="p">{t('No role bindings available.')}</SubtleContent>
          ) : hasNoResults ? (
            <SubtleContent component="p">{t('No users match your filters.')}</SubtleContent>
          ) : (
            <Table aria-label={t('Role Bindings')} variant="compact">
              <Thead>
                <Tr>
                  <Th>{t('Name')}</Th>
                  <Th>{t('Role')}</Th>
                  <Th aria-label={t('Actions')} />
                </Tr>
              </Thead>
              <Tbody>
                {filteredAssignments.map(
                  ({ key, userId, userName, userEmail, roleTitle, roleBinding }) => (
                    <Tr key={key}>
                      <Td dataLabel={t('Name')}>
                        <div>{userName}</div>
                        {userEmail && (
                          <SubtleContent component="small">{userEmail}</SubtleContent>
                        )}
                      </Td>
                      <Td dataLabel={t('Role')}>
                        <Label isCompact color="blue">
                          {roleTitle}
                        </Label>
                      </Td>
                      <Td isActionCell>
                        <RoleBindingActionsMenu
                          roleBinding={roleBinding}
                          actionName={userName}
                          onRemove={() => setRemoveTarget({ userId, userName, roleBinding })}
                        />
                      </Td>
                    </Tr>
                  ),
                )}
              </Tbody>
            </Table>
          )}
        </ListPageBody>
      </ListPage>

      {removeTarget && (
        <Modal
          variant="small"
          isOpen
          onClose={isPending ? undefined : () => setRemoveTarget(null)}
          aria-labelledby="remove-user-title"
        >
          <ModalHeader
            title={t('Remove {{name}}?', { name: removeTarget.userName })}
            titleIconVariant="warning"
            labelId="remove-user-title"
          />
          <ModalBody>
            {t(
              'This removes the user from the role binding. The user will lose the permissions granted by this role. This action cannot be undone.',
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="danger"
              onClick={handleRemove}
              isDisabled={isPending}
              isLoading={isPending}
            >
              {t('Remove')}
            </Button>
            <Button
              variant="link"
              onClick={() => setRemoveTarget(null)}
              isDisabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </>
  );
};

export default RoleBindingsPage;
