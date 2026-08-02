/**
 * flow: manage-rbac
 * route: /admin/role-bindings/assign (tenantAdmin)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  Form,
  FormGroup,
  Label,
  LabelGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectOption,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreateRoleBinding, useRoles } from '../../api/v1/role-binding';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

export const AdminRoleBindingAssignPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: roles = [] } = useRoles();

  const [roleId, setRoleId] = useState('');
  const [roleOpen, setRoleOpen] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [users, setUsers] = useState<string[]>([]);

  const { mutateAsync, isPending, error } = useCreateRoleBinding();

  const isValid = roleId.length > 0 && users.length > 0;
  const selectedRole = roles.find((r) => r.id === roleId);

  const addUser = () => {
    const v = userInput.trim();
    if (v && !users.includes(v)) {
      setUsers((prev) => [...prev, v]);
      setUserInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const allUsers = userInput.trim() ? [...users, userInput.trim()] : users;
    await mutateAsync({ spec: { role: roleId, users: allUsers } });
    navigate('/admin/role-bindings');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/role-bindings')}>
                {t('Role management')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Assign role')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Assign role to users')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="assign-role-form">
          <FormGroup label={t('Role')} isRequired fieldId="role-select">
            <Select
              isOpen={roleOpen}
              onSelect={(_e, val) => {
                setRoleId(val as string);
                setRoleOpen(false);
              }}
              onOpenChange={setRoleOpen}
              selected={roleId || undefined}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setRoleOpen(!roleOpen)}
                  isExpanded={roleOpen}
                  style={{ width: '100%' }}
                >
                  {selectedRole?.spec?.title ?? t('Select role')}
                </MenuToggle>
              )}
            >
              {roles.map((r) => (
                <SelectOption key={r.id} value={r.id} description={r.spec?.description}>
                  {r.spec?.title ?? r.id}
                </SelectOption>
              ))}
            </Select>
            {selectedRole?.spec?.description && (
              <Content
                component="small"
                style={{ color: 'var(--pf-t--global--color--200)', marginTop: '0.25rem' }}
              >
                {selectedRole.spec.description}
              </Content>
            )}
          </FormGroup>

          <FormGroup
            label={t('Users')}
            isRequired
            fieldId="role-users"
            helperText={t(
              'Enter a user ID or email and press Enter to add. Multiple users can be added.',
            )}
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
              id="role-users"
              value={userInput}
              onChange={(_e, v) => setUserInput(v)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addUser();
                }
              }}
              onBlur={addUser}
              placeholder={t('user ID or email (press Enter to add)')}
            />
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title={t('Failed to assign role')}>
              {getErrorMessage(error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="assign-role-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              {t('Assign')}
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/admin/role-bindings')}
              isDisabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
