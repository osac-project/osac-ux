/**
 * Renders one FormGroup per "dynamic" catalog field definition — either a brand-new
 * custom field a Tenant Admin authored, or a Template's own declared parameter
 * (template_parameters.*) that previously had no provisioning-time renderer at all.
 * Reused by the authoring page's default-value preview and all three provisioning wizards.
 */
import { Divider, FormGroup, FormHelperText, HelperText, HelperTextItem, Title } from '@patternfly/react-core';

import { DynamicFieldValueInput } from './DynamicFieldValueInput';
import { useTranslation } from '../../../hooks/useTranslation';
import OsacForm from '../../Form/OsacForm';
import { type CatalogFieldDefinition, isDynamicFieldPath } from '../catalogFieldDefinition';

export interface DynamicFieldsFormSectionProps {
  definitions: CatalogFieldDefinition[];
  values: Record<string, string>;
  onChange: (path: string, value: string) => void;
  /** Restrict which dynamic fields render here — defaults to both custom.* and template_parameters.*. */
  filter?: (def: CatalogFieldDefinition) => boolean;
  title?: string;
}

export const DynamicFieldsFormSection = ({
  definitions,
  values,
  onChange,
  filter = (def) => isDynamicFieldPath(def.path),
  title,
}: DynamicFieldsFormSectionProps) => {
  const { t } = useTranslation();
  const dynamicDefs = definitions.filter(filter);

  if (dynamicDefs.length === 0) {
    return null;
  }

  return (
    <>
      <Divider />
      <Title headingLevel="h3" size="md">
        {title ?? t('Custom fields')}
      </Title>
      <OsacForm>
        {dynamicDefs.map((def) => {
          const fieldId = `dynamic-field-${def.path}`;
          const helperId = `${fieldId}-helper`;
          return (
            <FormGroup
              key={def.path}
              label={def.displayName}
              fieldId={fieldId}
              isRequired={Boolean(def.required)}
            >
              <DynamicFieldValueInput
                def={def}
                value={values[def.path] ?? ''}
                onChange={(v) => onChange(def.path, v)}
                fieldId={fieldId}
                isDisabled={!def.editable}
              />
              {def.description && (
                <FormHelperText>
                  <HelperText id={helperId}>
                    <HelperTextItem>{def.description}</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
          );
        })}
      </OsacForm>
    </>
  );
};
