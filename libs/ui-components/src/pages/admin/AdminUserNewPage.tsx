/**
 * flow: tenant-administration
 * step: tad_user_new
 * route: /admin/users/new (tenantAdmin)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Form,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectOption,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreateUser } from '@osac/ui-components/api/v1/user';

import { getErrorMessage } from '../../utils/error';

const ROLE_OPTIONS = [
  { value: 'tenantUser', label: 'Tenant User — operate VM workloads' },
  { value: 'tenantAdmin', label: 'Tenant Admin — manage users, quota, network' },
];

export const AdminUserNewPage = () => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('tenantUser');
  const [roleOpen, setRoleOpen] = useState(false);
  const [requireMfa, setRequireMfa] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);

  const { mutateAsync, isPending, error } = useCreateUser();

  const isValid =
    firstName.trim().length > 0 && lastName.trim().length > 0 && email.trim().length > 0;

  const selectedRoleLabel = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    await mutateAsync({
      spec: {
        username: email.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });
    navigate('/admin/users');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/users')}>
                Users
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Invite user</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Invite user
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="invite-user-form">
          <FormGroup label="First name" isRequired fieldId="invite-first-name">
            <TextInput
              id="invite-first-name"
              value={firstName}
              onChange={(_e, v) => setFirstName(v)}
              placeholder="Jane"
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label="Last name" isRequired fieldId="invite-last-name">
            <TextInput
              id="invite-last-name"
              value={lastName}
              onChange={(_e, v) => setLastName(v)}
              placeholder="Doe"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Email" isRequired fieldId="invite-email">
            <TextInput
              id="invite-email"
              type="email"
              value={email}
              onChange={(_e, v) => setEmail(v)}
              placeholder="jane@example.com"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Role" isRequired fieldId="invite-role">
            <Select
              isOpen={roleOpen}
              onSelect={(_e, val) => {
                setRole(val as string);
                setRoleOpen(false);
              }}
              onOpenChange={setRoleOpen}
              selected={role}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setRoleOpen(!roleOpen)}
                  isExpanded={roleOpen}
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

          <FormGroup fieldId="invite-mfa">
            <Checkbox
              id="invite-mfa"
              label="Require MFA enrollment"
              isChecked={requireMfa}
              onChange={(_e, v) => setRequireMfa(v)}
            />
          </FormGroup>

          <FormGroup fieldId="invite-send-email">
            <Checkbox
              id="invite-send-email"
              label="Send invite email"
              isChecked={sendEmail}
              onChange={(_e, v) => setSendEmail(v)}
            />
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title="Failed to invite user">
              {getErrorMessage(error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="invite-user-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              Send invite
            </Button>
            <Button variant="link" onClick={() => navigate('/admin/users')} isDisabled={isPending}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
