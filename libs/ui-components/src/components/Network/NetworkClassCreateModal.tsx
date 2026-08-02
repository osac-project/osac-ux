import React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
  TextInput,
} from '@patternfly/react-core';

import { useCreateNetworkClass } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import OsacForm from '../Form/OsacForm';

interface NetworkClassCreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NetworkClassCreateModal = ({ onClose, onSuccess }: NetworkClassCreateModalProps) => {
  const { t } = useTranslation();
  const [name, setName] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [supportsIpv4, setSupportsIpv4] = React.useState(true);
  const [supportsIpv6, setSupportsIpv6] = React.useState(false);
  const [supportsDualStack, setSupportsDualStack] = React.useState(false);
  const [isDefault, setIsDefault] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);

  const createNC = useCreateNetworkClass();

  const onSubmit = async () => {
    if (!name.trim() || !title.trim()) {
      return;
    }
    setIsPending(true);
    createNC.reset();
    try {
      await createNC.mutateAsync({
        name: name.trim(),
        title: title.trim(),
        description: description.trim() || undefined,
        supportsIpv4,
        supportsIpv6,
        supportsDualStack,
        isDefault,
      });
      onSuccess();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal
      variant="medium"
      isOpen
      onClose={isPending ? undefined : onClose}
      aria-labelledby="nc-create-title"
    >
      <ModalHeader title={t('Create network class')} labelId="nc-create-title" />
      <ModalBody>
        <OsacForm>
          <FormGroup label={t('Identifier (name)')} fieldId="nc-name" isRequired>
            <TextInput
              id="nc-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="udn-network"
              isRequired
            />
          </FormGroup>

          <FormGroup label={t('Title')} fieldId="nc-title" isRequired>
            <TextInput
              id="nc-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="UDN Network"
              isRequired
            />
          </FormGroup>

          <FormGroup label={t('Description')} fieldId="nc-description">
            <TextArea
              id="nc-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder={t('Describe this network class, its characteristics and limitations…')}
              rows={3}
            />
          </FormGroup>

          <FormGroup label={t('Capabilities')} fieldId="nc-capabilities">
            <Checkbox
              id="nc-ipv4"
              label={t('Supports IPv4')}
              isChecked={supportsIpv4}
              onChange={(_e, v) => setSupportsIpv4(v)}
            />
            <Checkbox
              id="nc-ipv6"
              label={t('Supports IPv6')}
              isChecked={supportsIpv6}
              onChange={(_e, v) => setSupportsIpv6(v)}
            />
            <Checkbox
              id="nc-dualstack"
              label={t('Supports dual-stack (IPv4 + IPv6)')}
              isChecked={supportsDualStack}
              onChange={(_e, v) => setSupportsDualStack(v)}
            />
          </FormGroup>

          <FormGroup fieldId="nc-default">
            <Checkbox
              id="nc-default"
              label={t('Set as default network class')}
              isChecked={isDefault}
              onChange={(_e, v) => setIsDefault(v)}
            />
          </FormGroup>

          {createNC.error && (
            <Alert variant="danger" title={t('Failed to create network class')} isInline>
              {getErrorMessage(createNC.error)}
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
          onClick={onSubmit}
          isDisabled={isPending || !name.trim() || !title.trim()}
          isLoading={isPending}
        >
          {t('Create')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
