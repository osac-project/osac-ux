import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  ClipboardCopy,
  Flex,
  FlexItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import DownloadIcon from '@patternfly/react-icons/dist/esm/icons/download-icon';
import DumpsterIcon from '@patternfly/react-icons/dist/esm/icons/dumpster-icon';
import KeyIcon from '@patternfly/react-icons/dist/esm/icons/key-icon';

import type { Cluster } from '@osac/types';

import { useDownloadClusterKubeconfig, useGetClusterPassword } from '../../../api/v1/cluster';
import { useTranslation } from '../../../hooks/useTranslation';
import ClusterDeleteConfirmModal from '../ClusterDeleteConfirmModal';

interface ClusterDetailsActionButtonsProps {
  cluster: Cluster;
}

const ClusterDetailsActionButtons = ({ cluster }: ClusterDetailsActionButtonsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  const { mutate: downloadKubeconfig, isPending: isDownloadingKubeconfig } =
    useDownloadClusterKubeconfig();
  const { mutate: getPassword, isPending: isGettingPassword } = useGetClusterPassword();

  return (
    <>
      {deleteOpen && (
        <ClusterDeleteConfirmModal
          cluster={cluster}
          onClose={() => setDeleteOpen(false)}
          onSuccess={() => navigate('/clusters', { replace: true })}
        />
      )}
      <Stack hasGutter>
        {revealedPassword && (
          <StackItem>
            <Alert
              variant="info"
              isInline
              title={t('kubeadmin password')}
              actionClose={
                <Button
                  variant="plain"
                  onClick={() => setRevealedPassword(null)}
                  aria-label={t('Close')}
                />
              }
            >
              <ClipboardCopy isReadOnly hoverTip={t('Copy')} clickTip={t('Copied')}>
                {revealedPassword}
              </ClipboardCopy>
            </Alert>
          </StackItem>
        )}
        <StackItem>
          <Flex
            justifyContent={{ default: 'justifyContentFlexEnd' }}
            spaceItems={{ default: 'spaceItemsSm' }}
            flexWrap={{ default: 'wrap' }}
          >
            <FlexItem>
              <Button
                variant="secondary"
                icon={<DownloadIcon />}
                isLoading={isDownloadingKubeconfig}
                isDisabled={isDownloadingKubeconfig}
                onClick={() => downloadKubeconfig(cluster.id)}
              >
                {t('Download kubeconfig')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                icon={<KeyIcon />}
                isLoading={isGettingPassword}
                isDisabled={isGettingPassword || Boolean(revealedPassword)}
                onClick={() =>
                  getPassword(cluster.id, {
                    onSuccess: (pw) => setRevealedPassword(pw),
                  })
                }
              >
                {t('Reveal password')}
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="danger" icon={<DumpsterIcon />} onClick={() => setDeleteOpen(true)}>
                {t('Delete')}
              </Button>
            </FlexItem>
          </Flex>
        </StackItem>
      </Stack>
    </>
  );
};

export default ClusterDetailsActionButtons;
