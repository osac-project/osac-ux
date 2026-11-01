import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Content,
  Divider,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import RhStandardServerIcon from '@patternfly/react-icons/dist/esm/icons/rh-standard-server-icon';

import { BareMetalInstanceState } from '@osac/types';
import type { BareMetalInstance, BareMetalInstanceType } from '@osac/types';

import { BareMetalActionsMenu } from './BareMetalActionsMenu';
import { BareMetalStatusLabel } from './BareMetalStatusLabel';
import { useTranslation } from '../../hooks/useTranslation';
import { Timestamp } from '../Primitives/Timestamp';
import ResourceNameField from '../Resource/ResourceNameField';

import './BareMetalCard.css';

interface BareMetalCardProps {
  instance: BareMetalInstance;
  instanceType?: BareMetalInstanceType;
}

const BareMetalCard = ({ instance, instanceType }: BareMetalCardProps) => {
  const { t } = useTranslation();
  const isDeleting = instance.status?.state === BareMetalInstanceState.DELETING;

  return (
    <Card isFullHeight className="baremetal-card">
      <CardHeader
        className="baremetal-card__header"
        actions={{
          actions: (
            <div className="baremetal-card__header-actions">
              <BareMetalStatusLabel state={instance.status?.state} />
              {!isDeleting && <BareMetalActionsMenu instance={instance} />}
            </div>
          ),
        }}
      >
        <span className="baremetal-card__icon" aria-hidden>
          <RhStandardServerIcon />
        </span>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem className="baremetal-card__name">
            <ResourceNameField
              resource={instance}
              detailsUrl={isDeleting ? undefined : `/bare-metal/${encodeURIComponent(instance.id)}`}
              nameLinkClassName="baremetal-card__title-link"
            />
            <Content component="small" className="baremetal-card__secondary-cell">
              {instance.spec?.catalogItem?.name ?? t('Bare metal instance')}
            </Content>
          </StackItem>
          <StackItem>
            <dl className="baremetal-card__specs-list">
              <div className="baremetal-card__spec-row">
                <dt className="baremetal-card__spec-label">{t('CPU')}</dt>
                <dd className="baremetal-card__spec-value">
                  {instanceType?.spec?.hardware?.cpu?.cores
                    ? t('{{count}} cores', { count: instanceType.spec.hardware.cpu.cores })
                    : '—'}
                </dd>
              </div>
              <div className="baremetal-card__spec-row">
                <dt className="baremetal-card__spec-label">{t('RAM')}</dt>
                <dd className="baremetal-card__spec-value">
                  {instanceType?.spec?.hardware?.memory?.totalGb
                    ? t('{{count}} GB', {
                        count: Number(instanceType.spec.hardware.memory.totalGb),
                      })
                    : '—'}
                </dd>
              </div>
              <div className="baremetal-card__spec-row">
                <dt className="baremetal-card__spec-label">{t('GPU')}</dt>
                <dd className="baremetal-card__spec-value">
                  {instanceType?.spec?.hardware?.accelerators.length
                    ? instanceType.spec.hardware.accelerators
                        .map((accelerator) =>
                          [accelerator.vendor, accelerator.model].filter(Boolean).join(' '),
                        )
                        .join(', ')
                    : '—'}
                </dd>
              </div>
              <div className="baremetal-card__spec-row">
                <dt className="baremetal-card__spec-label">{t('OS Image')}</dt>
                <dd className="baremetal-card__spec-value">
                  {instance.spec?.diskImage?.name ?? '—'}
                </dd>
              </div>
            </dl>
          </StackItem>
          <Divider />
          <StackItem>
            <dl className="baremetal-card__footer-list">
              <div className="baremetal-card__spec-row">
                <dt className="baremetal-card__footer-label">{t('Project')}</dt>
                <dd className="baremetal-card__footer-value">
                  {instance.metadata?.project ?? t('Default')}
                </dd>
              </div>
              <div className="baremetal-card__spec-row">
                <dt className="baremetal-card__footer-label">{t('Created')}</dt>
                <dd className="baremetal-card__footer-value">
                  <Timestamp value={instance.metadata?.creationTimestamp} />
                </dd>
              </div>
            </dl>
            <div className="baremetal-card__ssh">
              <Button
                variant="primary"
                isBlock
                isDisabled={isDeleting}
                className="baremetal-card__ssh-button"
              >
                {t('Connect via SSH')}
              </Button>
            </div>
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

export default BareMetalCard;
