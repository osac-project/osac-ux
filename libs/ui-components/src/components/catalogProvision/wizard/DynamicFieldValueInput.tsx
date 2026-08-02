/**
 * Renders the appropriate control for one CatalogFieldDefinition — a plain, controlled
 * input usable both inside Formik (VM) and plain useState wizards (Cluster, Bare Metal,
 * and the TenantCombineTemplatePage authoring form).
 */
import { useMemo } from 'react';
import { Checkbox, FormSelect, FormSelectOption, TextArea, TextInput } from '@patternfly/react-core';

import type { ApiRoute } from '../../../api/types';
import { useApiQuery } from '../../../api/use-api-query';
import { resourceDisplayName } from '../../../api/v1/networking';
import { useTranslation } from '../../../hooks/useTranslation';
import type { CatalogFieldDefinition } from '../catalogFieldDefinition';

interface DynamicFieldApiOption {
  value: string;
  label: string;
}

/** Best-effort normalization of a `.items`-shaped (or bare-array) API list response. */
const useDynamicFieldApiOptions = (
  apiPath: string | undefined,
): { options: DynamicFieldApiOption[]; isLoading: boolean } => {
  const enabled = Boolean(apiPath);
  const { data, isPending } = useApiQuery<unknown>({
    queryKey: [(apiPath || 'v1/instance_types') as ApiRoute, null],
    enabled,
  });

  const options = useMemo<DynamicFieldApiOption[]>(() => {
    if (!data) {
      return [];
    }
    const items = Array.isArray(data)
      ? data
      : Array.isArray((data as { items?: unknown[] }).items)
        ? ((data as { items: unknown[] }).items ?? [])
        : [];
    return items
      .map((item): DynamicFieldApiOption | null => {
        const record = (item ?? {}) as Record<string, unknown>;
        const id = typeof record.id === 'string' ? record.id : '';
        const metadata = record.metadata as { name?: string } | undefined;
        const value = id || metadata?.name || '';
        if (!value) {
          return null;
        }
        const title = typeof record.title === 'string' ? record.title : undefined;
        return { value, label: title || resourceDisplayName(metadata, value) };
      })
      .filter((o): o is DynamicFieldApiOption => o !== null);
  }, [data]);

  return { options, isLoading: enabled && isPending };
};

/** Heuristic for which freeform fields should render as a multi-line TextArea. */
const isMultilineDynamicField = (path: string): boolean =>
  path.includes('ssh') || path.includes('pull_secret') || path.includes('user_data');

export interface DynamicFieldValueInputProps {
  def: CatalogFieldDefinition;
  value: string;
  onChange: (value: string) => void;
  fieldId: string;
  isDisabled?: boolean;
}

export const DynamicFieldValueInput = ({
  def,
  value,
  onChange,
  fieldId,
  isDisabled = false,
}: DynamicFieldValueInputProps) => {
  const { t } = useTranslation();
  const { options, isLoading } = useDynamicFieldApiOptions(def.sourceApiPath);

  if (def.sourceApiPath) {
    const placeholder = isLoading ? t('catalogProvision.common.loading') : t('Select a value');
    return (
      <FormSelect
        id={fieldId}
        value={value}
        onChange={(_e, v) => onChange(v)}
        isDisabled={isDisabled || isLoading}
        aria-busy={isLoading || undefined}
      >
        <FormSelectOption key="" value="" label={placeholder} isPlaceholder isDisabled={!value} />
        {options.map((option) => (
          <FormSelectOption key={option.value} value={option.value} label={option.label} />
        ))}
      </FormSelect>
    );
  }

  const schemaType =
    typeof def.validationSchema?.type === 'string' ? def.validationSchema.type : undefined;

  if (schemaType === 'boolean') {
    return (
      <Checkbox
        id={fieldId}
        label={def.displayName}
        isChecked={value === 'true'}
        onChange={(_e, checked) => onChange(String(checked))}
        isDisabled={isDisabled}
      />
    );
  }

  if (isMultilineDynamicField(def.path)) {
    return (
      <TextArea
        id={fieldId}
        value={value}
        onChange={(_e, v) => onChange(v)}
        rows={3}
        isDisabled={isDisabled}
      />
    );
  }

  const isNumeric = schemaType === 'integer' || schemaType === 'number';
  return (
    <TextInput
      id={fieldId}
      type={isNumeric ? 'number' : 'text'}
      value={value}
      onChange={(_e, v) => onChange(v)}
      isDisabled={isDisabled}
    />
  );
};
