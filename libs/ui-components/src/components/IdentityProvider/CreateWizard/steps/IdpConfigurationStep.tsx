import { Stack, StackItem, Title } from '@patternfly/react-core';

import { InputField } from '@osac/ui-components/components/Form/InputField';
import OsacForm from '@osac/ui-components/components/Form/OsacForm';
import { SelectField } from '@osac/ui-components/components/Form/SelectField';

import { useTranslation } from '../../../../hooks/useTranslation';

interface IdpConfigurationStepProps {
  isEdit: boolean;
}

const IdpConfigurationStep = ({ isEdit }: IdpConfigurationStepProps) => {
  const { t } = useTranslation();
  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Identity provider')}
        </Title>
      </StackItem>
      <StackItem>
        <OsacForm>
          <InputField
            name="primaryEmailDomain"
            label={t('Primary email domain')}
            fieldId="idp-primary-email-domain"
            isDisabled={isEdit}
          />
          <SelectField
            name="protocol"
            label={t('Protocol')}
            fieldId="idp-protocol"
            isRequired
            options={[{ value: 'oidc', label: t('OpenID Connect (OIDC)') }]}
          />
          <InputField name="spec.title" label={t('Display name')} fieldId="idp-title" isRequired />
          <InputField
            name="spec.config.issuer"
            label={t('Issuer URL')}
            fieldId="idp-issuer"
            isRequired
          />
          <InputField
            name="spec.config.clientId"
            label={t('Client ID')}
            fieldId="idp-client-id"
            isRequired
          />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};

export default IdpConfigurationStep;
