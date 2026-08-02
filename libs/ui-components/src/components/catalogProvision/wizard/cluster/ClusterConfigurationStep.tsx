import {
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  Skeleton,
  Spinner,
  Stack,
  StackItem,
  TextInput,
  Title,
} from '@patternfly/react-core';

import type { ClusterCatalogItem, ClusterTemplate } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { isAiGridTemplate } from '../../../../api/v1/cluster-templates';
import { useTranslation } from '../../../../hooks/useTranslation';
import OsacForm from '../../../Form/OsacForm';
import { isCustomFieldPath } from '../../catalogFieldDefinition';
import { readCatalogFieldDefinitions } from '../catalogOverlay';
import { DynamicFieldsFormSection } from '../DynamicFieldsFormSection';

interface Props {
  values: ClusterWizardValues;
  onChange: <K extends keyof ClusterWizardValues>(field: K, value: ClusterWizardValues[K]) => void;
  template: ClusterTemplate | undefined;
  templateLoading: boolean;
  catalogItem: ClusterCatalogItem | null;
}

const isNumericType = (type: string): boolean =>
  type.includes('Int32Value') ||
  type.includes('Int64Value') ||
  type.includes('FloatValue') ||
  type.includes('DoubleValue');

export const ClusterConfigurationStep = ({
  values,
  onChange,
  template,
  templateLoading,
  catalogItem,
}: Props) => {
  const { t } = useTranslation();
  const nodeSets = Object.entries(template?.nodeSets ?? {});
  const isAiGrid = template ? isAiGridTemplate(template) : false;
  const definitions = readCatalogFieldDefinitions(catalogItem);

  const handleParameterChange = (name: string, value: string) => {
    onChange('templateParameters', { ...values.templateParameters, [name]: value });
  };

  const handleCustomFieldChange = (path: string, value: string) => {
    onChange('customParameters', { ...values.customParameters, [path]: value });
  };

  return (
    <Stack hasGutter>
      {/* ── Node sets (read-only) ─────────────────────────────── */}
      {(templateLoading || nodeSets.length > 0) && (
        <StackItem>
          <Stack hasGutter>
            <StackItem>
              <Title headingLevel="h3" size="md">
                {t('catalogProvision.cluster.fields.nodeSets')}
              </Title>
              <Content component="small" className="pf-v6-u-color-text-subtle">
                {t('catalogProvision.cluster.configuration.nodeSetsDescription')}
              </Content>
            </StackItem>
            <StackItem>
              {templateLoading ? (
                <Skeleton
                  width="300px"
                  screenreaderText={t('catalogProvision.cluster.configuration.loadingTemplate')}
                />
              ) : (
                <DescriptionList isHorizontal isCompact>
                  {nodeSets.map(([name, ns]) => (
                    <DescriptionListGroup key={name}>
                      <DescriptionListTerm>{name}</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Flex
                          gap={{ default: 'gapSm' }}
                          alignItems={{ default: 'alignItemsCenter' }}
                        >
                          <FlexItem>
                            <Label isCompact variant="outline" color={isAiGrid ? 'orange' : 'blue'}>
                              {ns.hostType}
                            </Label>
                          </FlexItem>
                          <FlexItem>
                            <Content component="small">
                              ×{' '}
                              {t('catalogProvision.cluster.configuration.nodeCount', {
                                count: ns.size,
                              })}
                            </Content>
                          </FlexItem>
                        </Flex>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  ))}
                </DescriptionList>
              )}
            </StackItem>
          </Stack>
        </StackItem>
      )}

      {nodeSets.length > 0 && (template?.parameters ?? []).length > 0 && (
        <StackItem>
          <Divider />
        </StackItem>
      )}

      {/* ── Dynamic template parameters ──────────────────────── */}
      {templateLoading ? (
        <StackItem>
          <Spinner
            size="sm"
            aria-label={t('catalogProvision.cluster.configuration.loadingParameters')}
          />
        </StackItem>
      ) : (
        (template?.parameters ?? []).length > 0 && (
          <StackItem>
            <Stack hasGutter>
              <StackItem>
                <Title headingLevel="h3" size="md">
                  {t('catalogProvision.cluster.configuration.parameters')}
                </Title>
              </StackItem>
              <StackItem>
                <OsacForm>
                  {(template?.parameters ?? []).map((param) => (
                    <FormGroup
                      key={param.name}
                      label={param.title || param.name}
                      isRequired={param.required}
                      fieldId={`param-${param.name}`}
                    >
                      <TextInput
                        id={`param-${param.name}`}
                        type={isNumericType(param.type) ? 'number' : 'text'}
                        value={values.templateParameters[param.name] ?? ''}
                        onChange={(_e, v) => handleParameterChange(param.name, v)}
                        placeholder={isNumericType(param.type) ? '0' : ''}
                        aria-describedby={
                          param.description ? `param-${param.name}-helper` : undefined
                        }
                      />
                      {param.description && (
                        <FormHelperText>
                          <HelperText id={`param-${param.name}-helper`}>
                            <HelperTextItem>{param.description}</HelperTextItem>
                          </HelperText>
                        </FormHelperText>
                      )}
                    </FormGroup>
                  ))}
                </OsacForm>
              </StackItem>
            </Stack>
          </StackItem>
        )
      )}

      {/* ── Release image override ────────────────────────────── */}
      <StackItem>
        <Divider />
      </StackItem>
      <StackItem>
        <OsacForm>
          <FormGroup
            label={t('catalogProvision.cluster.fields.releaseImage')}
            fieldId="cluster-release-image"
          >
            <TextInput
              id="cluster-release-image"
              value={values.releaseImage}
              onChange={(_e, v) => onChange('releaseImage', v)}
              placeholder={
                template?.specDefaults?.releaseImage ||
                'quay.io/openshift-release-dev/ocp-release:4.17.0-x86_64'
              }
              aria-describedby="cluster-release-image-helper"
            />
            <FormHelperText>
              <HelperText id="cluster-release-image-helper">
                <HelperTextItem>
                  {t('catalogProvision.cluster.fields.releaseImageHelper')}
                  {template?.specDefaults?.releaseImage && (
                    <>
                      {' '}
                      {t('catalogProvision.cluster.fields.releaseImageTemplateDefault')}{' '}
                      <code>{template.specDefaults.releaseImage}</code>
                    </>
                  )}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </OsacForm>
      </StackItem>

      <StackItem>
        <DynamicFieldsFormSection
          definitions={definitions}
          values={values.customParameters}
          onChange={handleCustomFieldChange}
          filter={(def) => isCustomFieldPath(def.path)}
        />
      </StackItem>
    </Stack>
  );
};
