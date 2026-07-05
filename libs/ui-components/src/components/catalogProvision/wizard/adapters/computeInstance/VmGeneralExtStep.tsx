/**
 * Extended General step for VM creation.
 * Renders the standard name + SSH key fields plus:
 *   - Tags editor (metadata.labels) — proto-aligned
 *   - Project selector (@predicted — OSAC-1064)
 */
import { useState } from 'react';
import {
  Button,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  MenuToggle,
  Select,
  SelectOption,
  Stack,
  StackItem,
  TextInput,
  Title,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';
import { useFormikContext } from 'formik';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceWizardValues } from './fields';
import { buildVmGeneralFields } from './generalFields';
import { useProjects } from '../../../../../api/v1/project';
import { useTranslation } from '../../../../../hooks/useTranslation';
import { InputField } from '../../../../Form/InputField';
import OsacForm from '../../../../Form/OsacForm';

interface Props {
  catalogItem: ComputeInstanceCatalogItem | null;
}

// ---------------------------------------------------------------------------
// Tags editor
// ---------------------------------------------------------------------------

const TagsEditor = () => {
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const labels = values.metadata.labels;
  const entries = Object.entries(labels);

  const addTag = () => {
    // Find a unique placeholder key
    let idx = entries.length + 1;
    while (labels[`key${idx}`] !== undefined) {
      idx++;
    }
    void setFieldValue('metadata.labels', { ...labels, [`key${idx}`]: '' });
  };

  const removeTag = (key: string) => {
    const next = { ...labels };
    delete next[key];
    void setFieldValue('metadata.labels', next);
  };

  const changeKey = (oldKey: string, newKey: string) => {
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(labels)) {
      next[k === oldKey ? newKey : k] = v;
    }
    void setFieldValue('metadata.labels', next);
  };

  const changeValue = (key: string, val: string) => {
    void setFieldValue('metadata.labels', { ...labels, [key]: val });
  };

  return (
    <FormGroup label="Tags" fieldId="vm-tags">
      <Stack hasGutter>
        {entries.map(([key, value]) => (
          <StackItem key={key}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <TextInput
                id={`vm-tag-key-${key}`}
                value={key}
                onChange={(_e, v) => changeKey(key, v)}
                placeholder="Key"
                aria-label="Tag key"
                style={{ flex: 1 }}
              />
              <TextInput
                id={`vm-tag-val-${key}`}
                value={value}
                onChange={(_e, v) => changeValue(key, v)}
                placeholder="Value"
                aria-label="Tag value"
                style={{ flex: 1 }}
              />
              <Button variant="plain" onClick={() => removeTag(key)} aria-label="Remove tag">
                ✕
              </Button>
            </div>
          </StackItem>
        ))}
        <StackItem>
          <Button variant="link" isInline onClick={addTag}>
            + Add tag
          </Button>
        </StackItem>
      </Stack>
      <FormHelperText>
        <HelperText>
          <HelperTextItem>Tags are stored as metadata labels on the resource.</HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

// ---------------------------------------------------------------------------
// Project selector (@predicted — OSAC-1064)
// ---------------------------------------------------------------------------

const ProjectSelector = () => {
  const { values, setFieldValue } = useFormikContext<ComputeInstanceWizardValues>();
  const [open, setOpen] = useState(false);
  const { data: projects = [], isLoading } = useProjects();

  const selected = projects.find((p) => p.id === values.spec.projectId);
  const toggleLabel = isLoading
    ? 'Loading…'
    : selected
      ? (selected.spec?.title ?? selected.metadata?.name ?? selected.id)
      : 'No project (optional)';

  return (
    <FormGroup label="Project" fieldId="vm-project">
      <Label variant="outline" color="blue" isCompact style={{ marginBottom: '0.25rem' }}>
        predicted
      </Label>
      <Select
        isOpen={open}
        selected={values.spec.projectId ?? ''}
        onSelect={(_, value) => {
          void setFieldValue('spec.projectId', value === '' ? '' : (value as string));
          setOpen(false);
        }}
        onOpenChange={setOpen}
        toggle={(ref: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={ref}
            onClick={() => setOpen((o) => !o)}
            isExpanded={open}
            isDisabled={isLoading}
            style={{ width: '100%' }}
          >
            {toggleLabel}
          </MenuToggle>
        )}
      >
        <SelectOption value="">No project (optional)</SelectOption>
        {projects.map((p) => (
          <SelectOption key={p.id} value={p.id}>
            {p.spec?.title ?? p.metadata?.name ?? p.id}
          </SelectOption>
        ))}
      </Select>
      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            Assign this VM to a project for access control and organization. (Field OSAC-1064 —
            predicted)
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

// ---------------------------------------------------------------------------
// VmGeneralExtStep
// ---------------------------------------------------------------------------

export const VmGeneralExtStep = ({ catalogItem }: Props) => {
  const { t } = useTranslation();
  const fields = buildVmGeneralFields(catalogItem, t);

  return (
    <Stack hasGutter>
      <StackItem>
        <OsacForm>
          {fields.map((field) => (
            <InputField
              key={field.name}
              name={field.name}
              label={field.label ?? t(field.labelKey)}
              fieldId={field.name.replace(/\./g, '-')}
              isRequired={field.isRequired}
              isDisabled={field.isDisabled}
              multiline={field.multiline}
              rows={field.multiline ? 4 : undefined}
              type={field.isPassword ? 'password' : 'text'}
            />
          ))}
        </OsacForm>
      </StackItem>
      <StackItem>
        <Title headingLevel="h3" size="md" style={{ marginBottom: '0.5rem' }}>
          Organization
        </Title>
        <OsacForm>
          <ProjectSelector />
          <TagsEditor />
        </OsacForm>
      </StackItem>
    </Stack>
  );
};
