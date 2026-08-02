/**
 * Shared "Billing" tab content for Provider Template form pages (VM / Cluster / BM).
 *
 * Declares BillableComponent meters for a template — the base rate a CatalogItem
 * built from this template inherits before any price-plan override is applied.
 * Also carries the `published` toggle: only published Templates are visible to
 * Tenant Admin when combining them into tenant-scoped CatalogItems.
 *
 * @temp-api — see api/v1/template-billing.ts for how this is persisted.
 */
import {
  Button,
  Checkbox,
  Content,
  FormGroup,
  Split,
  SplitItem,
  TextInput,
} from '@patternfly/react-core';

import type { BillableComponent } from '../../api/v1/billing-types';
import { useTenants } from '../../api/v1/tenant';
import { useTranslation } from '../../hooks/useTranslation';

interface TemplateBillingFieldsEditorProps {
  published: boolean;
  onPublishedChange: (published: boolean) => void;
  components: BillableComponent[];
  onComponentsChange: (components: BillableComponent[]) => void;
  allowedTenants: string[];
  onAllowedTenantsChange: (allowedTenants: string[]) => void;
}

export const TemplateBillingFieldsEditor = ({
  published,
  onPublishedChange,
  components,
  onComponentsChange,
  allowedTenants,
  onAllowedTenantsChange,
}: TemplateBillingFieldsEditorProps) => {
  const { t } = useTranslation();
  const { data: tenants = [] } = useTenants();
  const toggleTenant = (id: string) =>
    onAllowedTenantsChange(
      allowedTenants.includes(id)
        ? allowedTenants.filter((t) => t !== id)
        : [...allowedTenants, id],
    );
  const addRow = () =>
    onComponentsChange([...components, { meterKey: '', unit: 'hour', baseRate: '', infraRef: '' }]);
  const removeRow = (i: number) => onComponentsChange(components.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof BillableComponent, val: string) =>
    onComponentsChange(components.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  return (
    <>
      <FormGroup fieldId="tbl-published" style={{ marginBottom: '1rem' }}>
        <Checkbox
          id="tbl-published"
          label={t('Published (visible to Tenant Admins when combining CatalogItems)')}
          isChecked={published}
          onChange={(_e, v) => onPublishedChange(v)}
        />
        <Content component="small" style={{ color: 'var(--pf-t--global--color--200)' }}>
          {t(
            'Unpublished templates are hidden from the Tenant Admin combine flow — use this while a template is still being tuned.',
          )}
        </Content>
      </FormGroup>

      {tenants.length > 0 && (
        <FormGroup
          label={t('Restrict to specific tenants')}
          fieldId="tbl-allowed-tenants"
          style={{ marginBottom: '1rem' }}
        >
          {tenants.map((t) => (
            <Checkbox
              key={t.id}
              id={`tbl-tenant-${t.id}`}
              label={t.metadata?.name ?? t.id}
              isChecked={allowedTenants.includes(t.id)}
              onChange={() => toggleTenant(t.id)}
              style={{ marginBottom: 4 }}
            />
          ))}
          {allowedTenants.length > 0 ? (
            <Button variant="link" isInline onClick={() => onAllowedTenantsChange([])}>
              {t('Clear (grant to all)')}
            </Button>
          ) : (
            <Content component="small" style={{ color: 'var(--pf-t--global--color--200)' }}>
              {t('No tenants selected — published to all tenants.')}
            </Content>
          )}
        </FormGroup>
      )}

      <FormGroup
        label={t('Billable components')}
        fieldId="tbl-billable-components"
        labelHelp={
          <span style={{ fontSize: '0.8em', color: 'var(--pf-t--global--color--200)' }}>
            {t(
              "Base rate a CatalogItem built from this template inherits. A tenant's price plan can override individual meterKeys (see Billing → Price plans). infraRef optionally points to a NetworkClass / StorageBackend id for pass-through infra components.",
            )}
          </span>
        }
      >
        {components.length === 0 && (
          <Content component="small" style={{ display: 'block', marginBottom: '0.5rem' }}>
            {t(
              'No billable components declared — CatalogItems built from this template will show no price until at least one meter is added.',
            )}
          </Content>
        )}
        {components.map((row, i) => (
          <Split key={i} hasGutter style={{ marginBottom: 6 }}>
            <SplitItem>
              <TextInput
                value={row.meterKey}
                onChange={(_e, v) => updateRow(i, 'meterKey', v)}
                placeholder={t('vm-hours')}
                aria-label={t('Meter key')}
                style={{ width: 160 }}
              />
            </SplitItem>
            <SplitItem>
              <TextInput
                value={row.unit}
                onChange={(_e, v) => updateRow(i, 'unit', v)}
                placeholder={t('hour')}
                aria-label={t('Unit')}
                style={{ width: 100 }}
              />
            </SplitItem>
            <SplitItem>
              <TextInput
                value={row.baseRate}
                onChange={(_e, v) => updateRow(i, 'baseRate', v)}
                placeholder="0.05"
                type="number"
                aria-label={t('Base rate (USD)')}
                style={{ width: 110 }}
              />
            </SplitItem>
            <SplitItem>
              <TextInput
                value={row.infraRef ?? ''}
                onChange={(_e, v) => updateRow(i, 'infraRef', v)}
                placeholder={t('infraRef (optional)')}
                aria-label={t('Infra reference')}
                style={{ width: 160 }}
              />
            </SplitItem>
            <SplitItem>
              <Button variant="plain" onClick={() => removeRow(i)}>
                ✕
              </Button>
            </SplitItem>
          </Split>
        ))}
        <Button variant="link" onClick={addRow}>
          {t('+ Add billable component')}
        </Button>
      </FormGroup>
    </>
  );
};
