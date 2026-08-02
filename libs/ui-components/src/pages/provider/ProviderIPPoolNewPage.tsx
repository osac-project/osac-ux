/**
 * flow: ip-pools
 * route: /provider/ip-pools/new
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Label,
  MenuToggle,
  PageSection,
  Select,
  SelectList,
  SelectOption,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreateExternalIPPool } from '../../api/v1/ip-management';
import { useTenants } from '../../api/v1/tenant';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const IP_FAMILIES = [
  { label: 'IPv4', value: 1 },
  { label: 'IPv6', value: 2 },
];

const CIDR_RE = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$|^[0-9a-fA-F:]+\/\d{1,3}$/;

const BACK = '/provider/ip-pools';

export const ProviderIPPoolNewPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: tenants = [] } = useTenants();
  const createExternal = useCreateExternalIPPool();

  const [name, setName] = useState('');
  const [ipFamily, setIpFamily] = useState(1);
  const [familyOpen, setFamilyOpen] = useState(false);
  const [cidr, setCidr] = useState('');
  const [zone, setZone] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [tenantOpen, setTenantOpen] = useState(false);

  const cidrInvalid = cidr.trim().length > 0 && !CIDR_RE.test(cidr.trim());
  const isValid = name.trim().length > 0 && !cidrInvalid;

  const selectedTenantName =
    tenants.find((tenant) => tenant.id === tenantId)?.metadata?.name ?? tenantId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const meta: { name: string; tenant?: string } = { name: name.trim() };
    if (tenantId) {
      meta.tenant = tenantId;
    }
    const spec: { ipFamily: number; cidr?: string; zone?: string } = { ipFamily };
    if (cidr.trim()) {
      spec.cidr = cidr.trim();
    }
    if (zone.trim()) {
      spec.zone = zone.trim();
    }
    await createExternal.mutateAsync({ metadata: meta, spec });
    navigate(BACK);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACK)}>
                {t('IP Pools')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('Create external IP pool')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('Create external IP pool')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="ip-pool-form">
          {createExternal.error && (
            <Alert variant="danger" isInline title={t('Failed to create IP pool')}>
              {getErrorMessage(createExternal.error)}
            </Alert>
          )}

          <FormGroup label={t('Pool name')} isRequired fieldId="pool-name">
            <TextInput
              id="pool-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label={t('IP family')} isRequired fieldId="pool-ip-family">
            <Select
              isOpen={familyOpen}
              onSelect={(_e, val) => {
                setIpFamily(val as number);
                setFamilyOpen(false);
              }}
              onOpenChange={setFamilyOpen}
              selected={ipFamily}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setFamilyOpen(!familyOpen)}
                  isExpanded={familyOpen}
                >
                  {IP_FAMILIES.find((f) => f.value === ipFamily)?.label ?? t('Select')}
                </MenuToggle>
              )}
            >
              <SelectList>
                {IP_FAMILIES.map((f) => (
                  <SelectOption key={f.value} value={f.value}>
                    {f.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <FormGroup
            label={
              <>
                {t('CIDR block')}{' '}
                <Label isCompact color="gold" variant="outline">
                  {t('predicted')}
                </Label>
              </>
            }
            fieldId="pool-cidr"
          >
            <TextInput
              id="pool-cidr"
              value={cidr}
              onChange={(_e, v) => setCidr(v)}
              placeholder={ipFamily === 2 ? 'fd00::/48' : '203.0.113.0/24'}
              validated={cidrInvalid ? 'error' : 'default'}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem variant={cidrInvalid ? 'error' : 'default'}>
                  {cidrInvalid
                    ? t('Must be valid CIDR notation (e.g. 203.0.113.0/24)')
                    : t('Address range for this pool. Leave blank if managed by the backend.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup
            label={
              <>
                {t('Zone')}{' '}
                <Label isCompact color="gold" variant="outline">
                  {t('predicted')}
                </Label>
              </>
            }
            fieldId="pool-zone"
          >
            <TextInput
              id="pool-zone"
              value={zone}
              onChange={(_e, v) => setZone(v)}
              placeholder="us-east-1"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>{t('Datacenter or availability zone. Optional.')}</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('Assign to tenant')} fieldId="pool-tenant">
            <Select
              isOpen={tenantOpen}
              onSelect={(_e, val) => {
                setTenantId(val as string);
                setTenantOpen(false);
              }}
              onOpenChange={setTenantOpen}
              selected={tenantId || undefined}
              toggle={(ref) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setTenantOpen(!tenantOpen)}
                  isExpanded={tenantOpen}
                >
                  {tenantId ? selectedTenantName : t('No tenant (shared)')}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="">{t('No tenant (shared)')}</SelectOption>
                {tenants.map((tenant) => (
                  <SelectOption key={tenant.id} value={tenant.id}>
                    {tenant.metadata?.name ?? tenant.id}
                    {tenant.spec?.domains?.length ? ` (${tenant.spec.domains.join(', ')})` : ''}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FormGroup>

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="ip-pool-form"
              isLoading={createExternal.isPending}
              isDisabled={createExternal.isPending || !isValid}
            >
              {t('Create')}
            </Button>
            <Button
              variant="link"
              onClick={() => navigate(BACK)}
              isDisabled={createExternal.isPending}
            >
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
