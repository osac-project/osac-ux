import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  FormGroup,
  Gallery,
  GalleryItem,
  HelperText,
  HelperTextItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useField } from 'formik';

import { Architecture, GuestOSFamily } from '@osac/types';

import { architectureLabels } from './DiskImageTable';
import { useTranslation } from '../../hooks/useTranslation';
import { getVisibleFieldError } from '../Form/fieldError';
import { useShowFieldValidationErrors } from '../Form/FieldValidationContext';
import { FormFieldHelper } from '../Form/FormFieldHelper';
import { InputField } from '../Form/InputField';
import { GuestOsIcon, type OsType } from '../shared/GuestOsIcon';

import './DiskImageConfigurationStep.css';

interface GuestOsOption {
  family: GuestOSFamily;
  label: string;
  description: string;
  icon?: OsType;
}

const DiskImageConfigurationStep = () => {
  const { t } = useTranslation();
  const [guestOsField, , guestOsHelpers] = useField<GuestOSFamily>('spec.guestOsFamily');
  const [architectureField, architectureMeta, architectureHelpers] =
    useField<Architecture[]>('spec.architecture');
  const showValidationErrors = useShowFieldValidationErrors();
  const architectureError = getVisibleFieldError(architectureMeta, showValidationErrors);
  const guestOsOptions: GuestOsOption[] = [
    {
      family: GuestOSFamily.GUEST_OS_FAMILY_LINUX,
      label: t('Linux'),
      description: t('Linux-based guest operating systems'),
      icon: 'linux',
    },
    {
      family: GuestOSFamily.GUEST_OS_FAMILY_WINDOWS,
      label: t('Microsoft Windows'),
      description: t('Windows-based guest operating systems'),
      icon: 'windows',
    },
    {
      family: GuestOSFamily.GUEST_OS_FAMILY_UNSPECIFIED,
      label: t('Unspecified'),
      description: t('Unspecified guest operating systems'),
    },
  ];
  const architectureText = architectureLabels(t);

  const toggleArchitecture = (architecture: Architecture, checked: boolean) => {
    const selected = new Set(architectureField.value ?? []);
    if (checked) {
      selected.add(architecture);
    } else {
      selected.delete(architecture);
    }
    void architectureHelpers.setValue(Array.from(selected), true);
  };

  return (
    <Stack hasGutter className="disk-image-configuration-step">
      <StackItem>
        <Title headingLevel="h2" size="2xl">
          {t('Configuration')}
        </Title>
      </StackItem>
      <StackItem>
        <p>{t('Provide the image reference and guest operating system details.')}</p>
      </StackItem>
      <StackItem>
        <InputField
          name="spec.sourceRef"
          label={t('Image')}
          fieldId="disk-image-source-ref"
          isRequired
          helperText={t('Example: quay.io/containerdisks/fedora:latest')}
        />
      </StackItem>
      <StackItem>
        <FormGroup label={t('Guest operating system')} fieldId="disk-image-guest-os" isRequired>
          <Gallery hasGutter minWidths={{ default: '220px' }}>
            {guestOsOptions.map((option) => {
              const isSelected = guestOsField.value === option.family;
              return (
                <GalleryItem key={option.family}>
                  <Card
                    className={`disk-image-guest-os-card${
                      isSelected ? ' disk-image-guest-os-card--selected' : ''
                    }`}
                    isSelectable
                    isSelected={isSelected}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => void guestOsHelpers.setValue(option.family)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        void guestOsHelpers.setValue(option.family);
                      }
                    }}
                  >
                    <CardHeader>
                      {option.icon ? <GuestOsIcon os={option.icon} size="md" /> : null}
                      {isSelected ? <Label variant="outline">{t('Selected')}</Label> : null}
                    </CardHeader>
                    <CardTitle>{option.label}</CardTitle>
                    <CardBody>{option.description}</CardBody>
                  </Card>
                </GalleryItem>
              );
            })}
          </Gallery>
        </FormGroup>
      </StackItem>
      <StackItem>
        <FormGroup label={t('Architecture')} fieldId="disk-image-architecture" isRequired>
          <div className="disk-image-architecture-options">
            {Object.entries(architectureText)
              .filter(([value]) => Number(value) !== Architecture.UNSPECIFIED)
              .map(([value, label]) => {
                const architecture = Number(value) as Architecture;
                return (
                  <Checkbox
                    key={value}
                    id={`disk-image-architecture-${value}`}
                    label={label}
                    isChecked={architectureField.value?.includes(architecture) ?? false}
                    onChange={(_event, checked) => toggleArchitecture(architecture, checked)}
                  />
                );
              })}
          </div>
          <HelperText>
            <HelperTextItem>{t('You may select multiple architecture types.')}</HelperTextItem>
          </HelperText>
          <FormFieldHelper error={architectureError} fieldId="disk-image-architecture" />
        </FormGroup>
      </StackItem>
    </Stack>
  );
};

export default DiskImageConfigurationStep;
