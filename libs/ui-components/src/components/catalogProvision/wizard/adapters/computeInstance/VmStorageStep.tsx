import { useMemo } from 'react';
import { Content, Label, Stack, StackItem, Title } from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { AdditionalDisksArrayField } from './AdditionalDisksArrayField';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { StorageTierSelectField } from '../../../../Form/StorageTierSelectField';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

import './VmStorageStep.css';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmStorageStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);

  const bootDiskOverlay = useMemo(
    () => getCatalogFieldOverlay('spec.boot_disk.size_gib', definitions, t('Boot disk')),
    [definitions, t],
  );
  const storageTierOverlay = useMemo(
    () =>
      getCatalogFieldOverlay('spec.boot_disk.storage_tier', definitions, t('Boot storage tier')),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  return (
    <OsacForm className="catalog-provision__vm-storage-form pf-m-limit-width">
      <Stack hasGutter className="catalog-provision__vm-storage-intro">
        <StackItem>
          <Title headingLevel="h2">{t('Storage')}</Title>
        </StackItem>
        <StackItem>
          <Content component="p">
            {t(
              'Set the boot disk size and storage tier. Add additional disks if you need more storage.',
            )}
          </Content>
        </StackItem>
      </Stack>
      <InputField
        name="spec.bootDisk.sizeGib"
        label={t('Boot disk size (GiB)')}
        fieldId="vm-boot-disk-size"
        type="number"
        useNumberInputControls={false}
        isRequired
        helperText={t('Starting default from the template.')}
        isDisabled={!bootDiskOverlay.editable}
        labelInfo={
          bootDiskOverlay.editable ? undefined : (
            <Label color="grey" icon={<LockIcon aria-hidden />}>
              {t('Size locked')}
            </Label>
          )
        }
      />
      <StorageTierSelectField
        name="spec.bootDisk.storageTier"
        label={storageTierOverlay.label}
        fieldId="vm-boot-disk-storage-tier"
        helperText={t('Storage tiers are defined by your cloud provider administrator.')}
        isLocked={!storageTierOverlay.editable}
      />
      <AdditionalDisksArrayField />
    </OsacForm>
  );
};
