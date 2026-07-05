/**
 * flow: provider-admin
 * route: /provider/network-classes/new
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Checkbox,
  Form,
  FormGroup,
  PageSection,
  Stack,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { useCreateNetworkClass } from '../../api/v1/networking';
import { getErrorMessage } from '../../utils/error';

const BACK = '/provider/network-classes';

export const ProviderNetworkClassNewPage = () => {
  const navigate = useNavigate();
  const createNC = useCreateNetworkClass();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [supportsIpv4, setSupportsIpv4] = useState(true);
  const [supportsIpv6, setSupportsIpv6] = useState(false);
  const [supportsDualStack, setSupportsDualStack] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const isValid = name.trim() !== '' && title.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      return;
    }
    createNC.reset();
    await createNC.mutateAsync({
      name: name.trim(),
      title: title.trim(),
      description: description.trim() || undefined,
      supportsIpv4,
      supportsIpv6,
      supportsDualStack,
      isDefault,
    });
    navigate(BACK);
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate(BACK)}>
                Network Classes
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>Create network class</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            Create network class
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '560px' }} id="nc-form">
          <FormGroup label="Identifier (name)" fieldId="nc-name" isRequired>
            <TextInput
              id="nc-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              placeholder="udn-network"
              isRequired
              autoFocus
            />
          </FormGroup>

          <FormGroup label="Title" fieldId="nc-title" isRequired>
            <TextInput
              id="nc-title"
              value={title}
              onChange={(_e, v) => setTitle(v)}
              placeholder="UDN Network"
              isRequired
            />
          </FormGroup>

          <FormGroup label="Description" fieldId="nc-description">
            <TextArea
              id="nc-description"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder="Describe this network class, its characteristics and limitations…"
              rows={3}
            />
          </FormGroup>

          <FormGroup label="Capabilities" fieldId="nc-capabilities">
            <Checkbox
              id="nc-ipv4"
              label="Supports IPv4"
              isChecked={supportsIpv4}
              onChange={(_e, v) => setSupportsIpv4(v)}
            />
            <Checkbox
              id="nc-ipv6"
              label="Supports IPv6"
              isChecked={supportsIpv6}
              onChange={(_e, v) => setSupportsIpv6(v)}
            />
            <Checkbox
              id="nc-dualstack"
              label="Supports dual-stack (IPv4 + IPv6)"
              isChecked={supportsDualStack}
              onChange={(_e, v) => setSupportsDualStack(v)}
            />
          </FormGroup>

          <FormGroup fieldId="nc-default">
            <Checkbox
              id="nc-default"
              label="Set as default network class"
              isChecked={isDefault}
              onChange={(_e, v) => setIsDefault(v)}
            />
          </FormGroup>

          {createNC.error && (
            <Alert variant="danger" title="Failed to create network class" isInline>
              {getErrorMessage(createNC.error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              form="nc-form"
              isLoading={createNC.isPending}
              isDisabled={createNC.isPending || !isValid}
            >
              Create
            </Button>
            <Button variant="link" onClick={() => navigate(BACK)} isDisabled={createNC.isPending}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
