import { useNavigate } from 'react-router-dom';
import { Button, Content, Flex, FlexItem, Label, Title } from '@patternfly/react-core';
import PlusCircleIcon from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

import { useSession } from '@osac/ui-components/hooks/use-session';
import { useTranslation } from '@osac/ui-components/hooks/useTranslation';

import { projectUsersMock } from './project-details-mock-data';

interface ProjectUsersRailProps {
  projectId: string;
}

const ProjectUsersRail = ({ projectId }: ProjectUsersRailProps) => {
  const navigate = useNavigate();
  const { role } = useSession();
  const { t } = useTranslation();

  return (
    <div className="details-page__sidebar">
      <Flex
        alignItems={{ default: 'alignItemsBaseline' }}
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        className="project-users__header"
      >
        <Title headingLevel="h2" size="md" className="project-users__title">
          {t('Project members')} ({projectUsersMock.length})
        </Title>
        {role === 'tenant-admin' && (
          <Button
            variant="link"
            icon={<PlusCircleIcon />}
            onClick={() => navigate(`/project-membership/create/${projectId}`)}
          >
            {t('Add')}
          </Button>
        )}
      </Flex>
      <ul className="project-users__people" aria-label={t('Project members')}>
        {projectUsersMock.map((user) => (
          <li key={user.email} className="project-users__person">
            <Content component="p" className="project-users__name">
              {user.name}
            </Content>
            <Content component="p" className="project-users__email">
              {user.email}
            </Content>
            <Flex>
              <FlexItem>
                <Label isCompact color="blue">
                  {t('Manager')}
                </Label>
              </FlexItem>
            </Flex>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectUsersRail;
