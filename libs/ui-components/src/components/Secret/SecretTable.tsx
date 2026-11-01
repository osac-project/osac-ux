import { Link } from 'react-router-dom';
import { Flex, FlexItem } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import { Secret, SecretType } from '@osac/types';
import SecretActionsMenu from '@osac/ui-components/components/Secret/SecretActionsMenu';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { getSecretType, getSecretTypeDataKeys } from './utils.ts';
import { Timestamp } from '../Primitives/Timestamp.tsx';

import './SecretTable.css';

interface SecretTableProps {
  items: Secret[];
  onEdit: (secret: Secret) => void;
  onDelete: (secret: Secret) => void;
}

const SecretTable = ({ items, onEdit, onDelete }: SecretTableProps) => {
  const { t } = useTranslation();
  const secretTypes = getSecretType(t);

  return (
    <Table aria-label={t('Secrets')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Project')}</Th>
          <Th>{t('Type')}</Th>
          <Th>{t('Key')}</Th>
          <Th>{t('Created')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {items.map((secret) => {
          const name = secret.metadata?.name || secret.id;

          return (
            <Tr key={secret.id}>
              <Td dataLabel={t('Name')}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Link
                      to={`/secrets/${encodeURIComponent(secret.id)}`}
                      className="secrets-table__name-link"
                    >
                      {name}
                    </Link>
                  </FlexItem>
                </Flex>
              </Td>
              <Td dataLabel={t('Project')}>{secret.metadata?.project || t('Default')}</Td>
              <Td dataLabel={t('Type')}>
                {secretTypes[secret.type] || secretTypes[SecretType.UNSPECIFIED]}
              </Td>
              <Td dataLabel={t('Key')}>{getSecretTypeDataKeys(secret.type) || '—'}</Td>
              <Td dataLabel={t('Created')}>
                <Timestamp value={secret.metadata?.creationTimestamp} />
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <SecretActionsMenu
                  secret={secret}
                  onEdit={() => onEdit(secret)}
                  onDelete={() => onDelete(secret)}
                />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default SecretTable;
