import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Divider,
  Flex,
  FlexItem,
  MenuToggle,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import GlobeIcon from '@patternfly/react-icons/dist/esm/icons/globe-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';
import PlayIcon from '@patternfly/react-icons/dist/esm/icons/play-icon';
import StopIcon from '@patternfly/react-icons/dist/esm/icons/stop-icon';
import SyncAltIcon from '@patternfly/react-icons/dist/esm/icons/sync-alt-icon';

import type { ComputeInstance } from '@osac/types';
import {
  ComputeInstanceState,
  ExternalIPAttachmentState,
  ExternalIPAttachments,
} from '@osac/types';
import DeleteResourceButton from '@osac/ui-components/components/Resource/DeleteResourceButton';

import AttachExternalIpModal from './AttachExternalIpModal';
import DetachExternalIpModal from './DetachExternalIpModal';
import VmDeleteConfirmModal from './VmDeleteConfirmModal';
import { useListResource } from '../../../api/use-resource';
import { computeInstanceAttachmentFilter } from '../../../api/v1/external-ip-data';
import { useTranslation } from '../../../hooks/useTranslation';
import { getErrorMessage } from '../../../utils/error';
import { useVmPowerAction } from '../useVmPowerAction';

interface VmDetailsActionButtonsProps {
  vm: ComputeInstance;
}

const VmDetailsActionButtons = ({ vm }: VmDetailsActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [attachExternalIpOpen, setAttachExternalIpOpen] = useState(false);
  const [detachExternalIpOpen, setDetachExternalIpOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const { runPowerAction } = useVmPowerAction();
  const {
    data: externalIpAttachmentResponse,
    isLoading: isLoadingExternalIpAttachments,
    isFetching: isFetchingExternalIpAttachments,
    error: externalIpAttachmentsError,
  } = useListResource(
    ExternalIPAttachments,
    { filter: computeInstanceAttachmentFilter(vm.id) },
    { enabled: true },
  );
  const externalIpAttachments = externalIpAttachmentResponse?.items ?? [];

  const state = vm.status?.state;
  const canStart = state === ComputeInstanceState.STOPPED;
  const canStop = state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canRestart =
    state === ComputeInstanceState.RUNNING || state === ComputeInstanceState.PAUSED;
  const canDelete = state !== ComputeInstanceState.DELETING;
  const canAttachExternalIp =
    state === ComputeInstanceState.RUNNING && !vm.status?.externalIpAddress;
  const externalIpAttachment = externalIpAttachments[0];
  const hasAttachedExternalIp = Boolean(vm.status?.externalIpAddress);
  const isAttachingExternalIp =
    externalIpAttachment?.status?.state ===
      ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_PENDING ||
    (isFetchingExternalIpAttachments && !isLoadingExternalIpAttachments && !hasAttachedExternalIp);
  const isDetachingExternalIp =
    externalIpAttachment?.status?.state ===
    ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_DELETING;
  const isExternalIpAttachmentFailed =
    externalIpAttachment?.status?.state ===
    ExternalIPAttachmentState.EXTERNAL_IP_ATTACHMENT_STATE_FAILED;
  const showDetachExternalIp =
    Boolean(externalIpAttachment) && (hasAttachedExternalIp || isExternalIpAttachmentFailed);
  const externalIpAttachmentMissing =
    hasAttachedExternalIp &&
    !isLoadingExternalIpAttachments &&
    !externalIpAttachmentsError &&
    !externalIpAttachment;

  const vmName = vm.metadata?.name ?? vm.id;
  const openConsole = () => {
    window.open(`/vms/${encodeURIComponent(vm.id)}#console`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {deleteOpen && (
        <VmDeleteConfirmModal
          vm={vm}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/vms')}
        />
      )}
      {attachExternalIpOpen && (
        <AttachExternalIpModal vm={vm} onClose={() => setAttachExternalIpOpen(false)} />
      )}
      {detachExternalIpOpen && externalIpAttachment && (
        <DetachExternalIpModal
          attachment={externalIpAttachment}
          onClose={() => setDetachExternalIpOpen(false)}
        />
      )}

      <Stack hasGutter>
        {/* Alerts */}
        {Boolean(externalIpAttachmentsError) && hasAttachedExternalIp && (
          <StackItem>
            <Alert variant="danger" isInline title={t('Failed to load external IP attachment')}>
              {getErrorMessage(externalIpAttachmentsError)}
            </Alert>
          </StackItem>
        )}
        {externalIpAttachmentMissing && (
          <StackItem>
            <Alert variant="danger" isInline title={t('External IP attachment not found')}>
              {t(
                'The virtual machine reports an external IP, but its attachment resource is missing.',
              )}
            </Alert>
          </StackItem>
        )}
        {isExternalIpAttachmentFailed && (
          <StackItem>
            <Alert variant="danger" isInline title={t('External IP attachment failed')}>
              {typeof externalIpAttachment?.status?.message === 'string'
                ? externalIpAttachment.status.message
                : t('The external IP attachment could not be provisioned.')}
            </Alert>
          </StackItem>
        )}

        {/* Buttons */}
        <StackItem>
          <Flex spaceItems={{ default: 'spaceItemsSm' }} flexWrap={{ default: 'wrap' }}>
            <FlexItem>
              <Button
                variant="primary"
                icon={<ExternalLinkAltIcon />}
                onClick={openConsole}
              >
                {t('Open console')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Divider orientation={{ default: 'vertical' }} />
            </FlexItem>
            {/* Power actions — always visible */}
            <FlexItem>
              <Button
                variant="primary"
                icon={<PlayIcon />}
                isDisabled={!canStart}
                onClick={() => {
                  if (canStart) runPowerAction(vm.id, vmName, 'start');
                }}
              >
                {t('Start')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                icon={<StopIcon />}
                isDisabled={!canStop}
                onClick={() => {
                  if (canStop) runPowerAction(vm.id, vmName, 'stop');
                }}
              >
                {t('Stop')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                icon={<SyncAltIcon />}
                isDisabled={!canRestart}
                onClick={() => {
                  if (canRestart) runPowerAction(vm.id, vmName, 'restart');
                }}
              >
                {t('Restart')}
              </Button>
            </FlexItem>

            {/* Secondary actions menu: External IP + Delete */}
            <FlexItem>
              <Dropdown
                isOpen={isActionsOpen}
                onOpenChange={setIsActionsOpen}
                toggle={(ref) => (
                  <MenuToggle
                    ref={ref}
                    variant="secondary"
                    onClick={() => setIsActionsOpen((o) => !o)}
                    aria-label={t('Actions for {{name}}', { name: vmName })}
                  >
                    {t('Actions')}
                  </MenuToggle>
                )}
                popperProps={{ position: 'right' }}
              >
                <DropdownList>
                  {!showDetachExternalIp && (
                    <DropdownItem
                      icon={<GlobeIcon />}
                      isDisabled={
                        isLoadingExternalIpAttachments ||
                        Boolean(externalIpAttachmentsError) ||
                        externalIpAttachmentMissing ||
                        isAttachingExternalIp ||
                        !canAttachExternalIp
                      }
                      onClick={() => {
                        setAttachExternalIpOpen(true);
                        setIsActionsOpen(false);
                      }}
                    >
                      {t(
                        isLoadingExternalIpAttachments
                          ? 'Loading external IP attachment...'
                          : isAttachingExternalIp
                            ? 'Attaching External IP...'
                            : 'Attach external IP',
                      )}
                    </DropdownItem>
                  )}
                  {showDetachExternalIp && externalIpAttachment && (
                    <DropdownItem
                      icon={<GlobeIcon />}
                      isDisabled={
                        isLoadingExternalIpAttachments ||
                        Boolean(externalIpAttachmentsError) ||
                        externalIpAttachmentMissing ||
                        isDetachingExternalIp
                      }
                      onClick={() => {
                        setDetachExternalIpOpen(true);
                        setIsActionsOpen(false);
                      }}
                    >
                      {t(isDetachingExternalIp ? 'Detaching external IP' : 'Detach external IP')}
                    </DropdownItem>
                  )}
                  <DeleteResourceButton
                    isDropdown
                    canDelete={canDelete}
                    onClick={() => {
                      if (canDelete) {
                        setDeleteOpen(true);
                        setIsActionsOpen(false);
                      }
                    }}
                  />
                </DropdownList>
              </Dropdown>
            </FlexItem>
          </Flex>
        </StackItem>
      </Stack>
    </>
  );
};

export default VmDetailsActionButtons;
