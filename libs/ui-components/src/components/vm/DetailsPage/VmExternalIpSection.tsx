import { useState } from 'react';
import {
  Button,
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Title,
} from '@patternfly/react-core';

import { ExternalIPAttachments } from '@osac/types';
import type { ComputeInstance } from '@osac/types';

import { useListResource } from '../../../api/use-resource';
import { computeInstanceAttachmentFilter } from '../../../api/v1/external-ip-data';
import { useTranslation } from '../../../hooks/useTranslation';
import DetachExternalIpModal from './DetachExternalIpModal';

interface VmExternalIpSectionProps {
  vm: ComputeInstance;
}

const VmExternalIpSection = ({ vm }: VmExternalIpSectionProps) => {
  const { t } = useTranslation();
  const [detachOpen, setDetachOpen] = useState(false);
  const externalIp = vm.status?.externalIpAddress;
  const { data: attachmentResponse } = useListResource(
    ExternalIPAttachments,
    { filter: computeInstanceAttachmentFilter(vm.id) },
    { enabled: Boolean(externalIp) },
  );
  const attachment = attachmentResponse?.items?.[0];

  return (
    <>
      {detachOpen && attachment ? (
        <DetachExternalIpModal
          attachment={attachment}
          onClose={() => setDetachOpen(false)}
        />
      ) : null}
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
        <FlexItem>
          <Title headingLevel="h2" size="lg">
            {t('External IP')}
          </Title>
        </FlexItem>
        <FlexItem>
          <DescriptionList isCompact className="details-page__overview">
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Host')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  <FlexItem>{externalIp || '—'}</FlexItem>
                  {externalIp && attachment ? (
                    <FlexItem>
                      <Button variant="link" isInline onClick={() => setDetachOpen(true)}>
                        {t('Detach')}
                      </Button>
                    </FlexItem>
                  ) : null}
                </Flex>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('SSH command')}</DescriptionListTerm>
              <DescriptionListDescription>
                {externalIp ? (
                  <ClipboardCopy isReadOnly hoverTip={t('Copy')} clickTip={t('Copied')}>
                    {`ssh cloud-user@${externalIp}`}
                  </ClipboardCopy>
                ) : (
                  '—'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
      </Flex>
    </>
  );
};

export default VmExternalIpSection;
