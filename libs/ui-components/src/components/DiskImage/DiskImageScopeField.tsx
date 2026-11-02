import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
} from '@patternfly/react-core';
import BuildingIcon from '@patternfly/react-icons/dist/esm/icons/building-icon';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import { useField } from 'formik';

import type { DiskImageScope } from './values';
import { useTranslation } from '../../hooks/useTranslation';

import './DiskImageScopeField.css';

const DiskImageScopeField = () => {
  const { t } = useTranslation();
  const [field, , helpers] = useField<DiskImageScope>('scope');
  const options: { value: DiskImageScope; title: string; description: string }[] = [
    {
      value: 'global',
      title: t('Global'),
      description: t('Available to all tenants on the platform'),
    },
    {
      value: 'tenant',
      title: t('Tenant scoped'),
      description: t('Assigned to one tenant'),
    },
  ];

  return (
    <div role="radiogroup" aria-label={t('Scope')}>
      <Gallery hasGutter minWidths={{ default: '260px' }}>
        {options.map((option) => (
          <GalleryItem key={option.value}>
            <Card
              className={`disk-image-scope-card${field.value === option.value ? ' disk-image-scope-card--selected' : ''}`}
              isSelectable
              isSelected={field.value === option.value}
              role="radio"
              aria-checked={field.value === option.value}
              tabIndex={0}
              onClick={() => void helpers.setValue(option.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  void helpers.setValue(option.value);
                }
              }}
            >
              <CardTitle>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    {option.value === 'global' ? (
                      <GlobeIcon aria-hidden />
                    ) : (
                      <BuildingIcon aria-hidden />
                    )}
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>{option.title}</FlexItem>
                      {field.value === option.value ? (
                        <FlexItem>
                          <Label color="blue">{t('Selected')}</Label>
                        </FlexItem>
                      ) : null}
                    </Flex>
                  </FlexItem>
                </Flex>
              </CardTitle>
              <CardBody>{option.description}</CardBody>
            </Card>
          </GalleryItem>
        ))}
      </Gallery>
    </div>
  );
};

export default DiskImageScopeField;
