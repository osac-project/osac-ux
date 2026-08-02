/**
 * CSP Admin create/edit UI for MaaS (AI Model) catalog items — the one kind
 * that keeps CSP authorship, since there is no Model Template resource for
 * a Tenant Admin to combine (see catalog authorship shift notes). Token rates
 * are declared as BillableComponents (input-tokens / output-tokens / cache-tokens,
 * unit 'token') rather than ad-hoc price_per_* labels — see REQ-BA-2.
 */
import { useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Split,
  SplitItem,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import type { BillableComponent } from '../../api/v1/billing-types';
import { useCreateMaaSCatalogItem, usePatchMaaSCatalogItem } from '../../api/v1/maas-catalog-item';
import type { ModelCatalogItem } from '../../api/v1/maas-types';
import { BILLABLE_COMPONENTS_KEY } from '../../api/v1/template-billing';
import { useTenants } from '../../api/v1/tenant';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import OsacForm from '../Form/OsacForm';

interface MaaSCatalogItemModalProps {
  onClose: () => void;
  onSuccess: () => void;
  /** When provided, the modal opens in edit mode pre-filled from this item. */
  editItem?: ModelCatalogItem;
}

const findRate = (components: BillableComponent[], meterKey: string): string =>
  components.find((c) => c.meterKey === meterKey)?.baseRate ?? '';

export const MaaSCatalogItemModal = ({
  onClose,
  onSuccess,
  editItem,
}: MaaSCatalogItemModalProps) => {
  const { t } = useTranslation();
  const isEditMode = Boolean(editItem);
  const existingComponents: BillableComponent[] = (() => {
    const raw = editItem?.metadata?.annotations?.[BILLABLE_COMPONENTS_KEY];
    if (!raw) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as BillableComponent[]) : [];
    } catch {
      return [];
    }
  })();

  const [title, setTitle] = useState(editItem?.title ?? '');
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [published, setPublished] = useState(editItem ? Boolean(editItem.published) : true);
  const [modelProvider, setModelProvider] = useState(
    editItem?.metadata?.labels?.['model_provider'] ?? '',
  );
  const [contextWindow, setContextWindow] = useState(
    editItem?.metadata?.labels?.['context_window'] ?? '',
  );
  const [inputRate, setInputRate] = useState(
    findRate(existingComponents, 'input-tokens') ||
      editItem?.metadata?.labels?.['price_per_input_token'] ||
      '',
  );
  const [outputRate, setOutputRate] = useState(
    findRate(existingComponents, 'output-tokens') ||
      editItem?.metadata?.labels?.['price_per_output_token'] ||
      '',
  );
  const [cacheRate, setCacheRate] = useState(findRate(existingComponents, 'cache-tokens'));

  const { data: tenants = [] } = useTenants();
  const [allowedTenants, setAllowedTenants] = useState<string[]>(editItem?.allowed_tenants ?? []);
  const toggleTenant = (id: string) =>
    setAllowedTenants((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const createMaas = useCreateMaaSCatalogItem();
  const patchMaas = usePatchMaaSCatalogItem();
  const isPending = createMaas.isPending || patchMaas.isPending;
  const mutationError = isEditMode ? patchMaas.error : createMaas.error;

  const buildBillableComponents = (): BillableComponent[] => {
    const components: BillableComponent[] = [];
    if (inputRate.trim()) {
      components.push({ meterKey: 'input-tokens', unit: 'token', baseRate: inputRate.trim() });
    }
    if (outputRate.trim()) {
      components.push({ meterKey: 'output-tokens', unit: 'token', baseRate: outputRate.trim() });
    }
    if (cacheRate.trim()) {
      components.push({ meterKey: 'cache-tokens', unit: 'token', baseRate: cacheRate.trim() });
    }
    return components;
  };

  const onSubmit = async () => {
    if (!title.trim()) {
      return;
    }
    const components = buildBillableComponents();
    const labels: Record<string, string> = {
      ...(modelProvider.trim() && { model_provider: modelProvider.trim() }),
      ...(contextWindow.trim() && { context_window: contextWindow.trim() }),
      workload: 'ai',
      // Legacy labels kept for backward-compat display until every reader
      // (dashboards, exports) migrates to the billable-components annotation.
      ...(inputRate.trim() && { price_per_input_token: inputRate.trim() }),
      ...(outputRate.trim() && { price_per_output_token: outputRate.trim() }),
    };
    const annotations: Record<string, string> = {
      ...(components.length > 0 && { [BILLABLE_COMPONENTS_KEY]: JSON.stringify(components) }),
    };

    if (isEditMode && editItem) {
      await patchMaas.mutateAsync({
        id: editItem.id,
        patch: {
          title: title.trim(),
          description: description.trim(),
          published,
          allowed_tenants: allowedTenants,
          metadata: { ...editItem.metadata, labels, annotations },
        } as never,
      });
    } else {
      await createMaas.mutateAsync({
        metadata: {
          name: title
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, ''),
          labels,
          annotations,
        },
        title: title.trim(),
        description: description.trim(),
        published,
        tenant: '',
        allowed_tenants: allowedTenants,
        field_definitions: [
          { path: 'application_name', display_name: 'Application name', editable: true },
          { path: 'token_quota_monthly', display_name: 'Monthly token quota', editable: true },
        ],
      } as never);
    }
    onSuccess();
  };

  return (
    <Modal
      variant="medium"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="maas-cci-title"
    >
      <ModalHeader
        title={
          isEditMode
            ? t('Edit AI model — {{title}}', { title: editItem?.title ?? '' })
            : t('Create AI model catalog item')
        }
        labelId="maas-cci-title"
      />
      <ModalBody>
        <OsacForm>
          <FormGroup label={t('Title')} fieldId="maas-cci-title-input" isRequired>
            <TextInput
              id="maas-cci-title-input"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder={t('Llama 3.1 70B')}
              isRequired
            />
          </FormGroup>

          <FormGroup label={t('Description')} fieldId="maas-cci-description">
            <TextArea
              id="maas-cci-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              rows={2}
            />
          </FormGroup>

          <FormGroup label={t('Model metadata')} fieldId="maas-cci-metadata">
            <Split hasGutter>
              <SplitItem>
                <TextInput
                  value={modelProvider}
                  onChange={(_e, v) => setModelProvider(v)}
                  placeholder={t('Provider (e.g. meta)')}
                  aria-label={t('Model provider')}
                />
              </SplitItem>
              <SplitItem>
                <TextInput
                  value={contextWindow}
                  onChange={(_e, v) => setContextWindow(v)}
                  placeholder={t('Context window (e.g. 128k)')}
                  aria-label={t('Context window')}
                />
              </SplitItem>
            </Split>
          </FormGroup>

          <FormGroup label={t('Token rates (BillableComponents)')} fieldId="maas-cci-rates">
            <Split hasGutter>
              <SplitItem>
                <TextInput
                  value={inputRate}
                  onChange={(_e, v) => setInputRate(v)}
                  placeholder={t('$/input token')}
                  aria-label={t('Price per input token')}
                  type="number"
                />
              </SplitItem>
              <SplitItem>
                <TextInput
                  value={outputRate}
                  onChange={(_e, v) => setOutputRate(v)}
                  placeholder={t('$/output token')}
                  aria-label={t('Price per output token')}
                  type="number"
                />
              </SplitItem>
              <SplitItem>
                <TextInput
                  value={cacheRate}
                  onChange={(_e, v) => setCacheRate(v)}
                  placeholder={t('$/cache token (optional)')}
                  aria-label={t('Price per cache token')}
                  type="number"
                />
              </SplitItem>
            </Split>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t(
                    'Stored as meterKey="input-tokens" / "output-tokens" / "cache-tokens" on the osac.io/billable-components annotation.',
                  )}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup fieldId="maas-cci-published">
            <Checkbox
              id="maas-cci-published"
              label={t('Published (visible to tenants)')}
              isChecked={published}
              onChange={(_e, v) => setPublished(v)}
            />
          </FormGroup>

          {tenants.length > 0 && (
            <FormGroup label={t('Restrict to specific tenants')} fieldId="maas-cci-tenants">
              {tenants.map((t) => (
                <Checkbox
                  key={t.id}
                  id={`maas-cci-tenant-${t.id}`}
                  label={t.metadata?.name ?? t.id}
                  isChecked={allowedTenants.includes(t.id)}
                  onChange={() => toggleTenant(t.id)}
                  style={{ marginBottom: 4 }}
                />
              ))}
              {allowedTenants.length > 0 && (
                <Button variant="link" isInline onClick={() => setAllowedTenants([])}>
                  {t('Clear (grant to all)')}
                </Button>
              )}
            </FormGroup>
          )}

          {mutationError && (
            <Alert
              variant="danger"
              title={
                isEditMode ? t('Failed to update catalog item') : t('Failed to create catalog item')
              }
              isInline
            >
              {getErrorMessage(mutationError)}
            </Alert>
          )}
        </OsacForm>
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={onClose} isDisabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
          isDisabled={isPending || !title.trim()}
          isLoading={isPending}
        >
          {isEditMode ? t('Save') : t('Create')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
