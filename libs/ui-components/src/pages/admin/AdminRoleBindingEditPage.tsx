/**
 * flow: manage-rbac
 * route: /admin/role-bindings/:id (tenantAdmin)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  FormGroup,
  Label,
  LabelGroup,
  PageSection,
  Spinner,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';
import { Form } from '@patternfly/react-core';

import { usePatchRoleBinding, useRoleBindings, useRoles } from '../../api/v1/role-binding';
import { getErrorMessage } from '../../utils/error';

export const AdminRoleBindingEditPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: bindings = [], isLoading } = useRoleBindings();
  const { data: roles = [] } = useRoles();
  const patch = usePatchRoleBinding();

  const binding = bindings.find((b) => b.id === id);
  const roleName = binding?.spec?.role
    ? (roles.find((r) => r.id === binding.spec?.role)?.spec?.title ?? binding.spec.role)
    : '—';

  const [users, setUsers] = useState<string[]>([]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    if (binding?.spec?.users) {
      setUsers(binding.spec.users);
    }
  }, [binding?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const addUser = () => {
    const v = userInput.trim();
    if (v && !users.includes(v)) {
      setUsers((prev) => [...prev, v]);
      setUserInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) {
      return;
    }
    const allUsers = userInput.trim() ? [...users, userInput.trim()] : users;
    await patch.mutateAsync({ id, patch: { spec: { users: allUsers } } });
    navigate('/admin/role-bindings');
  };

  if (isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading role binding" />
      </PageSection>
    );
  }

  if (!binding) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="warning" isInline title={`Role binding not found: ${id}`}>
          <Button variant="link" onClick={() => navigate('/admin/role-bindings')}>
            Back to Role management
          </Button>
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/role-bindings')}>
                Role management
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Edit binding — {roleName}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Edit role binding
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="edit-binding-form">
          <FormGroup label="Role" fieldId="binding-role">
            <Label color="blue" isCompact>
              {roleName}
            </Label>
          </FormGroup>

          <FormGroup
            label="Users"
            isRequired
            fieldId="binding-users"
            helperText="Enter a user ID or email and press Enter to add or remove. The binding will be updated with this exact user list."
          >
            {users.length > 0 && (
              <LabelGroup style={{ marginBottom: '0.5rem' }}>
                {users.map((u) => (
                  <Label
                    key={u}
                    isCompact
                    onClose={() => setUsers((prev) => prev.filter((x) => x !== u))}
                  >
                    {u}
                  </Label>
                ))}
              </LabelGroup>
            )}
            <TextInput
              id="binding-users"
              value={userInput}
              onChange={(_e, v) => setUserInput(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addUser();
                }
              }}
              onBlur={addUser}
              placeholder="user ID or email (press Enter to add)"
            />
          </FormGroup>

          {patch.error && (
            <Alert variant="danger" isInline title="Failed to update binding">
              {getErrorMessage(patch.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="edit-binding-form"
              isLoading={patch.isPending}
              isDisabled={patch.isPending || users.length === 0}
            >
              Save changes
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/admin/role-bindings')}
              isDisabled={patch.isPending}
            >
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
