import { Secret, SecretType } from '@osac/types';
import { cel } from '@osac/ui-components/api/cel';
import { InputField } from '@osac/ui-components/components/Form/InputField';
import { RadioButtonField } from '@osac/ui-components/components/Form/RadioButtonField';
import SecretSelectionField from '@osac/ui-components/components/Form/SecretSelectionField';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import UserDataSourceCards from './UserDataSourceCards';

type UserDataFieldProps = {
  sourceName: string;
  secretRefName: string;
  inlineName: string;
  currentSource: 'secret' | 'inline';
  projectName: string;
  useCards?: boolean;
};

const UserDataField = ({
  sourceName,
  secretRefName,
  inlineName,
  currentSource,
  projectName,
  useCards = false,
}: UserDataFieldProps) => {
  const { t } = useTranslation();

  return (
    <>
      {useCards ? (
        <UserDataSourceCards name={sourceName} currentSource={currentSource} />
      ) : (
        <RadioButtonField
          name={sourceName}
          label={t('User data')}
          fieldId="user-data-source"
          options={[
            { value: 'inline', label: t('Enter value') },
            { value: 'secret', label: t('Select secret') },
          ]}
        />
      )}
      {currentSource === 'secret' ? (
        <SecretSelectionField
          label={t('User data secret')}
          filter={cel<Secret>((filter) =>
            filter.and(
              filter.field('metadata.project').equals(projectName),
              filter.field('type').equals(SecretType.USER_DATA),
            ),
          )}
          name={secretRefName}
          placeholder={t('Select a user data secret')}
          asFormGroup={false}
        />
      ) : (
        <InputField
          label={useCards ? t('Cloud-init') : t('User data')}
          name={inlineName}
          fieldId="inline-user-data"
          multiline
          placeholder={useCards ? t('Add cloud-init configuration') : undefined}
          helperText={
            useCards
              ? t(
                  'Optional user data applied when the virtual machine starts. Supported on Fedora and RHEL images.',
                )
              : t('Optional cloud-init user data (max 64 KB).')
          }
          asFormGroup={false}
        />
      )}
    </>
  );
};

export default UserDataField;
