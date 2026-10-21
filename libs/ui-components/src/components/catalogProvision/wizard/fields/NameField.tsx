import { Button } from '@patternfly/react-core';
import SyncAltIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';
import { useField } from 'formik';

import { useTranslation } from '../../../../hooks/useTranslation';
import { InputField } from '../../../Form/InputField';

interface NameFieldProps {
  generateName?: () => string;
  isDisabled?: boolean;
  name?: string;
  fieldId?: string;
}

const NameField = ({
  generateName,
  isDisabled,
  name = 'metadata.name',
  fieldId = 'metadata-name',
}: NameFieldProps) => {
  const { t } = useTranslation();
  const [, , helpers] = useField<string>(name);

  return (
    <InputField
      name={name}
      label={t('Name')}
      fieldId={fieldId}
      isRequired
      helperText={t('Enter a name, or click the Generate icon to create one.')}
      isDisabled={isDisabled}
    >
      {generateName ? (
        <Button
          variant="plain"
          icon={<SyncAltIcon aria-hidden />}
          title={t('Generate name')}
          aria-label={t('Generate name')}
          onClick={() => void helpers.setValue(generateName())}
          isDisabled={isDisabled}
        />
      ) : null}
    </InputField>
  );
};

export default NameField;
