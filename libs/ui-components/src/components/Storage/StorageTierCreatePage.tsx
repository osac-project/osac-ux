import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  FormFieldGroup,
  FormFieldGroupHeader,
  PageSection,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import MinusCircleIcon from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, Formik } from 'formik';
import type { TFunction } from 'i18next';
import * as Yup from 'yup';

import type { StorageTier } from '@osac/types/private';
import { StorageProtocol } from '@osac/types/private';

import {
  STORAGE_BACKEND_READY_LIST_FILTER,
  usePrivateStorageBackend,
  usePrivateStorageBackends,
} from '../../api/v1/private/storage-backends';
import {
  useCreateStorageTier,
  usePrivateStorageTier,
  useUpdateStorageTier,
} from '../../api/v1/private/storage-tiers';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import { resourceNameSchema } from '../../validation/resource-name';
import NameField from '../catalogProvision/wizard/fields/NameField';
import { CheckboxField } from '../Form/CheckboxField';
import { InputField } from '../Form/InputField';
import LeaveFormConfirmation from '../Form/LeaveFormConfirmation';
import NumberField from '../Form/NumberField';
import OsacForm from '../Form/OsacForm';
import { RadioButtonField } from '../Form/RadioButtonField';
import { SelectField, type SelectFieldOption } from '../Form/SelectField';
import ListPageBody from '../Page/ListPageBody';

const TIERS_LIST_PATH = '/admin/infrastructure/storage/tiers';

const PROTOCOL_BY_VALUE: Record<'NFS' | 'BLOCK', StorageProtocol> = {
  NFS: StorageProtocol.NFS,
  BLOCK: StorageProtocol.BLOCK,
};

const VALUE_BY_PROTOCOL: Partial<Record<StorageProtocol, 'NFS' | 'BLOCK'>> = {
  [StorageProtocol.NFS]: 'NFS',
  [StorageProtocol.BLOCK]: 'BLOCK',
};

interface BackendAssociation {
  backendId: string;
  maxReadBandwidthMbs: number | '';
  maxWriteBandwidthMbs: number | '';
  encryptionEnabled: boolean;
}

interface StorageTierFormValues {
  metadata: { name: string };
  description: string;
  backends: BackendAssociation[];
  protocol: '' | 'NFS' | 'BLOCK';
}

const emptyBackendAssociation = (): BackendAssociation => ({
  backendId: '',
  maxReadBandwidthMbs: '',
  maxWriteBandwidthMbs: '',
  encryptionEnabled: false,
});

const getInitialValues = (tier?: StorageTier): StorageTierFormValues => {
  const backends =
    tier?.spec?.backends?.map((b) => ({
      backendId: b.backendId ?? '',
      maxReadBandwidthMbs: b.maxReadBandwidthMbs ?? '',
      maxWriteBandwidthMbs: b.maxWriteBandwidthMbs ?? '',
      encryptionEnabled: b.encryptionEnabled ?? false,
    })) ?? [];

  return {
    metadata: { name: tier?.metadata?.name ?? '' },
    description: tier?.spec?.description ?? '',
    backends: backends.length > 0 ? backends : [emptyBackendAssociation()],
    protocol: tier?.spec ? (VALUE_BY_PROTOCOL[tier.spec.protocol] ?? '') : '',
  };
};

const getStorageTierSchema = (t: TFunction) =>
  Yup.object({
    metadata: Yup.object({ name: resourceNameSchema(t) }),
    description: Yup.string(),
    backends: Yup.array()
      .of(
        Yup.object({
          backendId: Yup.string().required(t('Backend is required')),
          maxReadBandwidthMbs: Yup.number()
            .nullable()
            .transform((value, originalValue) => (originalValue === '' ? null : value))
            .positive(t('Must be a positive number'))
            .integer(t('Must be an integer')),
          maxWriteBandwidthMbs: Yup.number()
            .nullable()
            .transform((value, originalValue) => (originalValue === '' ? null : value))
            .positive(t('Must be a positive number'))
            .integer(t('Must be an integer')),
          encryptionEnabled: Yup.boolean().required(),
        }),
      )
      .min(1, t('At least one backend is required')),
    protocol: Yup.string()
      .oneOf(['NFS', 'BLOCK'], t('Protocol is required'))
      .required(t('Protocol is required')),
  });

interface StorageTierFormProps {
  tier?: StorageTier;
  backendOptions: SelectFieldOption[];
  backendsLoading: boolean;
}

const StorageTierForm = ({ tier, backendOptions, backendsLoading }: StorageTierFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isEdit = !!tier;

  const { mutateAsync: create, error: createError } = useCreateStorageTier();
  const { mutateAsync: update, error: updateError } = useUpdateStorageTier();
  const error = isEdit ? updateError : createError;

  const initialValues = getInitialValues(tier);

  const onSubmit = async (values: StorageTierFormValues) => {
    try {
      const protocol = PROTOCOL_BY_VALUE[values.protocol as 'NFS' | 'BLOCK'];
      const backendsPayload = values.backends.map((b) => ({
        backendId: b.backendId,
        ...(b.maxReadBandwidthMbs !== '' && { maxReadBandwidthMbs: Number(b.maxReadBandwidthMbs) }),
        ...(b.maxWriteBandwidthMbs !== '' && {
          maxWriteBandwidthMbs: Number(b.maxWriteBandwidthMbs),
        }),
        encryptionEnabled: b.encryptionEnabled,
      }));

      if (tier) {
        const descriptionChanged = values.description !== initialValues.description;
        const spec: {
          protocol: StorageProtocol;
          backends: typeof backendsPayload;
          description?: string;
        } = {
          protocol,
          backends: backendsPayload,
        };
        if (descriptionChanged) {
          spec.description = values.description;
        }
        await update({ id: tier.id, metadata: { version: tier.metadata?.version ?? 0 }, spec });
        navigate(TIERS_LIST_PATH);
      } else {
        const created = await create({
          metadata: values.metadata,
          spec: {
            description: values.description,
            protocol,
            backends: backendsPayload,
          },
        });
        navigate(`${TIERS_LIST_PATH}/${created.id}`);
      }
    } catch {
      // Surfaced via the mutation's own `error` state below; nothing further to do here.
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(TIERS_LIST_PATH)}>
                {t('Storage tiers')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{isEdit ? t('Edit') : t('Create')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {isEdit ? t('Edit storage tier') : t('Create storage tier')}
          </Title>
        </Stack>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <Formik
          initialValues={initialValues}
          validationSchema={getStorageTierSchema(t)}
          onSubmit={onSubmit}
        >
          {({ values, submitForm, isSubmitting }) => {
            const qosChanged = isEdit && values.protocol !== initialValues.protocol;

            return (
              <Stack hasGutter>
                <LeaveFormConfirmation />
                <StackItem>
                  <OsacForm>
                    <NameField isDisabled={isEdit} />
                    <InputField
                      name="description"
                      label={t('Description')}
                      fieldId="tier-description"
                    />
                    <RadioButtonField
                      name="protocol"
                      label={t('Protocol')}
                      fieldId="tier-protocol"
                      isRequired
                      isInline
                      options={[
                        { value: 'NFS', label: t('NFS') },
                        { value: 'BLOCK', label: t('Block') },
                      ]}
                    />

                    <FieldArray name="backends">
                      {(helpers) => (
                        <Stack hasGutter>
                          {values.backends.length === 0 && (
                            <StackItem>{t('No backends added.')}</StackItem>
                          )}
                          {values.backends.map((_, index) => (
                            <StackItem key={index}>
                              <FormFieldGroup
                                header={
                                  <FormFieldGroupHeader
                                    titleText={{
                                      text: t('Backend {{number}}', { number: index + 1 }),
                                      id: `backend-group-${index}`,
                                    }}
                                    actions={
                                      values.backends.length > 1 ? (
                                        <Button
                                          variant="plain"
                                          aria-label={t('Remove backend')}
                                          onClick={() => helpers.remove(index)}
                                          icon={<MinusCircleIcon />}
                                        />
                                      ) : undefined
                                    }
                                  />
                                }
                              >
                                <SelectField
                                  name={`backends.${index}.backendId`}
                                  label={t('Storage backend')}
                                  fieldId={`backend-${index}-id`}
                                  isRequired
                                  isLoading={backendsLoading}
                                  placeholder={t('Select a backend')}
                                  options={backendOptions}
                                />
                                <NumberField
                                  name={`backends.${index}.maxReadBandwidthMbs`}
                                  label={t('Max read bandwidth (MB/s)')}
                                  fieldId={`backend-${index}-read-bw`}
                                  min={1}
                                  step={1}
                                  helperText={t('Optional QoS limit for read operations')}
                                />
                                <NumberField
                                  name={`backends.${index}.maxWriteBandwidthMbs`}
                                  label={t('Max write bandwidth (MB/s)')}
                                  fieldId={`backend-${index}-write-bw`}
                                  min={1}
                                  step={1}
                                  helperText={t('Optional QoS limit for write operations')}
                                />
                                <CheckboxField
                                  name={`backends.${index}.encryptionEnabled`}
                                  label={t('Enable encryption')}
                                  fieldId={`backend-${index}-encryption`}
                                />
                              </FormFieldGroup>
                            </StackItem>
                          ))}
                          <StackItem>
                            <Button
                              variant="link"
                              icon={<PlusCircleIcon />}
                              onClick={() => helpers.push(emptyBackendAssociation())}
                            >
                              {t('Add backend')}
                            </Button>
                          </StackItem>
                        </Stack>
                      )}
                    </FieldArray>
                  </OsacForm>
                </StackItem>

                {qosChanged && (
                  <StackItem>
                    <Alert variant="info" isInline title={t('QoS settings changed')}>
                      {t(
                        'Protocol changes require the associated StorageClass to be recreated before new volumes pick them up; existing volumes are unaffected.',
                      )}
                    </Alert>
                  </StackItem>
                )}

                {!!error && (
                  <StackItem>
                    <Alert
                      variant="danger"
                      title={
                        isEdit
                          ? t('Failed to update storage tier')
                          : t('Failed to create storage tier')
                      }
                      isInline
                    >
                      {getErrorMessage(error)}
                    </Alert>
                  </StackItem>
                )}
                <StackItem>
                  <ActionList>
                    <ActionListGroup>
                      <ActionListItem>
                        <Button
                          variant="primary"
                          onClick={submitForm}
                          isDisabled={isSubmitting}
                          isLoading={isSubmitting}
                        >
                          {isEdit ? t('Save') : t('Create')}
                        </Button>
                      </ActionListItem>
                      <ActionListItem>
                        <Button
                          variant="link"
                          onClick={() => navigate(TIERS_LIST_PATH)}
                          isDisabled={isSubmitting}
                        >
                          {t('Cancel')}
                        </Button>
                      </ActionListItem>
                    </ActionListGroup>
                  </ActionList>
                </StackItem>
              </Stack>
            );
          }}
        </Formik>
      </PageSection>
    </>
  );
};

const StorageTierCreatePage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: tier, isLoading, error } = usePrivateStorageTier(id ?? '');

  const assignedBackendId = tier?.spec?.backends[0]?.backendId ?? '';
  const { data: readyBackends = [], isLoading: backendsLoading } = usePrivateStorageBackends({
    filter: STORAGE_BACKEND_READY_LIST_FILTER,
  });
  const { data: assignedBackend } = usePrivateStorageBackend(assignedBackendId);

  const backendOptions = readyBackends.map((backend) => ({
    value: backend.id,
    label: backend.metadata?.name ?? backend.id,
  }));
  if (assignedBackend && !backendOptions.some((option) => option.value === assignedBackend.id)) {
    backendOptions.push({
      value: assignedBackend.id,
      label: assignedBackend.metadata?.name ?? assignedBackend.id,
    });
  }

  if (id) {
    return (
      <ListPageBody isLoading={isLoading} error={error}>
        {tier && (
          <StorageTierForm
            tier={tier}
            backendOptions={backendOptions}
            backendsLoading={backendsLoading}
          />
        )}
      </ListPageBody>
    );
  }

  return <StorageTierForm backendOptions={backendOptions} backendsLoading={backendsLoading} />;
};

export default StorageTierCreatePage;
