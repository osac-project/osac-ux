import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  PageSection,
  Stack,
  StackItem,
  TextArea,
  TextInput,
  Title,
} from '@patternfly/react-core';
import DownloadIcon from '@patternfly/react-icons/dist/esm/icons/download-icon';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons/eye-icon';
import { EyeSlashIcon } from '@patternfly/react-icons/dist/esm/icons/eye-slash-icon';
import { LockIcon } from '@patternfly/react-icons/dist/esm/icons/lock-icon';

import { Secret, Secrets } from '@osac/types';
import { useGetResource } from '@osac/ui-components/api/use-resource';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import SecretDetailsActionButtons from './SecretDetailsActionButtons';
import SecretSidebarSection from './SecretSidebarSection';
import ResourceDetailsPage from '../../Resource/ResourceDetailsPage';
import { SubtleContent } from '../../SubtleContent/SubtleContent';
import { decodeSecretValue, getDataEntries } from '../CreatePage/values';
import { downloadSecretBytes } from '../utils';

import './SecretDetailsPage.css';
import '../../shared/details-page.css';

interface SecretDetailsPageContentProps {
  secret: Secret;
}

const SecretDetailsPageContent = ({ secret }: SecretDetailsPageContentProps) => {
  const { t } = useTranslation();
  const [showValues, setShowValues] = useState(false);
  const secretName = secret.metadata?.name || secret.id;
  const dataEntries = getDataEntries(secret.data);

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Stack hasGutter>
          <StackItem>
            <Flex
              className="secret-details__header"
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsFlexStart' }}
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsMd' }}
            >
              <FlexItem>
                <Stack hasGutter>
                  <StackItem>
                    <Title headingLevel="h1" size="3xl">
                      {secretName}
                    </Title>
                  </StackItem>
                  <StackItem>
                    <Content component="p">
                      {secret.metadata?.description ||
                        t('Secure credentials and configuration data for this project.')}
                    </Content>
                  </StackItem>
                </Stack>
              </FlexItem>
              <FlexItem>
                <SecretDetailsActionButtons secret={secret} />
              </FlexItem>
            </Flex>
          </StackItem>
          <StackItem>
            <Divider />
          </StackItem>
        </Stack>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <Grid hasGutter>
          <GridItem span={6}>
            <SecretSidebarSection secret={secret} />
          </GridItem>
          <GridItem span={6}>
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
                    {t('Secret data')}
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="link"
                    isInline
                    icon={showValues ? <EyeSlashIcon /> : <EyeIcon />}
                    onClick={() => setShowValues((v) => !v)}
                  >
                    {showValues ? t('Hide values') : t('Reveal values')}
                  </Button>
                </FlexItem>
              </Flex>
              {dataEntries.length === 0 ? (
                <SubtleContent component="p">{t('No secret data keys.')}</SubtleContent>
              ) : (
                <DescriptionList isCompact aria-label={t('Secret data')}>
                  {dataEntries.map((entry) => (
                    <React.Fragment key={entry.key}>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Key')}</DescriptionListTerm>
                        <DescriptionListDescription>{entry.key}</DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>{t('Value')}</DescriptionListTerm>
                        <DescriptionListDescription>
                          {showValues ? (
                            decodeSecretValue(entry.value) !== undefined ? (
                              <TextArea
                                id={`secret-value-${entry.key}`}
                                aria-label={t('Secret value for {{key}}', { key: entry.key })}
                                value={decodeSecretValue(entry.value)}
                                readOnly
                                rows={4}
                              />
                            ) : (
                              <>
                                {t(
                                  'This value contains binary data and cannot be displayed as text. Download it to access the raw data.',
                                )}
                                <Button
                                  variant="link"
                                  isInline
                                  icon={<DownloadIcon />}
                                  onClick={() => {
                                    if (entry.value) {
                                      downloadSecretBytes(entry.value, entry.key);
                                    }
                                  }}
                                >
                                  {t('Download value')}
                                </Button>
                              </>
                            )
                          ) : (
                            <TextInput
                              value="********"
                              type="text"
                              readOnlyVariant="default"
                              customIcon={<LockIcon />}
                              aria-label={t('Hidden secret value for {{key}}', {
                                key: entry.key,
                              })}
                            />
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </React.Fragment>
                  ))}
                </DescriptionList>
              )}
            </div>
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

const SecretDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGetResource(
    Secrets,
    { id: id ?? '' },
    { enabled: Boolean(id) },
  );

  return (
    <ResourceDetailsPage
      error={error}
      found={!!data?.object}
      isLoading={isLoading}
      parentLabel={t('Secrets')}
      parentTo="/secrets"
      refetch={refetch}
      resourceLabel={t('secret')}
      cardCount={2}
    >
      {data?.object && <SecretDetailsPageContent secret={data.object} />}
    </ResourceDetailsPage>
  );
};

export default SecretDetailsPage;
