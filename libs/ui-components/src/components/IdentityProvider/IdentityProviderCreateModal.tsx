import { useState } from 'react';
import {
  ActionGroup,
  Alert,
  Button,
  Checkbox,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@patternfly/react-core';

import { useCreateIdentityProvider } from '../../api/v1/identity-provider';
import { getErrorMessage } from '../../utils/error';

interface IdentityProviderCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IdentityProviderCreateModal = ({
  isOpen,
  onClose,
}: IdentityProviderCreateModalProps) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [issuer, setIssuer] = useState('');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [enabled, setEnabled] = useState(true);

  const { mutateAsync, isPending, error } = useCreateIdentityProvider();

  const isValid =
    name.trim() && title.trim() && clientId.trim() && clientSecret.trim() && issuer.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    await mutateAsync({
      metadata: { name: name.trim() },
      spec: {
        title: title.trim(),
        enabled,
        config: {
          case: 'oidc',
          value: {
            authorizationUrl:
              authorizationUrl.trim() || `${issuer.trim()}/protocol/openid-connect/auth`,
            tokenUrl: tokenUrl.trim() || `${issuer.trim()}/protocol/openid-connect/token`,
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim(),
            issuer: issuer.trim(),
          } as import('@osac/types').OidcConfig,
        },
      },
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="medium" aria-label="Add identity provider">
      <ModalHeader title="Add identity provider (OIDC)" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {getErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit} id="idp-create-form">
          <FormGroup label="Internal name" isRequired fieldId="idp-name">
            <TextInput
              id="idp-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="my-oidc-provider"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Display title" isRequired fieldId="idp-title">
            <TextInput
              id="idp-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="Corporate SSO"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Issuer URL" isRequired fieldId="idp-issuer">
            <TextInput
              id="idp-issuer"
              value={issuer}
              onChange={(_e, v) => setIssuer(v)}
              placeholder="https://sso.example.com/realms/my-realm"
              isRequired
            />
          </FormGroup>
          <FormGroup label="Client ID" isRequired fieldId="idp-client-id">
            <TextInput
              id="idp-client-id"
              value={clientId}
              onChange={(_e, v) => setClientId(v)}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Client secret" isRequired fieldId="idp-client-secret">
            <TextInput
              id="idp-client-secret"
              type="password"
              value={clientSecret}
              onChange={(_e, v) => setClientSecret(v)}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Authorization URL (optional override)" fieldId="idp-auth-url">
            <TextInput
              id="idp-auth-url"
              value={authorizationUrl}
              onChange={(_e, v) => setAuthorizationUrl(v)}
              placeholder="Derived from issuer if blank"
            />
          </FormGroup>
          <FormGroup label="Token URL (optional override)" fieldId="idp-token-url">
            <TextInput
              id="idp-token-url"
              value={tokenUrl}
              onChange={(_e, v) => setTokenUrl(v)}
              placeholder="Derived from issuer if blank"
            />
          </FormGroup>
          <FormGroup fieldId="idp-enabled">
            <Checkbox
              id="idp-enabled"
              label="Enable immediately"
              isChecked={enabled}
              onChange={(_e, v) => setEnabled(v)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button
            variant="primary"
            type="submit"
            form="idp-create-form"
            isLoading={isPending}
            isDisabled={isPending || !isValid}
          >
            Add provider
          </Button>
          <Button variant="link" onClick={onClose} isDisabled={isPending}>
            Cancel
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
