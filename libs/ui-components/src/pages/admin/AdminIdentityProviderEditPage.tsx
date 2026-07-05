/**
 * flow: identity-providers
 * step: idp_edit
 * route: /admin/identity-providers/:id/edit
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  PageSection,
  Spinner,
  Stack,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useIdentityProvider, usePatchIdentityProvider } from '../../api/v1/identity-provider';
import type { OidcConfig } from '../../api/v1/identity-provider';
import { getErrorMessage } from '../../utils/error';

export const AdminIdentityProviderEditPage = () => {
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id: string }>();
  const { data: idp, isLoading } = useIdentityProvider(id);
  const { mutateAsync, isPending, error } = usePatchIdentityProvider();

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [issuer, setIssuer] = useState('');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [tokenUrl, setTokenUrl] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (idp && !initialized) {
      const oidc = idp.spec?.config?.case === 'oidc' ? idp.spec.config.value : null;
      setTitle(idp.spec?.title ?? '');
      setEnabled(idp.spec?.enabled ?? true);
      setClientId(oidc?.clientId ?? '');
      setIssuer(oidc?.issuer ?? '');
      setAuthorizationUrl(oidc?.authorizationUrl ?? '');
      setTokenUrl(oidc?.tokenUrl ?? '');
      setInitialized(true);
    }
  }, [idp, initialized]);

  const isOidc = !idp || idp.spec?.config?.case === 'oidc';
  const internalName = idp?.metadata?.name ?? id;
  const isValid = !!(title.trim() && clientId.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    const oidcValue: OidcConfig = {
      clientId: clientId.trim(),
      issuer: issuer.trim(),
      authorizationUrl: authorizationUrl.trim() || `${issuer.trim()}/protocol/openid-connect/auth`,
      tokenUrl: tokenUrl.trim() || `${issuer.trim()}/protocol/openid-connect/token`,
    } as OidcConfig;
    if (clientSecret.trim()) {
      (oidcValue as Record<string, unknown>).clientSecret = clientSecret.trim();
    }
    await mutateAsync({
      id,
      patch: {
        spec: {
          title: title.trim(),
          enabled,
          config: { case: 'oidc', value: oidcValue },
        },
      },
    });
    navigate('/admin/identity-providers');
  };

  if (isLoading) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Spinner aria-label="Loading identity provider" />
      </PageSection>
    );
  }

  if (!idp) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant="warning" isInline title={`Identity provider not found: ${id}`}>
          <Button variant="link" onClick={() => navigate('/admin/identity-providers')}>
            Back to Identity providers
          </Button>
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/admin/identity-providers')}>
                Identity providers
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Edit — {title || internalName}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Edit identity provider
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '520px' }} id="idp-edit-form">
          <FormGroup label="Internal name" fieldId="idp-name">
            <Label color="grey" isCompact>
              {internalName}
            </Label>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>Internal name is immutable after creation.</HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          {!isOidc && (
            <Alert variant="info" isInline title="LDAP provider">
              This provider uses LDAP configuration. Editing LDAP-specific fields is not yet
              supported in this form.
            </Alert>
          )}

          <FormGroup label="Display title" isRequired fieldId="idp-title">
            <TextInput
              id="idp-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              isRequired
              autoFocus
            />
          </FormGroup>

          {isOidc && (
            <>
              <FormGroup label="Issuer URL" fieldId="idp-issuer">
                <TextInput
                  id="idp-issuer"
                  value={issuer}
                  onChange={(_e, v) => setIssuer(v)}
                  placeholder="https://sso.example.com/realms/my-realm"
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

              <FormGroup label="Client secret" fieldId="idp-client-secret">
                <TextInput
                  id="idp-client-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(_e, v) => setClientSecret(v)}
                  placeholder="Leave blank to keep existing secret"
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>
                      Leave blank to keep the current secret unchanged.
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
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
            </>
          )}

          <FormGroup fieldId="idp-enabled">
            <Checkbox
              id="idp-enabled"
              label="Provider enabled"
              isChecked={enabled}
              onChange={(_e, v) => setEnabled(v)}
            />
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title="Failed to update identity provider">
              {getErrorMessage(error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="idp-edit-form"
              isLoading={isPending}
              isDisabled={isPending || !isValid}
            >
              Save changes
            </Button>
            <Button
              variant="link"
              onClick={() => navigate('/admin/identity-providers')}
              isDisabled={isPending}
            >
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
