import { RoleBinding } from '@osac/types';

export interface RoleBindingCreateFormValues {
  metadata: {
    name: string;
    tenant: string;
  };
  email: string;
  role: string;
}

export const getInitialValues = (
  roleBinding: RoleBinding | undefined,
  tenant: string,
): RoleBindingCreateFormValues => {
  if (roleBinding) {
    return {
      metadata: {
        name: roleBinding.metadata?.name || '',
        tenant: roleBinding.metadata?.tenant || '',
      },
      email: roleBinding.spec?.users[0]?.name || '',
      role: roleBinding.spec?.role?.name || '',
    };
  }

  return {
    metadata: {
      name: '',
      tenant,
    },
    email: '',
    role: '',
  };
};
