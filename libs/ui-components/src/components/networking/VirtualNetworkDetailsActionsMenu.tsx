import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';

import type { VirtualNetwork } from '@osac/types';
import { useDeleteVirtualNetwork } from '@osac/ui-components/api/v1/networking';
import DeleteResourceButton from '@osac/ui-components/components/Resource/DeleteResourceButton';
import DeleteResourceModal from '@osac/ui-components/components/Resource/DeleteResourceModal';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { VirtualNetworkEditModal } from './VirtualNetworkEditModal';

const VIRTUAL_NETWORKS_LIST_PATH = '/networking/virtual-networks';

interface VirtualNetworkDetailsActionsMenuProps {
  virtualNetwork: VirtualNetwork;
}

const VirtualNetworkDetailsActionsMenu = ({
  virtualNetwork,
}: VirtualNetworkDetailsActionsMenuProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const deleteVirtualNetwork = useDeleteVirtualNetwork();
  const name = virtualNetwork.metadata?.name ?? virtualNetwork.id;

  return (
    <>
      {editOpen && (
        <VirtualNetworkEditModal
          virtualNetwork={virtualNetwork}
          onClose={() => setEditOpen(false)}
        />
      )}
      {deleteOpen && (
        <DeleteResourceModal
          resourceName={name}
          label={t(
            'This permanently deletes the virtual network and related networking resources. This action cannot be undone.',
          )}
          errorLabel={t('Failed to delete virtual network')}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate(VIRTUAL_NETWORKS_LIST_PATH, { replace: true })}
          mutation={deleteVirtualNetwork}
          variables={virtualNetwork.id}
        />
      )}
      <Dropdown
        isOpen={open}
        onOpenChange={setOpen}
        toggle={(ref) => (
          <MenuToggle
            ref={ref}
            variant="plain"
            onClick={() => setOpen((current) => !current)}
            isExpanded={open}
            aria-label={t('Actions for {{name}}', { name })}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem
            onClick={() => {
              navigate(`${VIRTUAL_NETWORKS_LIST_PATH}/${encodeURIComponent(virtualNetwork.id)}`);
              setOpen(false);
            }}
          >
            {t('View details')}
          </DropdownItem>
          <DropdownItem
            onClick={() => {
              setEditOpen(true);
              setOpen(false);
            }}
          >
            {t('Edit')}
          </DropdownItem>
          <DeleteResourceButton
            isDropdown
            onClick={() => {
              setDeleteOpen(true);
              setOpen(false);
            }}
          />
        </DropdownList>
      </Dropdown>
    </>
  );
};

export default VirtualNetworkDetailsActionsMenu;
