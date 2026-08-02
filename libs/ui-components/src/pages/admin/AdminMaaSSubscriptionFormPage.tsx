/**
 * flow: admin-maas-subscriptions
 * route: /admin/ai-subscriptions/new (tenantAdmin)
 * route: /admin/ai-subscriptions/:id/edit (tenantAdmin)
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  MenuToggle,
  NumberInput,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Spinner,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useMaaSCatalogItems } from '../../api/v1/maas-catalog-item';
import {
  useCreateSubscription,
  usePatchSubscription,
  useSubscription,
} from '../../api/v1/maas-subscription';
import { useSession } from '../../hooks/use-session';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const DEFAULT_RATE_LIMIT = 60;
const DEFAULT_TOKEN_QUOTA = 1_000_000;

export const AdminMaaSSubscriptionFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { tenantId } = useSession();

  const { data: existing, isLoading: isLoadingExisting } = useSubscription(id);
  const { data: catalogItems = [] } = useMaaSCatalogItems({}, tenantId);

  const [modelCatalogItemId, setModelCatalogItemId] = useState('');
  const [modelOpen, setModelOpen] = useState(false);
  const [name, setName] = useState('');
  const [groupAccessInput, setGroupAccessInput] = useState('');
  const [rateLimit, setRateLimit] = useState<number>(DEFAULT_RATE_LIMIT);
  const [tokenQuota, setTokenQuota] = useState<number>(DEFAULT_TOKEN_QUOTA);
  const [idpRef, setIdpRef] = useState('tenant-oidc');

  const {
    mutateAsync: createSubscription,
    isPending: isCreating,
    error: createError,
  } = useCreateSubscription();
  const {
    mutateAsync: patchSubscription,
    isPending: isPatching,
    error: patchError,
  } = usePatchSubscription();

  useEffect(() => {
    if (existing) {
      setName(existing.metadata?.name ?? '');
      setModelCatalogItemId(existing.spec?.modelCatalogItemId ?? '');
      setGroupAccessInput((existing.spec?.groupAccess ?? []).join(', '));
      setRateLimit(existing.spec?.rateLimit ?? DEFAULT_RATE_LIMIT);
      setTokenQuota(existing.spec?.tokenQuota ?? DEFAULT_TOKEN_QUOTA);
      setIdpRef(existing.spec?.idpRef ?? 'tenant-oidc');
    }
  }, [existing]);

  const isPending = isCreating || isPatching;
  const error = createError ?? patchError;
  const selectedModel = catalogItems.find((c) => c.id === modelCatalogItemId);

  const isValid = name.trim().length > 0 && modelCatalogItemId.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const groupAccess = groupAccessInput
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
    const spec = {
      modelCatalogItemId,
      groupAccess,
      rateLimit,
      tokenQuota,
      idpRef: idpRef.trim() || undefined,
    };
    if (isEdit && id) {
      await patchSubscription({ id, patch: { spec } });
    } else {
      await createSubscription({
        metadata: { name: name.trim(), tenant: tenantId },
        spec,
        status: { state: 'ACTIVE' },
      });
    }
    navigate('/admin/ai-subscriptions');
  };

  if (isEdit && isLoadingExisting) {
    return <Spinner aria-label={t('Loading subscription')} />;
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/ai-subscriptions')}>
                {t('AI Subscriptions')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {isEdit ? t('Edit subscription') : t('Create subscription')}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit subscription') : t('Create subscription')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="subscription-form">
          <FormGroup label={t('Subscription name')} isRequired fieldId="sub-name">
            <TextInput
              id="sub-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="rag-team-llama"
              isRequired
              isDisabled={isEdit}
              autoFocus
            />
          </FormGroup>

          <FormGroup label={t('Model')} isRequired fieldId="sub-model">
            <Select
              isOpen={modelOpen}
              onOpenChange={setModelOpen}
              selected={modelCatalogItemId}
              onSelect={(_e, v) => {
                setModelCatalogItemId(v as string);
                setModelOpen(false);
              }}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setModelOpen(!modelOpen)}
                  isExpanded={modelOpen}
                  isDisabled={isEdit}
                >
                  {selectedModel?.title ?? t('Select a model')}
                </MenuToggle>
              )}
            >
              <SelectList>
                {catalogItems.map((c) => (
                  <SelectOption key={c.id} value={c.id}>
                    {c.title}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup label={t('Group access')} isRequired fieldId="sub-groups">
            <TextInput
              id="sub-groups"
              value={groupAccessInput}
              onChange={(_e, v) => setGroupAccessInput(v)}
              placeholder="rag-engineers, platform-team"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('Comma-separated Authorino group IDs allowed to consume this subscription.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('Rate limit (requests/min)')} fieldId="sub-rate-limit">
            <NumberInput
              id="sub-rate-limit"
              value={rateLimit}
              onMinus={() => setRateLimit((v) => Math.max(1, v - 10))}
              onPlus={() => setRateLimit((v) => v + 10)}
              onChange={(e) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                if (!isNaN(v)) {
                  setRateLimit(Math.max(1, v));
                }
              }}
              min={1}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>{t('Enforced by the Limiter gateway component.')}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('Monthly token quota')} fieldId="sub-token-quota">
            <NumberInput
              id="sub-token-quota"
              value={tokenQuota}
              onMinus={() => setTokenQuota((v) => Math.max(100_000, v - 100_000))}
              onPlus={() => setTokenQuota((v) => v + 100_000)}
              onChange={(e) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                if (!isNaN(v)) {
                  setTokenQuota(Math.max(100_000, v));
                }
              }}
              min={100_000}
            />
          </FormGroup>

          <FormGroup label={t('IDP reference')} fieldId="sub-idp-ref">
            <TextInput
              id="sub-idp-ref"
              value={idpRef}
              onChange={(_e, v) => setIdpRef(v)}
              placeholder="tenant-oidc"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('Tenant identity provider Authorino uses to authenticate consumers.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title={t('Failed to save subscription')}>
              {getErrorMessage(error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="subscription-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              {isEdit ? t('Save') : t('Create subscription')}
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/admin/ai-subscriptions')}
              isDisabled={isPending}
            >
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
