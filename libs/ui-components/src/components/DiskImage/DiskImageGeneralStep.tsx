import { Content, FormGroup, Stack, StackItem } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { Tenants } from '@osac/types/private';

import DiskImageScopeField from './DiskImageScopeField';
import type { DiskImageFormValues } from './values';
import { useListResource } from '../../api/use-resource';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';
import NameField from '../catalogProvision/wizard/fields/NameField';
import { InputField } from '../Form/InputField';
import { KeyValueMapField } from '../Form/KeyValueMapField';
import OsacForm from '../Form/OsacForm';
import { SelectField } from '../Form/SelectField';

const generateDiskImageName = (): string => `disk-image-${crypto.randomUUID().slice(0, 8)}`;

const DiskImageGeneralStep = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<DiskImageFormValues>();
  const isAdmin = useSession().role === 'admin';
  const { data: tenantsResponse } = useListResource(Tenants, {}, { enabled: isAdmin });
  const tenants = tenantsResponse?.items ?? [];

  const scopeOptions = [
    { value: '', label: t('Global') },
    ...tenants.map((tenant) => ({ value: tenant.id, label: tenant.metadata?.name || tenant.id })),
  ];

  return (
    <Stack hasGutter>
      <StackItem>
        <Content component="p">
          {t('Assign the disk image to a tenant (or make it global), then enter a name.')}
        </Content>
      </StackItem>
      <StackItem>
        <FormGroup label={t('Scope')} fieldId="disk-image-scope" isRequired>
          <DiskImageScopeField />
          <Content component="p">
            {t(
              'Global resources are available to all tenants. Tenant-scoped resources must be assigned to one tenant.',
            )}
          </Content>
        </FormGroup>
      </StackItem>
      <StackItem>
        <OsacForm>
          {values.scope === 'tenant' && (
            <SelectField
              name="metadata.tenant"
              label={t('Tenant')}
              fieldId="disk-image-tenant"
              isRequired
              options={scopeOptions.slice(1)}
              placeholder={t('Select a tenant')}
            />
          )}
          <NameField generateName={generateDiskImageName} />
          <InputField
            name="metadata.description"
            label={t('Description')}
            fieldId="metadata-description"
            multiline
            rows={4}
          />
          <KeyValueMapField
            name="metadata.labels"
            label={t('Labels')}
            fieldId="metadata-labels"
            addLabel={t('Add label')}
            removeLabel={t('Remove label')}
            keyLabel={t('Key')}
            valueLabel={t('Value')}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default DiskImageGeneralStep;
