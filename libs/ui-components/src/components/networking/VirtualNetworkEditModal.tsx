// MISSING: VirtualNetworks Update RPC not yet in the public proto — shape predicted from VirtualNetworkCreateModal + standard OSAC update pattern
import { useMemo } from 'react';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import * as Yup from 'yup';

import type { VirtualNetwork } from '@osac/types';

import { useUpdateVirtualNetwork } from '../../api/v1/networking';
import { InputField } from '../Form/InputField';
import OsacForm from '../Form/OsacForm';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

type VirtualNetworkEditFormValues = {
  metadata: {
    name: string;
    description: string;
  };
};

interface VirtualNetworkEditModalProps {
  virtualNetwork: VirtualNetwork;
  onClose: () => void;
}

export const VirtualNetworkEditModal = ({
  virtualNetwork,
  onClose,
}: VirtualNetworkEditModalProps) => {
  const { t } = useTranslation();
  const { mutateAsync: update, error } = useUpdateVirtualNetwork();

  const validationSchema = useMemo(
    () =>
      Yup.object({
        metadata: Yup.object({
          name: Yup.string().required(t('Name is required')),
        }),
      }),
    [t],
  );

  return (
    <Formik<VirtualNetworkEditFormValues>
      initialValues={{
        metadata: {
          name: virtualNetwork.metadata?.name ?? '',
          description: virtualNetwork.metadata?.description ?? '',
        },
      }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        try {
          await update({
            id: virtualNetwork.id,
            input: {
              metadata: {
                ...virtualNetwork.metadata,
                name: values.metadata.name,
                description: values.metadata.description,
              },
              spec: virtualNetwork.spec,
            },
          });
          onClose();
        } catch {
          // tanstack handles the error
        }
      }}
    >
      {({ submitForm, isSubmitting }) => (
        <Modal
          variant="small"
          isOpen
          onClose={isSubmitting ? undefined : onClose}
          aria-labelledby="vn-edit-modal-title"
        >
          <ModalHeader title={t('Edit virtual network')} labelId="vn-edit-modal-title" />
          <ModalBody>
            <Stack hasGutter>
              <StackItem>
                <OsacForm>
                  <InputField
                    name="metadata.name"
                    label={t('Name')}
                    fieldId="vn-edit-name"
                  />
                  <InputField
                    name="metadata.description"
                    label={t('Description')}
                    fieldId="vn-edit-description"
                  />
                </OsacForm>
              </StackItem>
              {!!error && (
                <StackItem>
                  <Alert variant="danger" title={t('Failed to update virtual network')} isInline>
                    {getErrorMessage(error)}
                  </Alert>
                </StackItem>
              )}
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={submitForm} isDisabled={isSubmitting} isLoading={isSubmitting}>
              {t('Save')}
            </Button>
            <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
              {t('Cancel')}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </Formik>
  );
};
