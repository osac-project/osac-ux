import { useParams } from 'react-router-dom';
import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  PageSection,
  ProgressStep,
  ProgressStepper,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';

import { ConditionStatus, TenantConditionType, Tenants } from '@osac/types/private';
import type { Tenant, TenantCondition } from '@osac/types/private';
import { useGetResource } from '@osac/ui-components/api/use-resource';
import TenantActionsMenu from '@osac/ui-components/components/Tenant/TenantActionsMenu';
import TenantResourceUsageSection from '@osac/ui-components/components/Tenant/TenantResourceUsageSection';
import TenantRolesSection from '@osac/ui-components/components/Tenant/TenantRolesSection';
import TenantStatusLabel from '@osac/ui-components/components/Tenant/TenantStatusLabel';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { Timestamp } from '../Primitives/Timestamp';
import { ResourceDetailHeader } from '../Resource/ResourceDetailHeader';
import ResourceDetailsPage from '../Resource/ResourceDetailsPage';

import './TenantDetailsPage.css';
import '../shared/details-page.css';

const TENANTS_LIST_PATH = '/admin/tenants';

const SETUP_CONDITION_TYPES = [
  TenantConditionType.DEFAULT_NETWORKING_READY,
  TenantConditionType.VAULT_READY,
  TenantConditionType.COMPUTE_INFRASTRUCTURE_READY,
] as const;

const conditionLabel = (type: TenantConditionType, t: (key: string) => string) => {
  switch (type) {
    case TenantConditionType.DEFAULT_NETWORKING_READY:
      return t('Default networking');
    case TenantConditionType.VAULT_READY:
      return t('Vault');
    case TenantConditionType.COMPUTE_INFRASTRUCTURE_READY:
      return t('Compute infrastructure');
    default:
      return t('Tenant setup');
  }
};

const conditionStatusText = (status: ConditionStatus, t: (key: string) => string) => {
  switch (status) {
    case ConditionStatus.TRUE:
      return t('Ready');
    case ConditionStatus.FALSE:
      return t('Not ready');
    default:
      return t('Unknown');
  }
};

const conditionStepVariant = (
  status: ConditionStatus,
): 'success' | 'warning' | 'pending' | 'default' => {
  switch (status) {
    case ConditionStatus.TRUE:
      return 'success';
    case ConditionStatus.FALSE:
      return 'warning';
    case ConditionStatus.UNSPECIFIED:
      return 'pending';
    default:
      return 'default';
  }
};

const getCondition = (tenant: Tenant, type: TenantConditionType): TenantCondition | undefined =>
  tenant.status?.conditions.find((condition) => condition.type === type);

const displayValue = (value?: string) => value?.trim() || '—';

interface TenantSetupProgressProps {
  tenant: Tenant;
}

const TenantSetupProgress = ({ tenant }: TenantSetupProgressProps) => {
  const { t } = useTranslation();

  return (
    <ProgressStepper isVertical aria-label={t('Tenant setup progress')}>
      {SETUP_CONDITION_TYPES.map((type) => {
        const condition = getCondition(tenant, type);
        const status = condition?.status ?? ConditionStatus.UNSPECIFIED;
        const label = conditionLabel(type, t);

        return (
          <ProgressStep
            key={type}
            id={`tenant-setup-${type}`}
            titleId={`tenant-setup-${type}-title`}
            variant={conditionStepVariant(status)}
            aria-label={`${label}, ${conditionStatusText(status, t)}`}
            description={condition?.message || t('No additional status information.')}
          >
            {label}
          </ProgressStep>
        );
      })}
    </ProgressStepper>
  );
};

interface TenantDetailsContentProps {
  tenant: Tenant;
}

const TenantDetailsContent = ({ tenant }: TenantDetailsContentProps) => {
  const { t } = useTranslation();
  const domains = tenant.spec?.domains ?? [];
  const credentialsSecret = tenant.spec?.breakGlassCredentialsSecret;
  const companyLogoSrc = tenant.metadata?.annotations?.['osac.io/company-logo'];
  const companyLogoFileName = tenant.metadata?.annotations?.['osac.io/company-logo-filename'];

  return (
    <PageSection hasBodyWrapper={false}>
      <Grid hasGutter>
        <GridItem md={8}>
          <Stack hasGutter>
            <StackItem>
              <Grid hasGutter>
                <GridItem md={6}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h2" size="lg">
                        {t('Overview')}
                      </Title>
                    </StackItem>
                    <StackItem>
                      <DescriptionList
                        isCompact
                        className="details-page__overview"
                        aria-label={t('Tenant overview')}
                      >
                        <DescriptionListGroup id="tenant-idp-information">
                          <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <TenantStatusLabel state={tenant.status?.state} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Company logo')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {companyLogoSrc ? (
                              <div className="tenant-details__logo-preview">
                                <img
                                  src={companyLogoSrc}
                                  alt={
                                    companyLogoFileName ||
                                    tenant.metadata?.name ||
                                    t('Company logo')
                                  }
                                />
                              </div>
                            ) : (
                              '—'
                            )}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Status message')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(tenant.status?.message)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Primary email domain')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(domains[0])}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Additional email domains')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {domains.length > 1 ? domains.slice(1).join(', ') : '—'}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Identity provider tenant')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(tenant.status?.idpTenantName)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Break-glass user')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(tenant.status?.breakGlassUserId)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Break-glass credentials')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {credentialsSecret
                              ? displayValue(credentialsSecret.name || credentialsSecret.id)
                              : '—'}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Registered')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Timestamp value={tenant.metadata?.creationTimestamp} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>{t('Created by')}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {displayValue(tenant.metadata?.creator)}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      </DescriptionList>
                    </StackItem>
                  </Stack>
                </GridItem>
                <GridItem md={6}>
                  <Stack hasGutter>
                    <StackItem>
                      <Title headingLevel="h2" size="lg">
                        {t('Tenant setup')}
                      </Title>
                    </StackItem>
                    <StackItem>
                      <TenantSetupProgress tenant={tenant} />
                    </StackItem>
                  </Stack>
                </GridItem>
              </Grid>
            </StackItem>
            <StackItem>
              <TenantResourceUsageSection />
            </StackItem>
            <StackItem>
              <Divider />
            </StackItem>
            <StackItem>
              <Title headingLevel="h2" size="lg">
                {t('Description')}
              </Title>
            </StackItem>
            <StackItem>
              <Content component="p">{displayValue(tenant.metadata?.description)}</Content>
            </StackItem>
          </Stack>
        </GridItem>

        <GridItem md={4}>
          <Stack hasGutter>
            <StackItem>
              <TenantRolesSection />
            </StackItem>
          </Stack>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

const TenantDetailsPage = () => {
  const { t } = useTranslation();
  const { id = '' } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetResource(Tenants, { id });
  const tenant = data?.object;

  return (
    <ResourceDetailsPage
      error={error}
      found={!!tenant}
      isLoading={isLoading}
      parentLabel={t('Tenants')}
      parentTo={TENANTS_LIST_PATH}
      refetch={refetch}
      resourceLabel={t('tenant')}
      cardCount={2}
    >
      {tenant ? (
        <>
          <PageSection hasBodyWrapper={false}>
            <Stack hasGutter>
              <StackItem>
                <Flex
                  justifyContent={{ default: 'justifyContentSpaceBetween' }}
                  alignItems={{ default: 'alignItemsFlexStart' }}
                  flexWrap={{ default: 'wrap' }}
                  spaceItems={{ default: 'spaceItemsMd' }}
                >
                  <FlexItem>
                    <ResourceDetailHeader
                      parentTo={TENANTS_LIST_PATH}
                      parentLabel={t('Tenants')}
                      resourceName={tenant.metadata?.name || tenant.id}
                      titleSize="3xl"
                      description={t('Tenant details for identity, domains, and platform setup.')}
                    />
                  </FlexItem>
                  <FlexItem>
                    <TenantActionsMenu tenant={tenant} showLabel />
                  </FlexItem>
                </Flex>
              </StackItem>
              <StackItem>
                <Divider />
              </StackItem>
            </Stack>
          </PageSection>
          <TenantDetailsContent tenant={tenant} />
        </>
      ) : null}
    </ResourceDetailsPage>
  );
};

export default TenantDetailsPage;
