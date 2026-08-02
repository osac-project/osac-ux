import { Card, CardBody, CardTitle, Content, Label, LabelGroup } from '@patternfly/react-core';

import type { NetworkClass } from '@osac/types';

import { NetworkStatusLabel } from './NetworkStatusLabel';
import { useNetworkClasses } from '../../api/v1/networking';
import { useTranslation } from '../../hooks/useTranslation';
import ListPageBody from '../Page/ListPageBody';

import styles from '../../styles/components.module.css';

export const NetworkClassesList = () => {
  const { t } = useTranslation();
  const { data: classes = [], isLoading, error } = useNetworkClasses();

  return (
    <ListPageBody isLoading={isLoading} error={error}>
      {classes.length === 0 ? (
        <Content component="p">{t('No network classes available.')}</Content>
      ) : (
        <div className={styles.networkClassGrid}>
          {classes.map((nc: NetworkClass) => (
            <Card key={nc.id} isCompact>
              <CardTitle>
                <span>{nc.title || nc.metadata?.name || nc.id}</span>
                {nc.isDefault && (
                  <Label isCompact color="blue" style={{ marginLeft: 8 }}>
                    {t('Default')}
                  </Label>
                )}
              </CardTitle>
              <CardBody>
                <NetworkStatusLabel state={nc.status?.state} />
                {nc.description && (
                  <Content component="p" style={{ marginTop: 8 }}>
                    {nc.description}
                  </Content>
                )}
                {nc.capabilities && (
                  <LabelGroup style={{ marginTop: 8 }}>
                    {nc.capabilities.supportsIpv4 && <Label isCompact>{t('IPv4')}</Label>}
                    {nc.capabilities.supportsIpv6 && <Label isCompact>{t('IPv6')}</Label>}
                    {nc.capabilities.supportsDualStack && (
                      <Label isCompact>{t('Dual-stack')}</Label>
                    )}
                  </LabelGroup>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </ListPageBody>
  );
};
