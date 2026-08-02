/**
 * flow: provider-admin
 * route: /provider/templates/cluster/:id/edit
 *
 * Cluster template spec (title, description, node counts) is defined
 * externally in osac-app / the AAP controller — this page shows it
 * read-only. Each node set's host type is an exception: it's just a
 * reference to a resource the Provider Admin already owns/prices (see
 * /provider/host-types), so it's editable here. The other editable
 * surface is the Billing tab: published state, BillableComponents
 * (pricing), and the per-tenant allow-list (sharing).
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
import { useClusterTemplate, usePatchClusterTemplate } from '../../api/v1/cluster-templates';
import { hostTypeName, useHostTypes } from '../../api/v1/host-types';
import {
  buildTemplateMetadataPatch,
  isTemplatePublished,
  readAllowedTenants,
  readBillableComponents,
} from '../../api/v1/template-billing';
import { TemplateBillingFieldsEditor } from '../../components/catalog/TemplateBillingFieldsEditor';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const BACK = '/provider/templates?tab=cluster';

export const ProviderClusterTemplateFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: existing, isLoading: loadingExisting } = useClusterTemplate(id ?? '');
  const { data: hostTypes = [] } = useHostTypes();

  const [isPending, setIsPending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'billing'>('details');
  const [published, setPublished] = useState(true);
  const [billableComponents, setBillableComponents] = useState<BillableComponent[]>([]);
  const [allowedTenants, setAllowedTenants] = useState<string[]>([]);
  const [nodeSetHostTypes, setNodeSetHostTypes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && !hydrated) {
      setPublished(isTemplatePublished(existing));
      setBillableComponents(readBillableComponents(existing));
      setAllowedTenants(readAllowedTenants(existing));
      const initial: Record<string, string> = {};
      for (const [name, ns] of Object.entries(existing.nodeSets ?? {})) {
        initial[name] = ns.hostType ?? '';
      }
      setNodeSetHostTypes(initial);
      setHydrated(true);
    }
  }, [existing, hydrated]);

  const patch = usePatchClusterTemplate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!existing) {
      return;
    }
    setIsPending(true);
    patch.reset();
    try {
      const nodeSets = Object.fromEntries(
        Object.entries(existing.nodeSets ?? {}).map(([name, ns]) => [
          name,
          { ...ns, hostType: nodeSetHostTypes[name] ?? ns.hostType },
        ]),
      );
      await patch.mutateAsync({
        id: existing.id,
        patch: {
          metadata: buildTemplateMetadataPatch(existing, {
            published,
            billableComponents,
            allowedTenants,
          }),
          nodeSets,
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
        <Spinner aria-label={t('Loading cluster template')} />
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
            {t('View & publish cluster template')}
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
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="clt-form">
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
              {Object.entries(existing?.nodeSets ?? {}).map(([name, ns]) => (
                <FormGroup
                  key={name}
                  label={t('Node set: {{name}} (×{{size}} nodes)', { name, size: ns.size })}
                  fieldId={`clt-node-set-${name}`}
                  style={{ marginTop: '1rem' }}
                >
                  <FormSelect
                    id={`clt-node-set-${name}`}
                    value={nodeSetHostTypes[name] ?? ''}
                    onChange={(_e, v) => setNodeSetHostTypes((prev) => ({ ...prev, [name]: v }))}
                  >
                    <FormSelectOption value="" label={t('— None —')} />
                    {hostTypes.map((ht) => (
                      <FormSelectOption key={ht.id} value={ht.id} label={hostTypeName(ht)} />
                    ))}
                    {nodeSetHostTypes[name] &&
                      !hostTypes.some((ht) => ht.id === nodeSetHostTypes[name]) && (
                        <FormSelectOption
                          value={nodeSetHostTypes[name]}
                          label={nodeSetHostTypes[name]}
                        />
                      )}
                  </FormSelect>
                </FormGroup>
              ))}
              <Content component="small" style={{ color: 'var(--pf-t--global--color--200)' }}>
                {t('Host type is editable — references Host Types you manage under Host Types.')}
              </Content>
            </>
          )}

          {patch.error && (
            <Alert
              variant="danger"
              title={t('Failed to update cluster template')}
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
              form="clt-form"
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
