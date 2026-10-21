import { useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import {
  type ComputeInstanceCatalogItem,
  type DiskImage,
  DiskImages,
  GuestOSFamily,
} from '@osac/types';
import { buildDiskImageListFilter, useDiskImages } from '@osac/ui-components/api/v1/disk-image';
import { ResourceSelectField } from '@osac/ui-components/components/Form/ResourceSelectField';
import { GuestOsIcon, type OsType } from '@osac/ui-components/components/shared/GuestOsIcon';

import type { ComputeInstanceWizardValues } from './fields';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { emptyResourceSelectValue } from '../../../../Form/resourceSelectValue';

import './DiskImageSelectionField.css';

interface DiskImageSelectionFieldProps {
  catalogItem: ComputeInstanceCatalogItem | null;
}

interface GuestOsOption {
  family: GuestOSFamily;
  description: string;
  icon?: OsType;
  label: string;
}

const guestOsOptions = (t: ReturnType<typeof useTranslation>['t']): GuestOsOption[] => [
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

const diskImageReferenceMatches = (image: DiskImage, id: string, name: string): boolean =>
  Boolean(
    (id && image.id === id) ||
    (name && image.metadata?.name === name) ||
    (name && image.metadata?.displayName === name),
  );

const DiskImageSelectionField = ({ catalogItem }: DiskImageSelectionFieldProps) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const [selectedFamily, setSelectedFamily] = useState(GuestOSFamily.GUEST_OS_FAMILY_LINUX);
  const { data: diskImages = [] } = useDiskImages();
  const policy = catalogItem?.fields?.diskImage;
  const isConfigured = policy?.behavior.case === 'locked' || policy?.behavior.case === 'editable';
  const options = guestOsOptions(t);
  const selectedImage = diskImages.find((image) =>
    diskImageReferenceMatches(
      image,
      values.spec.diskImage?.id ?? '',
      values.spec.diskImage?.name ?? '',
    ),
  );

  useEffect(() => {
    const family = selectedImage?.spec?.guestOsFamily;
    if (family !== undefined) {
      setSelectedFamily(family);
    }
  }, [selectedImage?.id, selectedImage?.spec?.guestOsFamily]);

  const request = useMemo(
    () => ({ filter: buildDiskImageListFilter({ guestOsFamily: selectedFamily }) }),
    [selectedFamily],
  );
  const {
    data: filteredDiskImages = [],
    isLoading: isFilteredDiskImagesLoading,
    isFetching: isFilteredDiskImagesFetching,
  } = useDiskImages(request);
  const isDiskImageSelectionDisabled =
    isFilteredDiskImagesLoading ||
    isFilteredDiskImagesFetching ||
    (!isFilteredDiskImagesLoading && filteredDiskImages.length === 0);

  const handleFamilyChange = (family: GuestOSFamily) => {
    setSelectedFamily(family);
    void setFieldValue('spec.diskImage', emptyResourceSelectValue());
  };

  const handleFamilyKeyDown = (event: KeyboardEvent<HTMLElement>, family: GuestOSFamily) => {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleFamilyChange(family);
  };

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="2xl">
          {t('Disk image')}
        </Title>
      </StackItem>
      <StackItem>
        <Content component="p">
          {t('Choose the guest operating system and disk image for this virtual machine.')}
        </Content>
      </StackItem>
      <StackItem>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="lg">
              {t('Select guest operating system')}
            </Title>
          </StackItem>
          <StackItem>
            <Gallery hasGutter minWidths={{ default: '220px' }}>
              {options.map((option) => {
                const isSelected = selectedFamily === option.family;

                return (
                  <GalleryItem key={option.family}>
                    <Card
                      isFullHeight
                      variant="default"
                      className={`catalog-provision__disk-image-card${
                        isSelected ? ' catalog-provision__disk-image-card--selected' : ''
                      }`}
                      isSelected={isSelected}
                      onClick={() => handleFamilyChange(option.family)}
                      onKeyDown={(event) => handleFamilyKeyDown(event, option.family)}
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={option.label}
                      tabIndex={0}
                    >
                      <CardHeader>
                        <Flex
                          justifyContent={{ default: 'justifyContentSpaceBetween' }}
                          alignItems={{ default: 'alignItemsCenter' }}
                        >
                          <FlexItem>
                            {option.icon ? <GuestOsIcon os={option.icon} size="md" /> : null}
                          </FlexItem>
                          {isSelected ? (
                            <FlexItem>
                              <Label isCompact variant="outline">
                                {t('Selected')}
                              </Label>
                            </FlexItem>
                          ) : null}
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Stack hasGutter className="catalog-provision__disk-image-card-content">
                          <StackItem>
                            <Title headingLevel="h4" size="lg">
                              {option.label}
                            </Title>
                          </StackItem>
                          <StackItem>
                            <Content component="p">{option.description}</Content>
                          </StackItem>
                        </Stack>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                );
              })}
            </Gallery>
          </StackItem>
        </Stack>
      </StackItem>
      <StackItem>
        <ResourceSelectField
          key={selectedFamily}
          name="spec.diskImage"
          label={t('Select the image reference')}
          fieldId="vm-disk-image"
          service={DiskImages}
          request={request}
          isRequired={isConfigured}
          isDisabled={isDiskImageSelectionDisabled}
          placeholder={t('Select a disk image')}
          loadErrorTitle={t('Could not load disk images')}
          emptyTitle={t('No disk images available')}
          emptyDescription={t('Contact your administrator to have a disk image provisioned.')}
        />
      </StackItem>
    </Stack>
  );
};

export default DiskImageSelectionField;
