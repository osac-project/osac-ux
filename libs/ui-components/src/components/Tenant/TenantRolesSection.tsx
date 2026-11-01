import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Content, Flex, FlexItem, Label, Title } from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import { RoleBindings, Roles, Users } from '@osac/types';
import { useListResource } from '@osac/ui-components/api/use-resource';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import '../shared/details-page.css';

const TenantRolesSection = () => {
  const { t } = useTranslation();
  const { data: roleBindings } = useListResource(RoleBindings);
  const { data: roles } = useListResource(Roles);
  const { data: users } = useListResource(Users);

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
  const assignments = useMemo(
    () =>
      roleBindings?.items.flatMap((roleBinding) =>
        (roleBinding.spec?.users ?? []).map((userReference) => ({
          id: `${roleBinding.id}-${userReference.id}`,
          role: roleBinding.spec?.role
            ? rolesById.get(roleBinding.spec.role.id) || roleBinding.spec.role.name
            : t('Unknown role'),
          user: usersById.get(userReference.id),
          userReference,
        })),
      ) ?? [],
    [roleBindings?.items, rolesById, t, usersById],
  );

  return (
    <div className="details-page__sidebar">
      <Flex
        className="details-page__sidebar-header"
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <FlexItem>
          <Title headingLevel="h2" size="md" className="details-page__sidebar-title">
            {t('Roles')}
          </Title>
        </FlexItem>
        <FlexItem>
          <Button
            variant="link"
            className="details-page__sidebar-action"
            isInline
            icon={<PlusCircleIcon />}
            component={(props) => <Link {...props} to="/tenant/role-binding/create" />}
          >
            {t('Assign roles')}
          </Button>
        </FlexItem>
      </Flex>
      {assignments.length ? (
        <ul className="tenant-roles__list" aria-label={t('Assigned roles')}>
          {assignments.map(({ id, role, user, userReference }) => (
            <li key={id} className="tenant-roles__item">
              <div>
                <Content component="p" className="tenant-roles__user-name">
                  {user?.metadata?.name ||
                    user?.spec?.username ||
                    userReference.name ||
                    userReference.id}
                  <br />
                  <span className="tenant-roles__user-email">
                    {user?.spec?.email || t('Email unavailable')}
                  </span>
                </Content>
                <Label isCompact color={role === 'Tenant Administrator' ? 'purple' : 'blue'}>
                  {role}
                </Label>
              </div>
              <Button
                variant="plain"
                className="tenant-roles__actions"
                aria-label={t('Actions for {{name}}', {
                  name: user?.metadata?.name || user?.spec?.username || userReference.id,
                })}
              >
                <EllipsisVIcon />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default TenantRolesSection;
