/**
 * flow: tenant-administration
 * step: tad_users
 * route: /admin/users (tenantAdmin)
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
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { useUsers } from '@osac/ui-components/api/v1/user';
import ListPage from '@osac/ui-components/components/Page/ListPage';
import ListPageBody from '@osac/ui-components/components/Page/ListPageBody';

import {
  readUserDisplayName,
  readUserEmail,
  readUserLastLogin,
  readUserRole,
  readUserStatus,
} from '../../utils/adminWireDisplay';

import '../../components/shared/DataTable.css';

type RoleFilter = 'tenantUser' | 'tenantAdmin';
type StatusFilter = 'active' | 'inactive';
type MfaFilter = 'Enrolled' | 'Pending';

export const AdminUsersPage = () => {
  const navigate = useNavigate();
  const { data: users = [], isLoading, error } = useUsers();

  const [search, setSearch] = useState('');
  const [roleFilters, setRoleFilters] = useState<RoleFilter[]>([]);
  const [statusFilters, setStatusFilters] = useState<StatusFilter[]>([]);
  const [mfaFilters, setMfaFilters] = useState<MfaFilter[]>([]);
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);

  const toggleRole = (v: RoleFilter) =>
    setRoleFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleStatus = (v: StatusFilter) =>
    setStatusFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  const toggleMfa = (v: MfaFilter) =>
    setMfaFilters((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  const clearAll = () => {
    setSearch('');
    setRoleFilters([]);
    setStatusFilters([]);
    setMfaFilters([]);
  };
  const hasFilters =
    search !== '' || roleFilters.length > 0 || statusFilters.length > 0 || mfaFilters.length > 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((user) => {
      if (q) {
        const name = readUserDisplayName(user).toLowerCase();
        const email = (readUserEmail(user) ?? '').toLowerCase();
        const uname = (((user as Record<string, unknown>).username as string) ?? '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !uname.includes(q)) {
          return false;
        }
      }
      if (roleFilters.length > 0) {
        const r = readUserRole(user);
        if (!r || !roleFilters.includes(r as RoleFilter)) {
          return false;
        }
      }
      if (statusFilters.length > 0) {
        const s = readUserStatus(user);
        if (!s || !statusFilters.includes(s as StatusFilter)) {
          return false;
        }
      }
      if (mfaFilters.length > 0) {
        const mfa =
          (user as Record<string, unknown>).mfa_enrolled ??
          (user as Record<string, unknown>).mfaEnrolled;
        const label: MfaFilter | null =
          mfa === true ? 'Enrolled' : mfa === false ? 'Pending' : null;
        if (!label || !mfaFilters.includes(label)) {
          return false;
        }
      }
      return true;
    });
  }, [users, search, roleFilters, statusFilters, mfaFilters]);

  return (
    <ListPage title="Users" description="Manage users and access for your organization.">
      <ListPageBody isLoading={isLoading} error={error}>
        <Toolbar clearAllFilters={clearAll}>
          <ToolbarContent>
            <ToolbarItem>
              <SearchInput
                aria-label="Search users"
                placeholder="Search by name, email or username"
                value={search}
                onChange={(_e, v) => setSearch(v)}
                onClear={() => setSearch('')}
              />
            </ToolbarItem>
            <ToolbarGroup variant="filter-group">
              <ToolbarFilter
                labels={roleFilters}
                deleteLabel={(_g, v) =>
                  toggleRole((typeof v === 'string' ? v : (v as { key: string }).key) as RoleFilter)
                }
                deleteLabelGroup={() => setRoleFilters([])}
                categoryName="Role"
              >
                <Select
                  isOpen={roleOpen}
                  onOpenChange={setRoleOpen}
                  onSelect={(_e, v) => toggleRole(v as RoleFilter)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setRoleOpen(!roleOpen)}
                      isExpanded={roleOpen}
                      badge={roleFilters.length || undefined}
                    >
                      Role
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['tenantUser', 'tenantAdmin'] as RoleFilter[]).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={roleFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
              <ToolbarFilter
                labels={statusFilters}
                deleteLabel={(_g, v) =>
                  toggleStatus(
                    (typeof v === 'string' ? v : (v as { key: string }).key) as StatusFilter,
                  )
                }
                deleteLabelGroup={() => setStatusFilters([])}
                categoryName="Status"
              >
                <Select
                  isOpen={statusOpen}
                  onOpenChange={setStatusOpen}
                  onSelect={(_e, v) => toggleStatus(v as StatusFilter)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setStatusOpen(!statusOpen)}
                      isExpanded={statusOpen}
                      badge={statusFilters.length || undefined}
                    >
                      Status
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['active', 'inactive'] as StatusFilter[]).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={statusFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
              <ToolbarFilter
                labels={mfaFilters}
                deleteLabel={(_g, v) =>
                  toggleMfa((typeof v === 'string' ? v : (v as { key: string }).key) as MfaFilter)
                }
                deleteLabelGroup={() => setMfaFilters([])}
                categoryName="MFA"
              >
                <Select
                  isOpen={mfaOpen}
                  onOpenChange={setMfaOpen}
                  onSelect={(_e, v) => toggleMfa(v as MfaFilter)}
                  toggle={(ref) => (
                    <MenuToggle
                      ref={ref}
                      onClick={() => setMfaOpen(!mfaOpen)}
                      isExpanded={mfaOpen}
                      badge={mfaFilters.length || undefined}
                    >
                      MFA
                    </MenuToggle>
                  )}
                >
                  <SelectList>
                    {(['Enrolled', 'Pending'] as MfaFilter[]).map((v) => (
                      <SelectOption
                        key={v}
                        value={v}
                        hasCheckbox
                        isSelected={mfaFilters.includes(v)}
                      >
                        {v}
                      </SelectOption>
                    ))}
                  </SelectList>
                </Select>
              </ToolbarFilter>
            </ToolbarGroup>
            <ToolbarItem align={{ default: 'alignEnd' }}>
              <Button variant="primary" onClick={() => navigate('/admin/users/new')}>
                Invite user
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {hasFilters && filtered.length === 0 ? (
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ gap: '0.5rem', padding: '1rem 0' }}
          >
            <FlexItem>No users match the current filters.</FlexItem>
            <FlexItem>
              <Button variant="link" isInline onClick={clearAll}>
                Clear filters
              </Button>
            </FlexItem>
          </Flex>
        ) : users.length === 0 ? (
          <Alert variant="info" isInline title="No users found">
            No users are registered for this organization yet.
          </Alert>
        ) : (
          <Table aria-label="Tenant users">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>MFA</Th>
                <Th>Status</Th>
                <Th>Last login</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((user) => {
                const role = readUserRole(user);
                const status = readUserStatus(user);
                const mfaEnrolled =
                  (user as Record<string, unknown>).mfa_enrolled ??
                  (user as Record<string, unknown>).mfaEnrolled;
                return (
                  <Tr key={user.id}>
                    <Td dataLabel="Name" className="osac-data-table__primary-cell">
                      {readUserDisplayName(user)}
                    </Td>
                    <Td dataLabel="Email">{readUserEmail(user) ?? '—'}</Td>
                    <Td dataLabel="Role">
                      {role ? (
                        <Label
                          color={role === 'tenantAdmin' ? 'blue' : 'grey'}
                          isCompact
                          variant="outline"
                        >
                          {role}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="MFA">
                      {mfaEnrolled === true ? (
                        <Label color="green" isCompact>
                          Enrolled
                        </Label>
                      ) : mfaEnrolled === false ? (
                        <Label color="orange" isCompact>
                          Pending
                        </Label>
                      ) : (
                        <Label color="grey" isCompact>
                          —
                        </Label>
                      )}
                    </Td>
                    <Td dataLabel="Status">
                      {status ? (
                        <Label color={status === 'active' ? 'green' : 'grey'} isCompact>
                          {status}
                        </Label>
                      ) : (
                        '—'
                      )}
                    </Td>
                    <Td dataLabel="Last login" className="osac-data-table__muted-cell">
                      {readUserLastLogin(user) ?? '—'}
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
