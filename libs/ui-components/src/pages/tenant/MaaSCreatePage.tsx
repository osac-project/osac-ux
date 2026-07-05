/**
 * flow: maas-create
 * route: /models/create/:catalogItemId? (tenantUser, tenantAdmin)
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  NumberInput,
  PageBreadcrumb,
  PageSection,
  Skeleton,
  Stack,
  StackItem,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useMaaSCatalogItem } from '@osac/ui-components/api/v1/maas-catalog-item';
import { useProvisionModelAccess } from '@osac/ui-components/api/v1/maas-instance';
import { getErrorMessage } from '@osac/ui-components/utils/error';

const DEFAULT_QUOTA = 1_000_000;
const MIN_QUOTA = 100_000;
const MAX_QUOTA = 50_000_000;

export const MaaSCreatePage = () => {
  const { catalogItemId } = useParams<{ catalogItemId?: string }>();
  const navigate = useNavigate();

  const [applicationName, setApplicationName] = useState('');
  const [tokenQuota, setTokenQuota] = useState<number>(DEFAULT_QUOTA);

  const { data: catalogItem, isLoading: catalogLoading } = useMaaSCatalogItem(catalogItemId);
  const { mutateAsync, isPending, error } = useProvisionModelAccess();

  const quotaFieldDef = catalogItem?.field_definitions?.find(
    (f) => f.path === 'token_quota_monthly',
  );
  const showQuota = quotaFieldDef?.editable !== false;

  const isValid = applicationName.trim().length > 0 && !!catalogItemId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !catalogItemId) {
      return;
    }
    const access = await mutateAsync({
      spec: {
        catalogItem: catalogItemId,
        applicationName: applicationName.trim(),
        tokenQuotaMonthly: showQuota ? tokenQuota : undefined,
      },
    });
    // Navigate to the detail page if we have an id, otherwise fall back to list
    const newId = (access as { id?: string } | undefined)?.id;
    navigate(newId ? `/models/${newId}` : '/models');
  };

  const modelProvider = catalogItem?.metadata?.labels?.['model_provider'];
  const contextWindow = catalogItem?.metadata?.labels?.['context_window'];
  const priceInput = catalogItem?.metadata?.labels?.['price_per_input_token'];
  const priceOutput = catalogItem?.metadata?.labels?.['price_per_output_token'];

  const priceDisplay =
    priceInput && priceOutput
      ? `$${(parseFloat(priceInput) * 1_000_000).toFixed(2)} / $${(parseFloat(priceOutput) * 1_000_000).toFixed(2)} per 1M tokens (in/out)`
      : priceInput
        ? `$${(parseFloat(priceInput) * 1_000_000).toFixed(2)} per 1M input tokens`
        : undefined;

  return (
    <>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem onClick={() => navigate('/catalog')} style={{ cursor: 'pointer' }}>
            Catalog
          </BreadcrumbItem>
          <BreadcrumbItem onClick={() => navigate('/models')} style={{ cursor: 'pointer' }}>
            AI Models
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Request model access</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <Title headingLevel="h1">Request model access</Title>
          </StackItem>

          {catalogItemId && (
            <StackItem>
              <Card isFlat isCompact>
                <CardBody>
                  {catalogLoading ? (
                    <Skeleton width="300px" screenreaderText="Loading catalog item" />
                  ) : catalogItem ? (
                    <DescriptionList isHorizontal isCompact>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Model</DescriptionListTerm>
                        <DescriptionListDescription>
                          <strong>{catalogItem.title}</strong>
                          {catalogItem.description && (
                            <span
                              style={{
                                marginLeft: '0.5rem',
                                color: 'var(--pf-t--global--color--200)',
                              }}
                            >
                              — {catalogItem.description}
                            </span>
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      {modelProvider && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Provider</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label isCompact color="grey">
                              {modelProvider}
                            </Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      {contextWindow && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Context window</DescriptionListTerm>
                          <DescriptionListDescription>{contextWindow}</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                      {priceDisplay && (
                        <DescriptionListGroup>
                          <DescriptionListTerm>Pricing</DescriptionListTerm>
                          <DescriptionListDescription>{priceDisplay}</DescriptionListDescription>
                        </DescriptionListGroup>
                      )}
                    </DescriptionList>
                  ) : (
                    <Alert
                      variant="warning"
                      isInline
                      title={`Catalog item not found: ${catalogItemId}`}
                    />
                  )}
                </CardBody>
              </Card>
            </StackItem>
          )}

          {!catalogItemId && (
            <StackItem>
              <Alert variant="warning" isInline title="No model selected">
                Navigate here from the{' '}
                <Button variant="link" isInline onClick={() => navigate('/catalog')}>
                  Catalog page
                </Button>{' '}
                to pre-select a model.
              </Alert>
            </StackItem>
          )}

          {error && (
            <StackItem>
              <Alert variant="danger" isInline title="Failed to provision model access">
                {getErrorMessage(error)}
              </Alert>
            </StackItem>
          )}

          <StackItem>
            <Card>
              <CardBody>
                <Form onSubmit={handleSubmit} id="maas-create-form">
                  <FormGroup label="Application name" isRequired fieldId="maas-app-name">
                    <TextInput
                      id="maas-app-name"
                      value={applicationName}
                      onChange={(_e, v) => setApplicationName(v)}
                      placeholder="my-rag-pipeline"
                      isRequired
                    />
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem>
                          Identifies the application that will consume this model endpoint.
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FormGroup>

                  {showQuota && (
                    <FormGroup label="Monthly token quota" fieldId="maas-quota">
                      <NumberInput
                        id="maas-quota"
                        value={tokenQuota}
                        onMinus={() => setTokenQuota((q) => Math.max(MIN_QUOTA, q - 100_000))}
                        onPlus={() => setTokenQuota((q) => Math.min(MAX_QUOTA, q + 100_000))}
                        onChange={(e) => {
                          const v = parseInt((e.target as HTMLInputElement).value, 10);
                          if (!isNaN(v)) {
                            setTokenQuota(Math.min(MAX_QUOTA, Math.max(MIN_QUOTA, v)));
                          }
                        }}
                        min={MIN_QUOTA}
                        max={MAX_QUOTA}
                      />
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem>
                            Maximum tokens (input + output) per calendar month. Range:{' '}
                            {MIN_QUOTA.toLocaleString()} – {MAX_QUOTA.toLocaleString()}.
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    </FormGroup>
                  )}

                  <ActionGroup>
                    <Button
                      variant="primary"
                      type="submit"
                      form="maas-create-form"
                      isLoading={isPending}
                      isDisabled={isPending || !isValid}
                    >
                      Request access
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => navigate('/models')}
                      isDisabled={isPending}
                    >
                      Cancel
                    </Button>
                  </ActionGroup>
                </Form>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
