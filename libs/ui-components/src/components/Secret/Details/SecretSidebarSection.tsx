import { Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Icon,
  Title,
} from '@patternfly/react-core';
import FileIcon from '@patternfly/react-icons/dist/esm/icons/file-icon';

import { Secret, SecretType } from '@osac/types';

import { MOCK_SOURCE_FILE_ANNOTATIONS, SOURCE_FILENAME_ANNOTATION } from '../annotations';
import { useTranslation } from '../../../hooks/useTranslation';
import { Timestamp } from '../../Primitives/Timestamp';
import { getSecretType } from '../utils';

import '../../shared/details-page.css';

interface SecretSidebarSectionProps {
  secret: Secret;
}

const SecretSidebarSection = ({ secret }: SecretSidebarSectionProps) => {
  const { t } = useTranslation();
  const secretTypes = getSecretType(t);
  const project = secret.metadata?.project?.trim();
  const labels = Object.entries(secret.metadata?.labels ?? {});

  // Read from annotation; fall back to mock data until the real API populates it.
  const annotations = secret.metadata?.annotations ?? {};
  const sourceFilename =
    annotations[SOURCE_FILENAME_ANNOTATION] ??
    MOCK_SOURCE_FILE_ANNOTATIONS[SOURCE_FILENAME_ANNOTATION];

  return (
    <div className="secret-details__overview">
      <Flex
        className="secret-details__overview-header"
        alignItems={{ default: 'alignItemsCenter' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        flexWrap={{ default: 'wrap' }}
      >
        <FlexItem>
          <Title headingLevel="h2" size="lg" className="secret-details__overview-title">
            {t('Overview')}
          </Title>
        </FlexItem>
      </Flex>

      <DescriptionList isCompact aria-label={t('Secret overview')}>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Project')}</DescriptionListTerm>
          <DescriptionListDescription>
            {project ? (
              <Link to={`/projects/${encodeURIComponent(project)}`}>{project}</Link>
            ) : (
              t('Default')
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
          <DescriptionListDescription>
            {secret.metadata?.name || secret.id}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Type')}</DescriptionListTerm>
          <DescriptionListDescription>
            {secretTypes[secret.type] || secretTypes[SecretType.UNSPECIFIED]}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Description')}</DescriptionListTerm>
          <DescriptionListDescription>
            {secret.metadata?.description || t('No description')}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Labels')}</DescriptionListTerm>
          <DescriptionListDescription>
            {labels.length > 0
              ? labels.map(([key, value]) => `${key}=${value}`).join(', ')
              : t('No labels')}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Created at')}</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp value={secret.metadata?.creationTimestamp} />
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Uploaded file')}</DescriptionListTerm>
          <DescriptionListDescription>
            {sourceFilename ? (
              <Flex
                spaceItems={{ default: 'spaceItemsXs' }}
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <FlexItem>
                  <Icon size="sm">
                    <FileIcon />
                  </Icon>
                </FlexItem>
                <FlexItem>{sourceFilename}</FlexItem>
              </Flex>
            ) : (
              t('No file uploaded')
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};

export default SecretSidebarSection;
