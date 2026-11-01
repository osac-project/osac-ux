import { Content, Stack, StackItem, Title } from '@patternfly/react-core';

import { Tenants } from '@osac/types/private';
import NameField from '@osac/ui-components/components/catalogProvision/wizard/fields/NameField';
import { InputField } from '@osac/ui-components/components/Form/InputField';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import { ResourceSelectField } from '@osac/ui-components/components/Form/ResourceSelectField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import './PoolStep.css';

const PoolStep = () => {
  const { t } = useTranslation();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('General')}
        </Title>
      </StackItem>
      <StackItem>
        <Content component="p">{t('Define the pool details and assign it to a tenant.')}</Content>
      </StackItem>
      <StackItem>
          <OsacForm className="external-ip-pool__pool-form">
          <NameField isDisabled={false} />
          <InputField
            name="metadata.description"
            label={t('Description')}
            fieldId="external-ip-pool-description"
            multiline
          />
          <ResourceSelectField
            name="metadata.tenant"
            label={t('Tenant')}
            fieldId="external-ip-pool-tenant"
            service={Tenants}
            isRequired
            autoSelectSingleOption
            placeholder={t('Select a tenant')}
            loadErrorTitle={t('Failed to fetch tenants')}
            emptyTitle={t('No registered tenants')}
            emptyDescription={t(
              'Register a tenant before creating and assigning an external IP pool.',
            )}
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default PoolStep;
