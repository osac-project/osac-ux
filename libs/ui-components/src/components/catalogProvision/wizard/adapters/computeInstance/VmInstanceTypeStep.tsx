import { type Ref, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Content,
  Divider,
  Flex,
  FlexItem,
  FormGroup,
  Label,
  MenuToggle,
  type MenuToggleElement,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import { useField, useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem, InstanceType } from '@osac/types';

import DiskImageSelectionField from './DiskImageSelectionField';
import type { ComputeInstanceWizardValues } from './fields';
import {
  INSTANCE_TYPE_ACTIVE_LIST_FILTER,
  useInstanceTypes,
} from '../../../../../api/v1/instance-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { getVisibleFieldError } from '../../../../Form/fieldError';
import { useShowFieldValidationErrors } from '../../../../Form/FieldValidationContext';
import { FormFieldHelper, getFormFieldHelperDescribedBy } from '../../../../Form/FormFieldHelper';
import OsacForm from '../../../../Form/OsacForm';
import { formatInstanceTypeDisplayName, formatInstanceTypeSizing } from '../../../../vm/utils';
import { getCatalogFieldOverlay, readCatalogFieldDefinitions } from '../../catalogOverlay';

import './VmInstanceTypeStep.css';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

const isGpuInstanceType = (instanceType: InstanceType): boolean => Boolean(instanceType.spec?.gpu);

const INSTANCE_TYPE_FIELD_NAME = 'spec.instanceType';
const INSTANCE_TYPE_FIELD_ID = 'vm-instance-type';

const instanceTypeSizingLabel = (instanceType: InstanceType): string => {
  const sizing = formatInstanceTypeSizing(instanceType);
  return sizing === '—' ? sizing : `${sizing} Memory`;
};

export const VmInstanceTypeStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const [field, meta, helpers] = useField<string>(INSTANCE_TYPE_FIELD_NAME);
  const showValidationErrors = useShowFieldValidationErrors();
  const [showGpuTypes, setShowGpuTypes] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const {
    data: instanceTypes = [],
    isPending: instanceTypesLoading,
    isError: instanceTypesError,
    refetch: refetchInstanceTypes,
  } = useInstanceTypes({ filter: INSTANCE_TYPE_ACTIVE_LIST_FILTER });

  const instanceTypePolicy = catalogItem?.fields?.instanceType;
  const instanceTypeOverlay = useMemo(
    () =>
      getCatalogFieldOverlay(
        'spec.instance_type',
        readCatalogFieldDefinitions(catalogItem),
        t('Instance type'),
      ),
    [catalogItem, t],
  );
  const isEditable = instanceTypePolicy?.behavior.case === 'editable';

  const filteredInstanceTypes = useMemo(
    () => instanceTypes.filter((instanceType) => isGpuInstanceType(instanceType) === showGpuTypes),
    [instanceTypes, showGpuTypes],
  );

  useEffect(() => {
    if (instanceTypesLoading || instanceTypesError) {
      return;
    }
    if (
      values.spec.instanceType &&
      !filteredInstanceTypes.some((instanceType) => instanceType.id === values.spec.instanceType)
    ) {
      void setFieldValue('spec.instanceType', '', false);
    }
  }, [
    filteredInstanceTypes,
    instanceTypesError,
    instanceTypesLoading,
    setFieldValue,
    values.spec.instanceType,
  ]);

  const instanceTypeOptions = useMemo(
    () =>
      filteredInstanceTypes.filter((instanceType) => {
        const searchValue = search.trim().toLowerCase();
        if (!searchValue) {
          return true;
        }
        return [
          formatInstanceTypeDisplayName(
            instanceType,
            t('catalogProvision.instanceTypes.deprecatedSuffix'),
          ),
          instanceTypeSizingLabel(instanceType),
        ].some((value) => value.toLowerCase().includes(searchValue));
      }),
    [filteredInstanceTypes, search, t],
  );

  useEffect(() => {
    if (
      !isEditable ||
      instanceTypesLoading ||
      instanceTypesError ||
      field.value ||
      filteredInstanceTypes.length !== 1
    ) {
      return;
    }
    void helpers.setValue(filteredInstanceTypes[0].id, false);
  }, [
    field.value,
    filteredInstanceTypes,
    helpers,
    instanceTypesError,
    instanceTypesLoading,
    isEditable,
  ]);

  const selectedInstanceType = instanceTypes.find(
    (instanceType) => instanceType.id === field.value,
  );
  const error = getVisibleFieldError(meta, showValidationErrors);
  const helperDescribedBy = getFormFieldHelperDescribedBy(INSTANCE_TYPE_FIELD_ID, error);
  const controlDisabled = !isEditable || instanceTypesLoading;

  const toggle = (ref: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={ref}
      id={INSTANCE_TYPE_FIELD_ID}
      className="catalog-provision__instance-type-toggle"
      isExpanded={isOpen}
      isDisabled={controlDisabled || Boolean(instanceTypesError)}
      isFullWidth
      onClick={() => setIsOpen((open) => !open)}
      aria-invalid={error ? true : undefined}
      aria-describedby={helperDescribedBy}
      aria-busy={instanceTypesLoading || undefined}
    >
      <Stack className="catalog-provision__instance-type-toggle-content">
        <StackItem className="catalog-provision__instance-type-name">
          {selectedInstanceType
            ? formatInstanceTypeDisplayName(
                selectedInstanceType,
                t('catalogProvision.instanceTypes.deprecatedSuffix'),
              )
            : t('catalogProvision.vm.placeholders.selectInstanceType')}
        </StackItem>
        {selectedInstanceType ? (
          <StackItem className="catalog-provision__instance-type-sizing">
            {instanceTypeSizingLabel(selectedInstanceType)}
          </StackItem>
        ) : null}
      </Stack>
    </MenuToggle>
  );

  return (
    <OsacForm className="catalog-provision__vm-instance-type-form pf-m-limit-width">
      <Stack hasGutter>
        <StackItem>
          <Title headingLevel="h2">{t('Compute configuration')}</Title>
        </StackItem>
        <StackItem>
          <Content component="p">
            {t(
              'Choose a disk image and instance type for your virtual machine. Use the GPU checkbox to switch between instance types with and without a GPU.',
            )}
          </Content>
        </StackItem>
        <StackItem>
          <DiskImageSelectionField catalogItem={catalogItem} />
        </StackItem>
        <StackItem>
          <Checkbox
            id="vm-show-gpu-instance-types"
            label={t('Show instance types with GPU')}
            isChecked={showGpuTypes}
            isDisabled={!isEditable || instanceTypesLoading}
            onChange={(_event, checked) => setShowGpuTypes(checked)}
          />
        </StackItem>
        <StackItem>
          <FormGroup
            label={
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>{instanceTypeOverlay.label}</FlexItem>
                {!isEditable ? (
                  <FlexItem>
                    <Label color="grey" icon={<LockIcon aria-hidden />}>
                      {t('Locked')}
                    </Label>
                  </FlexItem>
                ) : null}
              </Flex>
            }
            fieldId={INSTANCE_TYPE_FIELD_ID}
            isRequired
            validated={error ? 'error' : 'default'}
          >
            <Select
              id={`${INSTANCE_TYPE_FIELD_ID}-select`}
              isOpen={isOpen}
              selected={field.value}
              onOpenChange={setIsOpen}
              onSelect={(_event, value) => {
                if (typeof value !== 'string') {
                  return;
                }
                void helpers.setValue(value, true);
                void helpers.setTouched(true, false);
                setIsOpen(false);
                setSearch('');
              }}
              toggle={toggle}
              shouldFocusToggleOnSelect
              aria-label={instanceTypeOverlay.label}
            >
              <div className="catalog-provision__instance-type-menu">
                <SearchInput
                  placeholder={t('Search instance types')}
                  value={search}
                  onChange={(_event, value) => setSearch(value)}
                  onClear={() => setSearch('')}
                  aria-label={t('Search instance types')}
                />
                <Divider />
                <SelectList>
                  {instanceTypeOptions.map((instanceType) => (
                    <SelectOption
                      key={instanceType.id}
                      value={instanceType.id}
                      description={instanceTypeSizingLabel(instanceType)}
                    >
                      {formatInstanceTypeDisplayName(
                        instanceType,
                        t('catalogProvision.instanceTypes.deprecatedSuffix'),
                      )}
                    </SelectOption>
                  ))}
                </SelectList>
              </div>
            </Select>
            <FormFieldHelper error={error} fieldId={INSTANCE_TYPE_FIELD_ID} />
          </FormGroup>
          {instanceTypesError ? (
            <Alert variant="danger" isInline title={t('catalogProvision.instanceTypes.loadError')}>
              <Button variant="link" isInline onClick={() => void refetchInstanceTypes()}>
                {t('catalogProvision.actions.retry')}
              </Button>
            </Alert>
          ) : null}
        </StackItem>
      </Stack>
    </OsacForm>
  );
};
