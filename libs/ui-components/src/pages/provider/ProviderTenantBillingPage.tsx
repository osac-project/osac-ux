/**
 * flow: provider-admin (CSP Admin — Billing capability)
 * route: /provider/billing/tenants
 *
 * @temp-api — price_plan_ref / affiliate_id / billing_model are stored as
 * osac.io/* labels on Tenant.metadata until TenantSpec gains first-class
 * fields (REQ-BA-4). Tenant Admin never sees or edits this page.
 */
import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  FormGroup,
  Label,
  MenuToggle,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
  SelectList,
  SelectOption,
  TextInput,
} from '@patternfly/react-core';
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Tenant } from '@osac/types';

import { readTenantBillingInfo, usePatchTenantBilling } from '../../api/v1/billing-tenant';
import type { BillingModel } from '../../api/v1/billing-types';
import { usePricePlans } from '../../api/v1/price-plan';
import { useTenants } from '../../api/v1/tenant';
import ListPage from '../../components/Page/ListPage';
import ListPageBody from '../../components/Page/ListPageBody';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const BILLING_MODELS: BillingModel[] = ['PAY_AS_YOU_GO', 'PREPAID', 'SUBSCRIPTION'];

const AssignBillingModal = ({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) => {
  const { t } = useTranslation();
  const { data: plans = [] } = usePricePlans();
  const patch = usePatchTenantBilling();
  const current = readTenantBillingInfo(tenant);

  const [planRef, setPlanRef] = useState(current.pricePlanRef ?? '');
  const [affiliateId, setAffiliateId] = useState(current.affiliateId ?? '');
  const [billingModel, setBillingModel] = useState<BillingModel>(
    current.billingModel ?? 'PAY_AS_YOU_GO',
  );
  const [planOpen, setPlanOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSave = async () => {
    setIsPending(true);
    patch.reset();
    try {
      await patch.mutateAsync({
        id: tenant.id,
        tenant,
        billing: {
          pricePlanRef: planRef || undefined,
          affiliateId: affiliateId.trim() || undefined,
          billingModel,
        },
      });
      onClose();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={isPending ? undefined : onClose}
      variant="small"
      aria-labelledby="assign-billing-title"
    >
      <ModalHeader
        title={t('Billing — {{name}}', { name: tenant.metadata?.name ?? tenant.id })}
        labelId="assign-billing-title"
      />
      <ModalBody>
        <FormGroup label={t('Price plan')} fieldId="ab-plan" style={{ marginBottom: '1rem' }}>
          <Select
            isOpen={planOpen}
            onOpenChange={setPlanOpen}
            selected={planRef}
            onSelect={(_e, v) => {
              setPlanRef(v as string);
              setPlanOpen(false);
            }}
            toggle={(ref) => (
              <MenuToggle ref={ref} onClick={() => setPlanOpen(!planOpen)} isExpanded={planOpen}>
                {plans.find((p) => p.id === planRef)?.title ?? t('Default (base rates)')}
              </MenuToggle>
            )}
          >
            <SelectList>
              <SelectOption value="">{t('Default (base rates)')}</SelectOption>
              {plans.map((p) => (
                <SelectOption key={p.id} value={p.id}>
                  {p.title}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FormGroup>

        <FormGroup label={t('Billing model')} fieldId="ab-model" style={{ marginBottom: '1rem' }}>
          <Select
            isOpen={modelOpen}
            onOpenChange={setModelOpen}
            selected={billingModel}
            onSelect={(_e, v) => {
              setBillingModel(v as BillingModel);
              setModelOpen(false);
            }}
            toggle={(ref) => (
              <MenuToggle ref={ref} onClick={() => setModelOpen(!modelOpen)} isExpanded={modelOpen}>
                {billingModel}
              </MenuToggle>
            )}
          >
            <SelectList>
              {BILLING_MODELS.map((m) => (
                <SelectOption key={m} value={m}>
                  {m}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </FormGroup>

        <FormGroup
          label={t('Affiliate ID')}
          fieldId="ab-affiliate"
          labelHelp={
            <span style={{ fontSize: '0.8em', color: 'var(--pf-t--global--color--200)' }}>
              {t(
                'Routes to Koku tag-based markup rules for reseller / partner pricing. Leave blank for direct tenants.',
              )}
            </span>
          }
        >
          <TextInput
            id="ab-affiliate"
            value={affiliateId}
            onChange={(_e, v) => setAffiliateId(v)}
            placeholder="acme-reseller-001"
          />
        </FormGroup>

        {patch.error && (
          <Alert variant="danger" title={t('Failed to update billing assignment')} isInline>
            {getErrorMessage(patch.error)}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isPending}
            isDisabled={isPending}
          >
            {t('Save')}
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};

export const ProviderTenantBillingPage = () => {
  const { t } = useTranslation();
  const { data: tenants = [], isLoading, error } = useTenants();
  const { data: plans = [] } = usePricePlans();
  const [editing, setEditing] = useState<Tenant | null>(null);

  const planTitle = (planRef?: string) => {
    if (!planRef) {
      return t('Default (base rates)');
    }
    return plans.find((p) => p.id === planRef)?.title ?? planRef;
  };

  return (
    <>
      <ListPage
        title={t('Tenant billing')}
        description={t(
          'Assign a price plan, affiliate ID, and billing model per tenant. organization_id is always resolved server-side from the Keycloak JWT — never accepted from the client. Tenant Admins cannot view or edit this page.',
        )}
      >
        <ListPageBody isLoading={isLoading} error={error}>
          <Table aria-label={t('Tenant billing')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Tenant')}</Th>
                <Th>{t('Price plan')}</Th>
                <Th>{t('Affiliate ID')}</Th>
                <Th>{t('Billing model')}</Th>
                <Th aria-label={t('Actions')} />
              </Tr>
            </Thead>
            <Tbody>
              {tenants.map((tenant) => {
                const billing = readTenantBillingInfo(tenant);
                return (
                  <Tr key={tenant.id}>
                    <Td dataLabel={t('Tenant')}>
                      <strong>{tenant.metadata?.name ?? tenant.id}</strong>
                    </Td>
                    <Td dataLabel={t('Price plan')}>
                      <Label isCompact color={billing.pricePlanRef ? 'purple' : 'grey'}>
                        {planTitle(billing.pricePlanRef)}
                      </Label>
                    </Td>
                    <Td dataLabel={t('Affiliate ID')}>
                      {billing.affiliateId ? <code>{billing.affiliateId}</code> : '—'}
                    </Td>
                    <Td dataLabel={t('Billing model')}>
                      <Label isCompact color="blue">
                        {billing.billingModel ?? 'PAY_AS_YOU_GO'}
                      </Label>
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[{ title: t('Edit billing'), onClick: () => setEditing(tenant) }]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </ListPageBody>
      </ListPage>

      {editing && <AssignBillingModal tenant={editing} onClose={() => setEditing(null)} />}
    </>
  );
};
