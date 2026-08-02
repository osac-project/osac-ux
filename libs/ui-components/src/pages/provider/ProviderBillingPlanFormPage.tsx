/**
 * flow: provider-admin (CSP Admin — Billing capability)
 * route: /provider/billing/plans/new
 * route: /provider/billing/plans/:id/edit
 *
 * @temp-api — fronts the predicted v1/price_plans endpoint (REQ-BA-4).
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Form,
  FormGroup,
  PageSection,
  Spinner,
  Split,
  SplitItem,
  Stack,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreatePricePlan, usePatchPricePlan, usePricePlan } from '../../api/v1/price-plan';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const BACK = '/provider/billing/plans';

interface RateRow {
  meterKey: string;
  rate: string;
}

export const ProviderBillingPlanFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { data: existing, isLoading } = usePricePlan(id);
  const create = useCreatePricePlan();
  const patch = usePatchPricePlan();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tier, setTier] = useState('standard');
  const [isDefault, setIsDefault] = useState(false);
  const [rates, setRates] = useState<RateRow[]>([{ meterKey: '', rate: '' }]);
  const [hydrated, setHydrated] = useState(!isEdit);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!hydrated && existing) {
      setTitle(existing.title ?? '');
      setDescription(existing.description ?? '');
      setTier(existing.tier ?? 'standard');
      setIsDefault(Boolean(existing.isDefault));
      const entries = Object.entries(existing.rateOverrides ?? {});
      setRates(
        entries.length > 0
          ? entries.map(([meterKey, rate]) => ({ meterKey, rate }))
          : [{ meterKey: '', rate: '' }],
      );
      setHydrated(true);
    }
  }, [existing, hydrated]);

  const mutationError = isEdit ? patch.error : create.error;

  const addRate = () => setRates((prev) => [...prev, { meterKey: '', rate: '' }]);
  const removeRate = (i: number) => setRates((prev) => prev.filter((_, idx) => idx !== i));
  const updateRate = (i: number, field: keyof RateRow, val: string) =>
    setRates((prev) => prev.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }
    setIsPending(true);
    create.reset();
    patch.reset();
    try {
      const rateOverrides: Record<string, string> = {};
      for (const row of rates) {
        if (row.meterKey.trim() && row.rate.trim()) {
          rateOverrides[row.meterKey.trim()] = row.rate.trim();
        }
      }
      const body = {
        metadata: { name: title.toLowerCase().replace(/\s+/g, '-') },
        title: title.trim(),
        description: description.trim(),
        tier,
        isDefault,
        rateOverrides,
      };
      if (isEdit && id) {
        await patch.mutateAsync({ id, patch: body });
      } else {
        await create.mutateAsync(body);
      }
      navigate(BACK);
    } finally {
      setIsPending(false);
    }
  };

  if (isEdit && isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label={t('Loading price plan')} />
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACK)}>
                {t('Price plans')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit ? t('Edit price plan') : t('Create price plan')}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit price plan') : t('Create price plan')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '640px' }} id="plan-form">
          <FormGroup label={t('Title')} fieldId="plan-title" isRequired>
            <TextInput
              id="plan-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder={t('Reseller — Tier A')}
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label={t('Description')} fieldId="plan-description">
            <TextArea
              id="plan-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={2}
            />
          </FormGroup>

          <FormGroup label={t('Tier')} fieldId="plan-tier">
            <TextInput
              id="plan-tier"
              value={tier}
              onChange={(_e, v) => setTier(v)}
              placeholder={t('standard | reseller | gov')}
            />
          </FormGroup>

          <FormGroup
            label={t('Rate overrides')}
            fieldId="plan-rates"
            labelHelp={
              <span style={{ fontSize: '0.8em', color: 'var(--pf-t--global--color--200)' }}>
                {t(
                  'meterKey must match a BillableComponent declared on a template (e.g. vm-hours, gpu-hours, network-egress-gb, storage-gb-month). Unlisted meters fall back to base rate.',
                )}
              </span>
            }
          >
            {rates.map((row, i) => (
              <Split key={i} hasGutter style={{ marginBottom: 6 }}>
                <SplitItem>
                  <TextInput
                    value={row.meterKey}
                    onChange={(_e, v) => updateRate(i, 'meterKey', v)}
                    placeholder="vm-hours"
                    aria-label={t('Meter key')}
                    style={{ width: 200 }}
                  />
                </SplitItem>
                <SplitItem>
                  <TextInput
                    value={row.rate}
                    onChange={(_e, v) => updateRate(i, 'rate', v)}
                    placeholder="0.056"
                    type="number"
                    aria-label={t('Override rate (USD)')}
                    style={{ width: 120 }}
                  />
                </SplitItem>
                <SplitItem>
                  <Button variant="plain" onClick={() => removeRate(i)}>
                    ✕
                  </Button>
                </SplitItem>
              </Split>
            ))}
            <Button variant="link" onClick={addRate}>
              {t('+ Add rate override')}
            </Button>
          </FormGroup>

          <FormGroup fieldId="plan-default">
            <Checkbox
              id="plan-default"
              label={t('Default plan (assigned to tenants with no explicit price_plan_ref)')}
              isChecked={isDefault}
              onChange={(_e, v) => setIsDefault(v)}
            />
          </FormGroup>

          {mutationError && (
            <Alert variant="danger" title={t('Failed to save price plan')} isInline>
              {getErrorMessage(mutationError)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="plan-form"
              isLoading={isPending}
              isDisabled={isPending || !title.trim()}
            >
              {isEdit ? t('Save') : t('Create')}
            </Button>
            <Button variant="link" onClick={() => navigate(BACK)} isDisabled={isPending}>
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
