import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import ServerIconGlyph from '@patternfly/react-icons/dist/esm/icons/server-icon';

import type { ComputeInstance, InstanceType } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { VmActionsMenu } from './VmActionsMenu';
import { VmInstanceTypeLabel } from './VmInstanceTypeLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { VmStatusLabel } from '../../VmStatusLabel';
import { Timestamp } from '../Primitives/Timestamp';
import ResourceNameField from '../Resource/ResourceNameField';

import './VmCard.css';

interface VmCardProps {
  vm: ComputeInstance;
  instanceType?: InstanceType;
  isInstanceTypesLoading?: boolean;
}

const VmCard = ({ vm, instanceType, isInstanceTypesLoading = false }: VmCardProps) => {
  const { t } = useTranslation();
  const state = vm.status?.state;
  const isDeleting = state === ComputeInstanceState.DELETING;
  const instanceTypeId = vm.spec?.instanceType?.id;

  return (
    <Card isFullHeight className="vm-card">
      <CardHeader
        className="vm-card__header"
        actions={{
          actions: (
            <div className="vm-card__header-actions">
              <VmStatusLabel state={state} />
              {!isDeleting && <VmActionsMenu vm={vm} />}
            </div>
          ),
        }}
      >
        <span className="vm-card__icon" aria-hidden>
          <ServerIconGlyph />
        </span>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <ResourceNameField
              resource={vm}
              detailsUrl={isDeleting ? undefined : `/vms/${encodeURIComponent(vm.id)}`}
              nameLinkClassName="vm-card__title-link"
            />
            <span className="vm-card__secondary-cell">{t('Virtual machine')}</span>
          </StackItem>
          <StackItem>
            <dl className="vm-card__specs-list">
              <div className="vm-card__spec-row">
                <dt className="vm-card__spec-label">{t('Instance type')}</dt>
                <dd className="vm-card__spec-value">
                  <VmInstanceTypeLabel
                    instanceTypeId={instanceTypeId}
                    instanceType={instanceType}
                    isLoading={isInstanceTypesLoading}
                  />
                </dd>
              </div>
              <div className="vm-card__spec-row">
                <dt className="vm-card__spec-label">{t('Internal IP')}</dt>
                <dd className="vm-card__spec-value">
                  {isDeleting ? '—' : vm.status?.internalIpAddress || '—'}
                </dd>
              </div>
              <div className="vm-card__spec-row">
                <dt className="vm-card__spec-label">{t('External IP')}</dt>
                <dd className="vm-card__spec-value">
                  {isDeleting ? '—' : vm.status?.externalIpAddress || '—'}
                </dd>
              </div>
            </dl>
          </StackItem>
          <Divider />
          <StackItem>
            <dl className="vm-card__specs-list">
              <div className="vm-card__spec-row">
                <dt className="vm-card__footer-label">{t('Project')}</dt>
                <dd className="vm-card__footer-value">{vm.metadata?.project || t('Default')}</dd>
              </div>
              <div className="vm-card__spec-row">
                <dt className="vm-card__footer-label">{t('Created')}</dt>
                <dd className="vm-card__footer-value">
                  <Timestamp value={vm.metadata?.creationTimestamp} />
                </dd>
              </div>
            </dl>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default VmCard;
