import { useState } from 'react';
import { Button, Flex, FlexItem, Stack, StackItem, Title } from '@patternfly/react-core';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { ComputeInstance } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import { getVmStorageRows } from '../../catalogProvision/wizard/storageRows';
import AddDiskModal from './AddDiskModal';

interface VmStorageCardProps {
  vm: ComputeInstance;
}

const VmStorageCard = ({ vm }: VmStorageCardProps) => {
  const { t } = useTranslation();
  const [isAddDiskOpen, setIsAddDiskOpen] = useState(false);
  const storageRows = getVmStorageRows(t, vm.spec?.bootDisk, vm.spec?.additionalDisks);

  return (
    <>
      <Stack hasGutter className="vm-details__storage">
        <StackItem>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            flexWrap={{ default: 'wrap' }}
          >
            <FlexItem>
              <Title headingLevel="h2" size="lg">
                {t('Storage')}
              </Title>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                size="sm"
                icon={<PlusCircleIcon />}
                aria-label={t('Add disk')}
                onClick={() => setIsAddDiskOpen(true)}
              >
                {t('Add disk')}
              </Button>
            </FlexItem>
          </Flex>
        </StackItem>
        <StackItem>
          <Table aria-label={t('Storage')} variant="compact">
            <Thead>
              <Tr>
                <Th>{t('Name')}</Th>
                <Th>{t('Size')}</Th>
                <Th>{t('Storage tier')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {storageRows.map((row) => (
                <Tr key={row.name}>
                  <Td dataLabel={t('Name')}>{row.name}</Td>
                  <Td dataLabel={t('Size')}>{row.size}</Td>
                  <Td dataLabel={t('Storage tier')}>{row.storageTier}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </StackItem>
      </Stack>

      <AddDiskModal vm={vm} isOpen={isAddDiskOpen} onClose={() => setIsAddDiskOpen(false)} />
    </>
  );
};

export default VmStorageCard;
