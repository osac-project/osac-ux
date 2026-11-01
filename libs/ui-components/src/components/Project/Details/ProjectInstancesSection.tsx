import { Link } from 'react-router-dom';
import { Content, Label, Title } from '@patternfly/react-core';
import ClusterIcon from '@patternfly/react-icons/dist/esm/icons/cluster-icon';
import ServerIcon from '@patternfly/react-icons/dist/esm/icons/server-icon';

import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { projectInstancesMock } from './project-details-mock-data';

const ProjectInstancesSection = () => {
  const { t } = useTranslation();

  return (
    <div className="project-details-page__column">
      <Title headingLevel="h2" size="lg">
        {t('Services')} ({projectInstancesMock.length})
      </Title>
      <div className="project-details-page__instances" aria-label={t('Services')}>
        {projectInstancesMock.map((instance) => {
          const InstanceIcon = instance.kind === 'Cluster' ? ClusterIcon : ServerIcon;

          return (
            <div className="project-details-page__instance" key={instance.name}>
              <InstanceIcon className="project-details-page__instance-icon" aria-hidden />
              <div>
                <Content component="p">
                  <Link to={instance.href}>{instance.name}</Link>
                  <br />
                  {instance.type} · {instance.created}
                </Content>
              </div>
              <Label isCompact color="green">
                {t('Running')}
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectInstancesSection;
