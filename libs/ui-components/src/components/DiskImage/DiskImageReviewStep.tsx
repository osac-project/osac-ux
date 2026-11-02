import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import { architectureLabels, guestOsFamilyLabels } from './DiskImageTable';
import type { DiskImageFormValues } from './values';
import { useTranslation } from '../../hooks/useTranslation';

const DiskImageReviewStep = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<DiskImageFormValues>();
  const architectureText = architectureLabels(t);
  const guestOsFamilyText = guestOsFamilyLabels(t);
  const architecture = values.spec.architecture
    .map((value) => architectureText[value] ?? t('Unspecified'))
    .join(', ');

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="lg">
          {t('Review')}
        </Title>
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal isCompact aria-label={t('Review')}>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
            <DescriptionListDescription>{values.metadata.name || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.metadata.description || '—'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Image')}</DescriptionListTerm>
            <DescriptionListDescription>{values.spec.sourceRef || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Scope')}</DescriptionListTerm>
            <DescriptionListDescription>
              {values.scope === 'tenant' ? values.metadata.tenant || '—' : t('Global')}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Source type')}</DescriptionListTerm>
            <DescriptionListDescription>{t('REGISTRY')}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Guest OS family')}</DescriptionListTerm>
            <DescriptionListDescription>
              {guestOsFamilyText[values.spec.guestOsFamily] ?? t('Unspecified')}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Architecture')}</DescriptionListTerm>
            <DescriptionListDescription>{architecture || '—'}</DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};

export default DiskImageReviewStep;
