// [PREDICTED API] PATCH /api/fulfillment/v1/compute_instances/{id}
// additionalDisks mutation on a running VM is not yet documented.
// The spec field exists; live-attach behavior depends on backend readiness.

import { useState } from 'react';
import {
  Alert,
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import * as Yup from 'yup';

import type { ComputeInstance } from '@osac/types';
import { StorageProtocol } from '@osac/types';
import { useMutation } from '@tanstack/react-query';

import { useTranslation } from '../../../hooks/useTranslation';
import { StorageTierSelectField } from '../../Form/StorageTierSelectField';
import NumberField from '../../Form/NumberField';
import { InputField } from '../../Form/InputField';
import OsacForm from '../../Form/OsacForm';
import { useApiFetch } from '../../../api/api-context';
import { ComputeInstances } from '@osac/types';
import { buildUpdateMaskPaths } from '../../../api/v1/update-mask';
import { useApiQueryClient } from '../../../api/use-api-query';
import { invalidateComputeInstancesQueries } from '../../../api/v1/compute-instance';
import { getErrorMessage } from '../../../utils/error';

interface AddDiskModalProps {
  vm: ComputeInstance;
  isOpen: boolean;
  onClose: () => void;
}

interface AddDiskFormValues {
  name: string;
  sizeGib: number | '';
  storageTier: string;
}

const getAddDiskSchema = (t: (key: string) => string) =>
  Yup.object({
    name: Yup.string(),
    sizeGib: Yup.number()
      .required(t('Size is required'))
      .positive(t('Size must be positive'))
      .integer(t('Size must be an integer'))
      .min(1, t('Minimum size is 1 GiB')),
    storageTier: Yup.string().required(t('Storage tier is required')),
  });

export const AddDiskModal = ({ vm, isOpen, onClose }: AddDiskModalProps) => {
  const { t } = useTranslation();
  const client = useApiFetch(ComputeInstances);
  const qc = useApiQueryClient();

  const addDiskMutation = useMutation({
    mutationFn: async (values: AddDiskFormValues) => {
      const currentDisks = vm.spec?.additionalDisks ?? [];
      const newDisk = {
        name: values.name || `disk-${currentDisks.length + 1}`,
        sizeGib: BigInt(values.sizeGib as number),
        storageTier: values.storageTier,
      };

      const response = await client.update({
        object: {
          id: vm.id,
          spec: {
            additionalDisks: [...currentDisks, newDisk],
          },
        },
        updateMask: { paths: ['spec.additional_disks'] },
      });

      return response.object;
    },
    onSuccess: () => {
      invalidateComputeInstancesQueries(qc);
      onClose();
    },
  });

  const initialValues: AddDiskFormValues = {
    name: '',
    sizeGib: 10,
    storageTier: '',
  };

  return (
    <Modal
      variant={ModalVariant.small}
      title={t('Add disk')}
      isOpen={isOpen}
      onClose={onClose}
      aria-label={t('Add disk')}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={getAddDiskSchema(t)}
        onSubmit={(values) => addDiskMutation.mutate(values)}
      >
        {({ submitForm, isSubmitting }) => (
          <>
            <ModalHeader title={t('Add disk')} />
            <ModalBody>
              <Stack hasGutter>
                <Alert variant="warning" isInline title={t('Predicted feature')}>
                  {t(
                    'This is a predicted feature. Disk provisioning may not reflect immediately depending on backend readiness.',
                  )}
                </Alert>

                <OsacForm>
                  <InputField
                    name="name"
                    label={t('Disk name')}
                    fieldId="disk-name"
                    helperText={t('Optional. If blank, a name will be generated automatically.')}
                  />

                  <NumberField
                    name="sizeGib"
                    label={t('Size (GiB)')}
                    fieldId="disk-size"
                    isRequired
                    min={1}
                    step={1}
                  />

                  <StorageTierSelectField
                    name="storageTier"
                    label={t('Storage tier')}
                    fieldId="disk-tier"
                    isRequired
                    protocol={StorageProtocol.BLOCK}
                  />
                </OsacForm>

                {addDiskMutation.error && (
                  <Alert variant="danger" isInline title={t('Failed to add disk')}>
                    {getErrorMessage(addDiskMutation.error)}
                  </Alert>
                )}
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="primary"
                onClick={submitForm}
                isDisabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {t('Add')}
              </Button>
              <Button variant="link" onClick={onClose} isDisabled={isSubmitting}>
                {t('Cancel')}
              </Button>
            </ModalFooter>
          </>
        )}
      </Formik>
    </Modal>
  );
};

export default AddDiskModal;
