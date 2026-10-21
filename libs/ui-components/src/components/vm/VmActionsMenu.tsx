import { useState } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  MenuToggle,
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';
import DeleteResourceButton from '@osac/ui-components/components/Resource/DeleteResourceButton';

import VmDeleteConfirmModal from './DetailsPage/VmDeleteConfirmModal';
import { useVmPowerAction } from './useVmPowerAction';
import { useTranslation } from '../../hooks/useTranslation';

interface VmActionsMenuProps {
  vm: ComputeInstance;
}

export const VmActionsMenu = ({ vm }: VmActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { t } = useTranslation();
  const { runPowerAction } = useVmPowerAction();

  const name = vm.metadata?.name ?? vm.id;
  const state = vm.status?.state;
  const canStart = state === ComputeInstanceState.STOPPED;
  const canStop = state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canRestart =
    state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canDelete = state !== ComputeInstanceState.DELETING;

  const runAction = (powerAction: 'start' | 'stop' | 'restart') => {
    runPowerAction(vm.id, name, powerAction);
    setOpen(false);
  };

  const controlMenu = (
    <Menu containsFlyout>
      <MenuContent>
        <MenuList>
          <MenuItem isDisabled={!canStart} onClick={() => canStart && runAction('start')}>
            {t('Start')}
          </MenuItem>
          <MenuItem isDisabled={!canStop} onClick={() => canStop && runAction('stop')}>
            {t('Stop')}
          </MenuItem>
          <MenuItem isDisabled={!canRestart} onClick={() => canRestart && runAction('restart')}>
            {t('Restart')}
          </MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const openConsole = () => {
    window.open(`/vms/${encodeURIComponent(vm.id)}#console`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  return (
    <>
      {deleteOpen && (
        <VmDeleteConfirmModal
          vm={vm}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => setDeleteOpen(false)}
        />
      )}
      <Dropdown
        isOpen={open}
        containsFlyout
        onOpenChange={setOpen}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant="plain"
            onClick={() => setOpen((o) => !o)}
            aria-label={`Actions for ${name}`}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem value="control" flyoutMenu={controlMenu}>
            {t('Control')}
          </DropdownItem>
          <DropdownItem description={t('Open console in new tab')} onClick={openConsole}>
            {t('Open console')}
          </DropdownItem>
          <DeleteResourceButton
            isDropdown
            canDelete={canDelete}
            onClick={() => {
              if (!canDelete) {
                return;
              }
              setDeleteOpen(true);
              setOpen(false);
            }}
          />
        </DropdownList>
      </Dropdown>
    </>
  );
};
