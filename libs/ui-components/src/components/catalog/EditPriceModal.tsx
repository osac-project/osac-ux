import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@patternfly/react-core';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

interface EditPriceModalProps {
  resourceName: string;
  currentPrice: string;
  onClose: () => void;
  onSave: (price: string) => Promise<void>;
  error?: unknown;
}

export function EditPriceModal({
  resourceName,
  currentPrice,
  onClose,
  onSave,
  error,
}: EditPriceModalProps) {
  const { t } = useTranslation();
  const [price, setPrice] = useState(currentPrice);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(price);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} variant="small" aria-labelledby="edit-price-modal-title">
      <ModalHeader
        title={t('Edit price — {{name}}', { name: resourceName })}
        labelId="edit-price-modal-title"
      />
      <ModalBody>
        {Boolean(error) && (
          <Alert
            variant="danger"
            isInline
            title={t('Failed to update price')}
            style={{ marginBottom: '1rem' }}
          >
            {error instanceof Error ? error.message : t('An error occurred')}
          </Alert>
        )}
        <Form>
          <FormGroup label={t('Price per hour (USD)')} isRequired fieldId="price-per-hour">
            <TextInput
              id="price-per-hour"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(_e, val) => setPrice(val)}
              placeholder="0.00"
              aria-label={t('Price per hour')}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            isDisabled={saving || !price}
          >
            {t('Save')}
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={saving}>
            {t('Cancel')}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
}
