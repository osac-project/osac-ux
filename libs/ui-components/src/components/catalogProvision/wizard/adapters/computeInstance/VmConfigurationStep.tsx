import { useEffect, useMemo } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Checkbox,
  Content,
  FormGroup,
  FormHelperText,
  Gallery,
  HelperText,
  HelperTextItem,
  Label,
  Spinner,
  Stack,
  StackItem,
  TextInput,
  Title,
} from '@patternfly/react-core';
import LockIcon from '@patternfly/react-icons/dist/esm/icons/lock-icon';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { RUN_STRATEGY_OPTIONS } from './fields';
import {
  formatInstanceTypeSizing,
  instanceTypeName,
  isDeprecatedInstanceType,
  useInstanceTypes,
} from '../../../../../api/v1/instance-types';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';
import { SelectField } from '../../../../Form/SelectField';
import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import { CATALOG_PROVISION_MULTILINE_TEXTAREA } from '../../constants';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

const RUN_STRATEGY_SELECT_OPTIONS = RUN_STRATEGY_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

/** Extract just the image name from an OCI URL for display, e.g. "rhel:9.4" */
const shortImageName = (sourceRef: string): string => {
  try {
    const parts = sourceRef.split('/');
    return parts[parts.length - 1] ?? sourceRef;
  } catch {
    return sourceRef;
  }
};

export const VmConfigurationStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values, setFieldValue, errors, touched } =
    useFormikContext<ComputeInstanceWizardValues>();
  const instanceTypeId = values.spec.instanceType;

  const {
    data: instanceTypes = [],
    isPending: instanceTypesLoading,
    isError: instanceTypesError,
    refetch: refetchInstanceTypes,
  } = useInstanceTypes();

  useEffect(() => {
    if (instanceTypes.length === 1 && !instanceTypeId) {
      void setFieldValue('spec.instanceType', instanceTypes[0].id);
    }
  }, [instanceTypeId, instanceTypes, setFieldValue]);

  const definitions = useMemo(() => readCatalogFieldDefinitions(catalogItem), [catalogItem]);

  const overlays = useMemo(
    () => ({
      image: getCatalogFieldOverlay(
        'spec.image.source_ref',
        definitions,
        t('catalogProvision.vm.fields.image'),
      ),
      userData: getCatalogFieldOverlay(
        'spec.user_data',
        definitions,
        t('catalogProvision.vm.fields.userData'),
      ),
      bootDisk: getCatalogFieldOverlay(
        'spec.boot_disk.size_gib',
        definitions,
        t('catalogProvision.vm.fields.bootDisk'),
      ),
      userDataRequired: hasCatalogFieldDefinition('spec.user_data', definitions),
    }),
    [definitions, t],
  );

  if (!catalogItem) {
    return null;
  }

  const addDisk = () => {
    void setFieldValue('spec.additionalDisks', [...values.spec.additionalDisks, { sizeGib: '' }]);
  };

  const removeDisk = (idx: number) => {
    void setFieldValue(
      'spec.additionalDisks',
      values.spec.additionalDisks.filter((_, i) => i !== idx),
    );
  };

  const diskErrors = (errors.spec as Record<string, unknown> | undefined)?.additionalDisks as
    | Array<{ sizeGib?: string } | undefined>
    | undefined;
  const diskTouched = (touched.spec as Record<string, unknown> | undefined)?.additionalDisks as
    | Array<{ sizeGib?: boolean } | undefined>
    | undefined;

  return (
    <Stack hasGutter>
      {instanceTypesError ? (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.instanceTypes.loadError')}>
            <Button variant="link" isInline onClick={() => void refetchInstanceTypes()}>
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      ) : null}

      <StackItem>
        <OsacForm>
          {/* Image — hidden when locked by catalog, shown as read-only badge */}
          {overlays.image.editable ? (
            <InputField
              name="spec.image.sourceRef"
              label={overlays.image.label}
              fieldId="vm-image-source-ref"
              isRequired
              helperText={t('catalogProvision.vm.fields.imageDescription')}
            />
          ) : (
            <FormGroup label={overlays.image.label} fieldId="vm-image-locked">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <LockIcon aria-hidden />
                <Label color="blue" isCompact>
                  {shortImageName(
                    values.spec.image.sourceRef || String(overlays.image.defaultValue ?? ''),
                  )}
                </Label>
                <Content
                  component="small"
                  style={{ color: 'var(--pf-t--global--color--nonstatus--gray--default)' }}
                >
                  Defined by the catalog offering
                </Content>
              </div>
            </FormGroup>
          )}
        </OsacForm>
      </StackItem>

      {/* Instance type card grid */}
      <StackItem>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h3" size="md">
              {t('catalogProvision.vm.fields.instanceType')}
              <span
                style={{
                  color: 'var(--pf-t--global--color--status--danger--default)',
                  marginLeft: '0.25rem',
                }}
              >
                *
              </span>
            </Title>
          </StackItem>
          {instanceTypesLoading ? (
            <StackItem>
              <Spinner size="md" />
            </StackItem>
          ) : (
            <StackItem>
              <Gallery hasGutter minWidths={{ default: '200px' }}>
                {instanceTypes.map((it) => {
                  const isSelected = instanceTypeId === it.id;
                  const isDeprecated = isDeprecatedInstanceType(it);
                  const pricePerHour = it.metadata?.labels?.['price_per_hour'];
                  const storageGib = (it.spec as Record<string, unknown> | undefined)?.storageGib;

                  return (
                    <Card key={it.id} isSelectable isSelected={isSelected}>
                      <CardHeader
                        selectableActions={{
                          selectableActionId: `instance-type-${it.id}`,
                          selectableActionAriaLabelledby: `instance-type-label-${it.id}`,
                          name: 'spec.instanceType',
                          variant: 'single',
                          onChange: () => void setFieldValue('spec.instanceType', it.id),
                          isChecked: isSelected,
                        }}
                      >
                        <CardTitle id={`instance-type-label-${it.id}`}>
                          <span style={{ fontWeight: 600 }}>{instanceTypeName(it)}</span>
                          {isDeprecated && (
                            <Badge
                              isRead
                              style={{
                                marginLeft: '0.4rem',
                                backgroundColor:
                                  'var(--pf-t--global--color--status--warning--default)',
                              }}
                            >
                              deprecated
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <Stack>
                          <StackItem>
                            <Content component="p" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
                              {formatInstanceTypeSizing(it)}
                            </Content>
                          </StackItem>
                          {storageGib != null && (
                            <StackItem>
                              <Content
                                component="small"
                                style={{
                                  color: 'var(--pf-t--global--color--nonstatus--gray--default)',
                                }}
                              >
                                {String(storageGib)} GiB storage
                              </Content>
                            </StackItem>
                          )}
                          {pricePerHour && (
                            <StackItem>
                              <Label
                                color="green"
                                isCompact
                                variant="outline"
                                style={{ marginTop: '0.25rem' }}
                              >
                                ${pricePerHour}/hr
                              </Label>
                              <Label
                                color="grey"
                                isCompact
                                variant="outline"
                                style={{ marginLeft: '0.25rem' }}
                              >
                                predicted
                              </Label>
                            </StackItem>
                          )}
                        </Stack>
                      </CardBody>
                    </Card>
                  );
                })}
              </Gallery>
            </StackItem>
          )}
        </Stack>
      </StackItem>

      <StackItem>
        <OsacForm>
          <InputField
            name="spec.bootDisk.sizeGib"
            label={overlays.bootDisk.label}
            fieldId="vm-boot-disk-size"
            type="number"
            isRequired
            helperText={t('catalogProvision.vm.fields.bootDiskDescription')}
            isDisabled={!overlays.bootDisk.editable}
          />

          {/* Additional disks */}
          <FormGroup label="Additional disks" fieldId="vm-additional-disks">
            <Stack hasGutter>
              {values.spec.additionalDisks.map((disk, idx) => {
                const diskErr = diskErrors?.[idx]?.sizeGib;
                const isTouched = diskTouched?.[idx]?.sizeGib;
                return (
                  <StackItem key={idx}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <TextInput
                          id={`vm-additional-disk-${idx}`}
                          type="number"
                          value={disk.sizeGib}
                          onChange={(_e, v) =>
                            void setFieldValue(`spec.additionalDisks.${idx}.sizeGib`, v)
                          }
                          placeholder="Size in GiB"
                          validated={isTouched && diskErr ? 'error' : 'default'}
                          aria-label={`Additional disk ${idx + 1} size in GiB`}
                        />
                        {isTouched && diskErr && (
                          <FormHelperText>
                            <HelperText>
                              <HelperTextItem variant="error">{diskErr}</HelperTextItem>
                            </HelperText>
                          </FormHelperText>
                        )}
                      </div>
                      <Button
                        variant="plain"
                        onClick={() => removeDisk(idx)}
                        aria-label="Remove disk"
                      >
                        ✕
                      </Button>
                    </div>
                  </StackItem>
                );
              })}
              <StackItem>
                <Button variant="link" isInline onClick={addDisk}>
                  + Add disk
                </Button>
              </StackItem>
            </Stack>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  Each disk is an additional block device attached to the VM.
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <InputField
            name="spec.userData"
            label={overlays.userData.label}
            fieldId="vm-user-data"
            multiline
            rows={CATALOG_PROVISION_MULTILINE_TEXTAREA.rows}
            resizeOrientation={CATALOG_PROVISION_MULTILINE_TEXTAREA.resizeOrientation}
            isRequired={overlays.userDataRequired}
            helperText={t('catalogProvision.vm.fields.userDataDescription')}
            isDisabled={!overlays.userData.editable}
          />

          {/* Run strategy */}
          <SelectField
            name="spec.runStrategy"
            label="Run strategy"
            fieldId="vm-run-strategy"
            isRequired
            options={RUN_STRATEGY_SELECT_OPTIONS}
          />

          {/* Windows guest OS */}
          <FormGroup fieldId="vm-is-windows">
            <Checkbox
              id="vm-is-windows"
              label="Windows guest OS"
              description="Enable this if the VM will run Windows. Configures VirtIO drivers and RDP support."
              isChecked={values.spec.isWindows}
              onChange={(_e, checked) => void setFieldValue('spec.isWindows', checked)}
            />
          </FormGroup>
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
