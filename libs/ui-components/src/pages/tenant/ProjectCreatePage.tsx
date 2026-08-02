/**
 * flow: projects
 * step: project_create
 * route: /projects/new
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ActionGroup,
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Form,
  FormGroup,
  MenuToggle,
  PageSection,
  Select,
  SelectOption,
  Stack,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';
import type { MenuToggleElement } from '@patternfly/react-core';

import { useCreateProject } from '../../api/v1/project';
import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

const ENV_OPTIONS = [
  { value: 'production', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'development', label: 'Development' },
] as const;

type EnvOption = (typeof ENV_OPTIONS)[number]['value'];

export const ProjectCreatePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [env, setEnv] = useState<EnvOption>('development');
  const [envSelectOpen, setEnvSelectOpen] = useState(false);
  const [description, setDescription] = useState('');

  const { mutateAsync, isPending, error } = useCreateProject();

  const selectedEnvLabel = ENV_OPTIONS.find((o) => o.value === env)?.label ?? env;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    await mutateAsync({
      metadata: { name: trimmedName, labels: { env } },
      spec: { title: trimmedName, description: description.trim() || undefined },
    });
    navigate('/projects');
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <Breadcrumb>
            <BreadcrumbItem>
              <Button variant="link" isInline onClick={() => navigate('/projects')}>
                {t('Projects')}
              </Button>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{t('New project')}</BreadcrumbItem>
          </Breadcrumb>
          <Title headingLevel="h1" size="3xl">
            {t('New project')}
          </Title>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Form onSubmit={handleSubmit} style={{ maxWidth: '480px' }} id="project-create-form">
          <FormGroup label={t('Name')} fieldId="project-name" isRequired>
            <TextInput
              id="project-name"
              value={name}
              onChange={(_e, v) => setName(v)}
              isRequired
              placeholder="my-project"
              autoFocus
            />
          </FormGroup>

          <FormGroup label={t('Environment type')} fieldId="project-env" isRequired>
            <Select
              isOpen={envSelectOpen}
              selected={env}
              onSelect={(_, value) => {
                setEnv(value as EnvOption);
                setEnvSelectOpen(false);
              }}
              onOpenChange={setEnvSelectOpen}
              toggle={(ref: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={ref}
                  onClick={() => setEnvSelectOpen((o) => !o)}
                  isExpanded={envSelectOpen}
                  style={{ width: '100%' }}
                >
                  {selectedEnvLabel}
                </MenuToggle>
              )}
            >
              {ENV_OPTIONS.map((o) => (
                <SelectOption key={o.value} value={o.value}>
                  {o.label}
                </SelectOption>
              ))}
            </Select>
          </FormGroup>

          <FormGroup label={t('Description')} fieldId="project-desc">
            <TextArea
              id="project-desc"
              value={description}
              onChange={(_e, v) => setDescription(v)}
              placeholder={t('Describe the purpose of this project')}
              rows={3}
              resizeOrientation="vertical"
            />
          </FormGroup>

          {error && (
            <Alert variant="danger" isInline title={t('Failed to create project')}>
              {getErrorMessage(error)}
            </Alert>
          )}

          <ActionGroup>
            <Button
              variant="primary"
              type="submit"
              isLoading={isPending}
              isDisabled={isPending || !name.trim()}
            >
              {t('Create project')}
            </Button>
            <Button variant="link" onClick={() => navigate('/projects')} isDisabled={isPending}>
              {t('Cancel')}
            </Button>
          </ActionGroup>
        </Form>
      </PageSection>
    </>
  );
};
