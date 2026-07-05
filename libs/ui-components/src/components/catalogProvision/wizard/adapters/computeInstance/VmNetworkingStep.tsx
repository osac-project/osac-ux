import { useEffect, useMemo, useRef } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import TrashIcon from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues, NetworkAttachmentValue } from './fields';
import { usePublicIPPools } from '../../../../../api/v1/ip-management';
import {
  resourceDisplayName,
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
  virtualNetworkFilterForSubnetList,
} from '../../../../../api/v1/networking';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { MultiSelectField } from '../../../../Form/MultiSelectField';
import OsacForm from '../../../../Form/OsacForm';
import { SelectField } from '../../../../Form/SelectField';

interface NetworkAttachmentFormSectionProps {
  fieldPrefix: string;
  virtualNetworkId: string;
  currentSubnetId?: string;
  currentSecurityGroupIds?: string[];
  label?: string;
}

const NetworkAttachmentFormSection = ({
  fieldPrefix,
  virtualNetworkId,
  currentSubnetId = '',
  currentSecurityGroupIds = [],
  label,
}: NetworkAttachmentFormSectionProps) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();

  const { data: virtualNetworks = [], isPending: virtualNetworksLoading } = useVirtualNetworks();

  const subnetFilter = virtualNetworkId
    ? virtualNetworkFilterForSubnetList(virtualNetworkId)
    : undefined;

  const { data: subnets = [], isPending: subnetsLoading } = useSubnets(
    subnetFilter ? { filter: subnetFilter } : {},
    {
      enabled: Boolean(virtualNetworkId),
    },
  );

  const { data: securityGroups = [], isPending: securityGroupsLoading } = useSecurityGroups(
    subnetFilter ? { filter: subnetFilter } : {},
    {
      enabled: Boolean(virtualNetworkId),
    },
  );

  const virtualNetworkOptions = useMemo(
    () =>
      virtualNetworks.map((vn) => ({
        value: vn.id,
        label: resourceDisplayName(vn.metadata, vn.id),
      })),
    [virtualNetworks],
  );

  const subnetOptions = useMemo(
    () => subnets.map((s) => ({ value: s.id, label: resourceDisplayName(s.metadata, s.id) })),
    [subnets],
  );

  const securityGroupOptions = useMemo(
    () =>
      securityGroups.map((g) => ({ value: g.id, label: resourceDisplayName(g.metadata, g.id) })),
    [securityGroups],
  );

  const previousVirtualNetworkIdRef = useRef(virtualNetworkId);
  const loadingPlaceholder = t('catalogProvision.common.loading');
  const subnetListLoading = Boolean(virtualNetworkId) && subnetsLoading;
  const securityGroupListLoading = Boolean(virtualNetworkId) && securityGroupsLoading;

  // Auto-select single VNet/subnet/SG
  useEffect(() => {
    if (virtualNetworkOptions.length === 1 && !virtualNetworkId) {
      void setFieldValue(`${fieldPrefix}.virtualNetworkId`, virtualNetworkOptions[0].value);
    }
  }, [setFieldValue, virtualNetworkId, virtualNetworkOptions, fieldPrefix]);

  useEffect(() => {
    if (virtualNetworkId && subnetOptions.length === 1 && !currentSubnetId) {
      void setFieldValue(`${fieldPrefix}.subnetId`, subnetOptions[0].value);
    }
  }, [setFieldValue, subnetOptions, virtualNetworkId, fieldPrefix, currentSubnetId]);

  useEffect(() => {
    if (
      virtualNetworkId &&
      securityGroupOptions.length === 1 &&
      currentSecurityGroupIds.length === 0
    ) {
      void setFieldValue(`${fieldPrefix}.securityGroupIds`, [securityGroupOptions[0].value]);
    }
  }, [
    setFieldValue,
    securityGroupOptions,
    virtualNetworkId,
    fieldPrefix,
    currentSecurityGroupIds.length,
  ]);

  useEffect(() => {
    if (!virtualNetworkId) {
      return;
    }
    const prevId = previousVirtualNetworkIdRef.current;
    previousVirtualNetworkIdRef.current = virtualNetworkId;
    if (prevId && prevId !== virtualNetworkId) {
      void setFieldValue(`${fieldPrefix}.subnetId`, '');
      void setFieldValue(`${fieldPrefix}.securityGroupIds`, []);
    }
  }, [setFieldValue, virtualNetworkId, fieldPrefix]);

  return (
    <>
      {label && (
        <Title headingLevel="h4" size="sm" style={{ marginBottom: '0.5rem' }}>
          {label}
        </Title>
      )}
      <SelectField
        name={`${fieldPrefix}.virtualNetworkId`}
        label={t('catalogProvision.vm.fields.virtualNetwork')}
        fieldId={`${fieldPrefix}-virtual-network`}
        isRequired
        isLoading={virtualNetworksLoading}
        isDisabled={virtualNetworksLoading}
        loadingPlaceholder={loadingPlaceholder}
        placeholder={t('catalogProvision.vm.placeholders.selectVirtualNetwork')}
        options={virtualNetworkOptions}
      />
      {(() => {
        const selectedVnet = virtualNetworkId
          ? virtualNetworks.find((vn) => vn.id === virtualNetworkId)
          : undefined;
        const region = selectedVnet?.metadata?.labels?.['region'];
        if (!region) {
          return null;
        }
        return (
          <FormGroup fieldId={`${fieldPrefix}-region-hint`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Label variant="outline" color="blue" isCompact>
                predicted
              </Label>
              <span>
                Region: <strong>{region}</strong>
              </span>
            </div>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  Region is derived from the selected virtual network. Direct region selection is
                  planned (OSAC-1064).
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        );
      })()}
      <SelectField
        name={`${fieldPrefix}.subnetId`}
        label={t('catalogProvision.vm.fields.subnet')}
        fieldId={`${fieldPrefix}-subnet`}
        isRequired
        isLoading={subnetListLoading}
        isDisabled={!virtualNetworkId || subnetListLoading}
        loadingPlaceholder={loadingPlaceholder}
        placeholder={t('catalogProvision.vm.placeholders.selectSubnet')}
        options={subnetOptions}
      />
      <MultiSelectField
        name={`${fieldPrefix}.securityGroupIds`}
        label={t('catalogProvision.vm.fields.securityGroup')}
        fieldId={`${fieldPrefix}-security-group`}
        isRequired
        isLoading={securityGroupListLoading}
        isDisabled={!virtualNetworkId || securityGroupListLoading}
        loadingPlaceholder={loadingPlaceholder}
        placeholder={t('catalogProvision.vm.placeholders.selectSecurityGroup')}
        options={securityGroupOptions}
      />
    </>
  );
};

const EMPTY_ATTACHMENT: NetworkAttachmentValue = {
  virtualNetworkId: '',
  subnetId: '',
  securityGroupIds: [],
};

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

export const VmNetworkingStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const virtualNetworkId = values.spec.networking.virtualNetworkId;

  const { isError: virtualNetworksError, refetch: refetchVirtualNetworks } = useVirtualNetworks();
  const { isError: subnetsError, refetch: refetchSubnets } = useSubnets({}, { enabled: false });
  const { isError: securityGroupsError, refetch: refetchSecurityGroups } = useSecurityGroups(
    {},
    { enabled: false },
  );

  const { data: publicIPPools = [] } = usePublicIPPools();

  const additionalAttachments = values.spec.additionalNetworkAttachments;

  const addAttachment = () => {
    void setFieldValue('spec.additionalNetworkAttachments', [
      ...additionalAttachments,
      { ...EMPTY_ATTACHMENT },
    ]);
  };

  const removeAttachment = (index: number) => {
    void setFieldValue(
      'spec.additionalNetworkAttachments',
      additionalAttachments.filter((_, i) => i !== index),
    );
  };

  if (!catalogItem) {
    return null;
  }

  const listError = virtualNetworksError || subnetsError || securityGroupsError;

  return (
    <Stack hasGutter>
      {listError && (
        <StackItem>
          <Alert variant="danger" isInline title={t('catalogProvision.networking.loadError')}>
            <Button
              variant="link"
              isInline
              onClick={() => {
                void refetchVirtualNetworks();
                void refetchSubnets();
                void refetchSecurityGroups();
              }}
            >
              {t('catalogProvision.actions.retry')}
            </Button>
          </Alert>
        </StackItem>
      )}

      <StackItem>
        <OsacForm>
          <NetworkAttachmentFormSection
            fieldPrefix="spec.networking"
            virtualNetworkId={virtualNetworkId}
            currentSubnetId={values.spec.networking.subnetId}
            currentSecurityGroupIds={values.spec.networking.securityGroupIds}
            label={additionalAttachments.length > 0 ? 'Primary network interface' : undefined}
          />
          {publicIPPools.length > 0 && (
            <FormGroup fieldId="vm-public-ip">
              <Checkbox
                id="vm-public-ip"
                label="Assign a public IP to this VM"
                description={`Available from pool: "${publicIPPools[0].metadata?.name ?? publicIPPools[0].id}" (${String(publicIPPools[0].status?.available ?? '—')} available)`}
                isChecked={Boolean(values.spec.networking.publicIPPoolId)}
                onChange={(_e, checked) =>
                  void setFieldValue(
                    'spec.networking.publicIPPoolId',
                    checked ? publicIPPools[0].id : undefined,
                  )
                }
              />
            </FormGroup>
          )}
        </OsacForm>
      </StackItem>

      {additionalAttachments.map((attachment, index) => (
        <StackItem key={index}>
          <Divider />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1rem',
              marginBottom: '0.5rem',
            }}
          >
            <Title headingLevel="h4" size="sm">
              {`Additional network interface ${index + 1}`}
            </Title>
            <Button
              variant="plain"
              aria-label={`Remove network interface ${index + 1}`}
              onClick={() => removeAttachment(index)}
            >
              <TrashIcon />
            </Button>
          </div>
          <OsacForm>
            <NetworkAttachmentFormSection
              fieldPrefix={`spec.additionalNetworkAttachments.${index}`}
              virtualNetworkId={attachment.virtualNetworkId}
              currentSubnetId={attachment.subnetId}
              currentSecurityGroupIds={attachment.securityGroupIds}
            />
          </OsacForm>
        </StackItem>
      ))}

      <StackItem>
        <Button variant="link" onClick={addAttachment}>
          + Add network interface
        </Button>
      </StackItem>
    </Stack>
  );
};
