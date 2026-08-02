/**
 * flow: provider-admin
 * route: /provider/templates/vm/:id/edit
 *
 * VM template spec (title, description, image) is defined externally in
 * osac-app / the AAP controller — this page shows it read-only. The default
 * instance type is an exception: it's just a reference to a resource the
 * Provider Admin already owns/prices (see /provider/instance-types), so it's
 * editable here. The other editable surface is the Billing tab: published
 * state, BillableComponents (pricing), and the per-tenant allow-list (sharing).
 */
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  PageSection,
  Spinner,
  Stack,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';

import type { BillableComponent } from '../../api/v1/billing-types';
import {
  useComputeInstanceTemplate,
  usePatchComputeInstanceTemplate,
} from '../../api/v1/compute-instance-templates';
import { formatInstanceTypeOptionLabel, useInstanceTypes } from '../../api/v1/instance-types';
import {
  buildTemplateMetadataPatch,
  isTemplatePublished,
  readAllowedTenants,
  readBillableComponents,
} from '../../api/v1/template-billing';
import { TemplateBillingFieldsEditor } from '../../components/catalog/TemplateBillingFieldsEditor';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const BACK = '/provider/templates?tab=vm';

export const ProviderVmTemplateFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: existing, isLoading: loadingExisting } = useComputeInstanceTemplate(id ?? '');
  const { data: instanceTypes = [] } = useInstanceTypes();

  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');
  const [published, setPublished] = useState(true);
  const [billableComponents, setBillableComponents] = useState<BillableComponent[]>([]);
  const [allowedTenants, setAllowedTenants] = useState<string[]>([]);
  const [instanceTypeId, setInstanceTypeId] = useState('');

  useEffect(() => {
    if (existing && !hydrated) {
      setPublished(isTemplatePublished(existing));
      setBillableComponents(readBillableComponents(existing));
      setAllowedTenants(readAllowedTenants(existing));
      setInstanceTypeId(existing.specDefaults?.instanceType ?? '');
      setHydrated(true);
    }
  }, [existing, hydrated]);

  const patch = usePatchComputeInstanceTemplate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!existing) {
      return;
    }
    setIsPending(true);
    patch.reset();
    try {
      await patch.mutateAsync({
        id: existing.id,
        patch: {
          metadata: buildTemplateMetadataPatch(existing, {
            published,
            billableComponents,
            allowedTenants,
          }),
          specDefaults: { ...existing.specDefaults, instanceType: instanceTypeId },
        } as never,
      });
      navigate(BACK);
    } finally {
      setIsPending(false);
    }
  };

  if (loadingExisting) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label={t('Loading VM template')} />
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/provider/templates')}>
                {t('Templates')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>
              {t('View & publish — {{name}}', { name: existing?.metadata?.name ?? id })}
            </BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('View & publish VM template')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false} style={{ paddingBottom: 0 }}>
        <Tabs activeKey={activeTab} onSelect={(_e, k) => setActiveTab(k as 'details' | 'billing')}>
          <Tab eventKey="details" title={<TabTitleText>{t('Details')}</TabTitleText>} />
          <Tab eventKey="billing" title={<TabTitleText>{t('Billing')}</TabTitleText>} />
        </Tabs>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="vmt-form">
          {activeTab === 'billing' && (
            <TemplateBillingFieldsEditor
              published={published}
              onPublishedChange={setPublished}
              components={billableComponents}
              onComponentsChange={setBillableComponents}
              allowedTenants={allowedTenants}
              onAllowedTenantsChange={setAllowedTenants}
            />
          )}

          {activeTab === 'details' && (
            <>
              <Content component="small" style={{ color: 'var(--pf-t--global--color--200)' }}>
                {t('Defined in osac-app / AAP controller — read-only.')}
              </Content>
              <DescriptionList style={{ marginTop: '1rem' }}>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Title')}</DescriptionListTerm>
                  <DescriptionListDescription>{existing?.title || '—'}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {existing?.description || '—'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <FormGroup
                label={t('Default instance type')}
                fieldId="vmt-instance-type"
                style={{ marginTop: '1rem' }}
              >
                <FormSelect
                  id="vmt-instance-type"
                  value={instanceTypeId}
                  onChange={(_e, v) => setInstanceTypeId(v)}
                >
                  <FormSelectOption value="" label={t('— None —')} />
                  {instanceTypes.map((it) => (
                    <FormSelectOption
                      key={it.id}
                      value={it.id}
                      label={formatInstanceTypeOptionLabel(it)}
                    />
                  ))}
                  {instanceTypeId && !instanceTypes.some((it) => it.id === instanceTypeId) && (
                    <FormSelectOption value={instanceTypeId} label={instanceTypeId} />
                  )}
                </FormSelect>
                <Content component="small" style={{ color: 'var(--pf-t--global--color--200)' }}>
                  {t('Editable — references an Instance Type you manage under Instance Types.')}
                </Content>
              </FormGroup>
              <DescriptionList style={{ marginTop: '1rem' }}>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Default image')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {existing?.specDefaults?.image?.sourceRef ? (
                      <code style={{ fontSize: '0.9em' }}>
                        {existing.specDefaults.image.sourceRef}
                      </code>
                    ) : (
                      '—'
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </>
          )}

          {patch.error && (
            <Alert
              variant="danger"
              title={t('Failed to update VM template')}
              isInline
              style={{ marginTop: '1rem' }}
            >
              {getErrorMessage(patch.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="vmt-form"
              isLoading={isPending}
              isDisabled={isPending}
            >
              {t('Save')}
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
