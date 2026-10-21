import { type ReactNode, useMemo } from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  Divider,
  FormGroup,
  Stack,
  StackItem,
  Switch,
  Title,
} from '@patternfly/react-core';
import { MultiTypeaheadSelect, type MultiTypeaheadSelectOption } from '@patternfly/react-templates';
import { useField } from 'formik';

import { SecurityGroups, Subnets, VirtualNetworks } from '@osac/types';

import { CheckboxField } from './CheckboxField';
import { FormFieldHelper } from './FormFieldHelper';
import NetworkSelectionCards from './NetworkSelectionCards';
import { ResourceSelectField, type ResourceSelectValue } from './ResourceSelectField';
import { emptyResourceSelectValue } from './resourceSelectValue';
import { useListResource } from '../../api/use-resource';
import {
  VIRTUAL_NETWORK_READY_LIST_FILTER,
  securityGroupFilterForVirtualNetworkList,
  virtualNetworkFilterForSubnetList,
} from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';

import './NetworkSelectionCards.css';

interface NetworkAttachmentPickersProps {
  /** Formik field-path prefix, e.g. "spec.networkAttachment". */
  fieldPrefix: string;
  /** HTML id prefix for unique element IDs, e.g. "cluster" or "vm". */
  fieldIdPrefix: string;
  /** Formik field path for the "use default network" checkbox, e.g. "spec.useDefaultNetwork". */
  useDefaultNetworkName: string;
  /** Formik field path for the "auto external IP attachment" checkbox. */
  autoExternalIpName: string;
  /** Helper text displayed below the auto external IP checkbox. */
  autoExternalIpHelperText?: string;
  /** Uses the card-based network choice shown in the VM wizard. */
  useNetworkSelectionCards?: boolean;
  /** Hides the default-network control for additional custom attachments. */
  showDefaultNetworkToggle?: boolean;
  /** Hides the external IP control for additional custom attachments. */
  showExternalIp?: boolean;
  /** Content rendered between network fields and the external IP control. */
  children?: ReactNode;
}

interface NetworkSummaryValue {
  name: string;
  description: string;
}

const TENANT_DEFAULT_NETWORK_SUMMARY = {
  virtualNetwork: {
    name: 'tenant-workload',
    description: 'Primary tenant compute network',
  },
  subnet: {
    name: 'bm-compute-a',
    description: '10.42.0.0/24 · VLAN 200',
  },
  securityGroups: {
    name: 'allow-ssh-https',
    description: 'SSH + HTTPS ingress',
  },
} satisfies Record<string, NetworkSummaryValue>;

/**
 * Reusable VirtualNetwork → Subnet → SecurityGroups cascade pickers
 * with "use default network" and "auto external IP" checkboxes.
 *
 * Uses ResourceSelectField for VN and subnet (stores ResourceSelectValue
 * with both id and name), and MultiTypeaheadSelect for security groups
 * (stores ResourceSelectValue[]).
 *
 * When the "use default network" checkbox is checked, the VN/subnet pickers
 * are hidden (the backend picks defaults). Security groups are always optional.
 *
 * Cascade behaviour: selecting a new VN resets the subnet and SG fields
 * via the onSelectResource callback.
 */
export const NetworkAttachmentPickers = ({
  fieldPrefix,
  fieldIdPrefix,
  useDefaultNetworkName,
  autoExternalIpName,
  autoExternalIpHelperText,
  useNetworkSelectionCards = false,
  showDefaultNetworkToggle = true,
  showExternalIp = true,
  children,
}: NetworkAttachmentPickersProps) => {
  const { t } = useTranslation();

  const [defaultNetworkField, , defaultNetworkHelpers] = useField<boolean>(useDefaultNetworkName);
  const [autoExternalIpField, , autoExternalIpHelpers] = useField<boolean>(autoExternalIpName);
  const defaultNetwork = defaultNetworkField.value;

  const [vnField] = useField<ResourceSelectValue>(`${fieldPrefix}.virtualNetwork`);
  const [, , subnetHelpers] = useField<ResourceSelectValue>(`${fieldPrefix}.subnet`);
  const [sgField, , sgHelpers] = useField<ResourceSelectValue[]>(`${fieldPrefix}.securityGroups`);

  const virtualNetworkId = vnField.value?.id ?? '';

  // ── Security groups (manual hooks — no ResourceMultiSelectField exists) ──
  const securityGroupFilter = virtualNetworkId
    ? securityGroupFilterForVirtualNetworkList(virtualNetworkId)
    : undefined;
  const {
    data: securityGroupsData,
    isLoading: securityGroupsLoading,
    error: securityGroupsError,
    refetch: refetchSecurityGroups,
  } = useListResource(SecurityGroups, securityGroupFilter ? { filter: securityGroupFilter } : {}, {
    enabled: Boolean(virtualNetworkId),
  });

  const securityGroups = useMemo(() => securityGroupsData?.items ?? [], [securityGroupsData]);

  const securityGroupOptions = useMemo(
    () =>
      securityGroups.map((group) => ({
        value: group.id,
        label: group.metadata?.name ?? group.id,
      })),
    [securityGroups],
  );

  const selectedSgIds = useMemo(() => (sgField.value ?? []).map((sg) => sg.id), [sgField.value]);

  const sgMultiSelectOptions = useMemo<MultiTypeaheadSelectOption[]>(
    () =>
      securityGroupOptions.map((o) => ({
        content: o.label,
        value: o.value,
        selected: selectedSgIds.includes(String(o.value)),
      })),
    [securityGroupOptions, selectedSgIds],
  );

  const securityGroupListLoading = Boolean(virtualNetworkId) && securityGroupsLoading;

  return (
    <>
      {useNetworkSelectionCards ? (
        <>
          <NetworkSelectionCards
            selected={defaultNetwork}
            onSelect={(useDefault) => {
              void defaultNetworkHelpers.setValue(useDefault);
            }}
          />
          {defaultNetwork ? (
            <Card className="network-default-summary">
              <CardBody>
                <Stack>
                  <StackItem className="network-default-summary__row">
                    <strong>{t('Virtual network')}</strong>
                    <span className="network-default-summary__value">
                      <strong>{TENANT_DEFAULT_NETWORK_SUMMARY.virtualNetwork.name}</strong>
                      <small>{TENANT_DEFAULT_NETWORK_SUMMARY.virtualNetwork.description}</small>
                    </span>
                  </StackItem>
                  <StackItem className="network-default-summary__row">
                    <strong>{t('Subnet')}</strong>
                    <span className="network-default-summary__value">
                      <strong>{TENANT_DEFAULT_NETWORK_SUMMARY.subnet.name}</strong>
                      <small>{TENANT_DEFAULT_NETWORK_SUMMARY.subnet.description}</small>
                    </span>
                  </StackItem>
                  <StackItem className="network-default-summary__row">
                    <strong>{t('Security groups')}</strong>
                    <span className="network-default-summary__value">
                      <strong>{TENANT_DEFAULT_NETWORK_SUMMARY.securityGroups.name}</strong>
                      <small>{TENANT_DEFAULT_NETWORK_SUMMARY.securityGroups.description}</small>
                    </span>
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          ) : null}
        </>
      ) : showDefaultNetworkToggle ? (
        <CheckboxField
          name={useDefaultNetworkName}
          label={t('Use tenant default network')}
          fieldId={`${fieldIdPrefix}-use-default-network`}
        />
      ) : null}
      {!defaultNetwork && (
        <>
          <ResourceSelectField
            name={`${fieldPrefix}.virtualNetwork`}
            label={t('Virtual network')}
            fieldId={`${fieldIdPrefix}-virtual-network`}
            service={VirtualNetworks}
            request={{ filter: VIRTUAL_NETWORK_READY_LIST_FILTER }}
            autoSelectSingleOption
            placeholder={t('Select virtual network')}
            loadErrorTitle={t('Could not load virtual networks')}
            onSelectResource={() => {
              void subnetHelpers.setValue(emptyResourceSelectValue());
              void sgHelpers.setValue([]);
            }}
          />
          <ResourceSelectField
            name={`${fieldPrefix}.subnet`}
            label={t('Subnet')}
            fieldId={`${fieldIdPrefix}-subnet`}
            service={Subnets}
            isRequired
            request={
              virtualNetworkId
                ? { filter: virtualNetworkFilterForSubnetList(virtualNetworkId) }
                : {}
            }
            isDisabled={!virtualNetworkId}
            autoSelectSingleOption
            placeholder={t('Select subnet')}
            isSearchable
            searchPlaceholder={t('Search subnets')}
            loadErrorTitle={t('Could not load subnets')}
          />

          {securityGroupsError ? (
            <Alert variant="danger" isInline title={t('Could not load security groups')}>
              <Button
                variant="link"
                isInline
                onClick={() => {
                  void refetchSecurityGroups();
                }}
              >
                {t('Retry')}
              </Button>
            </Alert>
          ) : null}
          <FormGroup label={t('Security groups')} fieldId={`${fieldIdPrefix}-security-groups`}>
            <MultiTypeaheadSelect
              id={`${fieldIdPrefix}-security-groups`}
              initialOptions={sgMultiSelectOptions}
              placeholder={securityGroupListLoading ? t('Loading...') : t('Select security groups')}
              isDisabled={!virtualNetworkId || securityGroupListLoading}
              noOptionsFoundMessage={(filter) => `No options found for "${filter}"`}
              onSelectionChange={(_event, selections) => {
                const newValues: ResourceSelectValue[] = (selections as string[]).map((id) => {
                  const option = securityGroupOptions.find((o) => o.value === id);
                  return { id, name: option?.label ?? id };
                });
                void sgHelpers.setValue(newValues, true);
                void sgHelpers.setTouched(true);
              }}
              toggleProps={{
                id: `${fieldIdPrefix}-security-groups`,
                'aria-label': t('Security groups'),
                isFullWidth: true,
                'aria-busy': securityGroupListLoading || undefined,
              }}
            />
          </FormGroup>
        </>
      )}
      {useNetworkSelectionCards ? (
        <>
          <Divider />
          <Stack hasGutter className="network-external-ip">
            <StackItem>
              <Title headingLevel="h3" size="lg">
                {t('External IP')}
              </Title>
            </StackItem>
            <StackItem>
              <FormGroup fieldId={`${fieldIdPrefix}-auto-external-ip`}>
                <Switch
                  id={`${fieldIdPrefix}-auto-external-ip`}
                  label={t('Auto-attach external IP')}
                  isChecked={autoExternalIpField.value}
                  onChange={(_event, checked) => {
                    void autoExternalIpHelpers.setValue(checked);
                  }}
                  onBlur={autoExternalIpField.onBlur}
                />
                <FormFieldHelper
                  description={autoExternalIpHelperText}
                  fieldId={`${fieldIdPrefix}-auto-external-ip`}
                />
              </FormGroup>
            </StackItem>
          </Stack>
        </>
      ) : showExternalIp ? (
        <CheckboxField
          name={autoExternalIpName}
          label={t('Auto External IP Attachment')}
          fieldId={`${fieldIdPrefix}-auto-external-ip`}
          helperText={autoExternalIpHelperText}
        />
      ) : null}
      {children}
    </>
  );
};
