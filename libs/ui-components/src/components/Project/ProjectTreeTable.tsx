import { type CSSProperties, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Content } from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';

import type { Project } from '@osac/types';

import ProjectActionsMenu from './ProjectActionsMenu';
import { getFullProjectPath, getProjectName, getProjectParentPath } from './utils';
import { useTranslation } from '../../hooks/useTranslation';

import './ProjectTreeTable.css';

interface ProjectTreeTableProps {
  projects: Project[];
  rootPath?: string;
}

interface ProjectTreeRow {
  project: Project;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
}

const getProjectAnnotation = (project: Project, key: string) =>
  project.metadata?.annotations?.[key] || '—';

const getProjectServices = (project: Project, t: ReturnType<typeof useTranslation>['t']) => {
  const services = project.metadata?.annotations?.['osac.io/services']
    ?.split(',')
    .map((service) => service.trim())
    .filter(Boolean);

  return services?.length ? t('{{count}} service', { count: services.length }) : t('No services');
};

const ProjectTreeTable = ({ projects, rootPath }: ProjectTreeTableProps) => {
  const { t } = useTranslation();
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string> | null>(null);

  const projectsByPath = useMemo(
    () => new Map(projects.map((project) => [getFullProjectPath(project), project])),
    [projects],
  );
  const childPaths = useMemo(() => {
    const children = new Map<string, Project[]>();

    for (const project of projects) {
      const parentPath = getProjectParentPath(project);
      if (parentPath && projectsByPath.has(parentPath)) {
        const siblings = children.get(parentPath) ?? [];
        siblings.push(project);
        children.set(parentPath, siblings);
      }
    }

    return children;
  }, [projects, projectsByPath]);
  const defaultExpandedIds = useMemo(
    () =>
      new Set(
        [...childPaths.entries()]
          .filter(([, children]) => children.length > 0)
          .map(([parentPath]) => projectsByPath.get(parentPath)?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    [childPaths, projectsByPath],
  );
  const expandedIds = expandedProjectIds ?? defaultExpandedIds;

  const rows = useMemo(() => {
    const result: ProjectTreeRow[] = [];
    const appendChildren = (parentPath: string | null, depth: number) => {
      const siblings = projects
        .filter((project) => (getProjectParentPath(project) ?? null) === parentPath)
        .sort((left, right) => getProjectName(left, t).localeCompare(getProjectName(right, t)));

      for (const project of siblings) {
        const path = getFullProjectPath(project);
        const children = childPaths.get(path) ?? [];
        const isExpanded = expandedIds.has(project.id);
        result.push({ project, depth, hasChildren: children.length > 0, isExpanded });
        if (children.length > 0 && isExpanded) {
          appendChildren(path, depth + 1);
        }
      }
    };

    appendChildren(rootPath ?? null, 0);

    if (!rootPath) {
      for (const project of projects) {
        const parentPath = getProjectParentPath(project);
        const hasKnownParent = parentPath !== undefined && projectsByPath.has(parentPath);

        if (!result.some((row) => row.project.id === project.id) && !hasKnownParent) {
          result.push({ project, depth: 0, hasChildren: false, isExpanded: false });
        }
      }
    }

    return result;
  }, [childPaths, expandedIds, projects, projectsByPath, rootPath, t]);

  const toggleProject = (project: Project) => {
    const next = new Set(expandedIds);
    if (next.has(project.id)) {
      next.delete(project.id);
    } else {
      next.add(project.id);
    }
    setExpandedProjectIds(next);
  };

  return (
    <Table
      aria-label={t('Projects')}
      variant="compact"
      borders={false}
      className="project-tree-table"
    >
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Services')}</Th>
          <Th>{t('Project members')}</Th>
          <Th>{t('IP pool')}</Th>
          <Th>{t('Instance quota')}</Th>
          <Th aria-label={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {rows.map(({ project, depth, hasChildren, isExpanded }) => {
          const projectName = getProjectName(project, t);

          return (
            <Tr key={project.id}>
              <Td dataLabel={t('Name')}>
                <div
                  className="project-tree-table__name-row"
                  style={{ '--project-tree-depth': depth } as CSSProperties}
                >
                  {hasChildren ? (
                    <Button
                      variant="plain"
                      className="project-tree-table__toggle"
                      aria-label={
                        isExpanded
                          ? t('Collapse {{name}}', { name: projectName })
                          : t('Expand {{name}}', { name: projectName })
                      }
                      aria-expanded={isExpanded}
                      onClick={() => toggleProject(project)}
                    >
                      {isExpanded ? <AngleDownIcon aria-hidden /> : <AngleRightIcon aria-hidden />}
                    </Button>
                  ) : (
                    <span className="project-tree-table__spacer" aria-hidden />
                  )}
                  <div className="project-tree-table__name-copy">
                    <Content component="p" className="project-tree-table__primary-cell">
                      <Link to={`/projects/${project.id}`}>{projectName || t('Default')}</Link>
                    </Content>
                    <Content component="p" className="project-tree-table__meta-cell">
                      {project.id}
                    </Content>
                  </div>
                </div>
              </Td>
              <Td dataLabel={t('Services')}>{getProjectServices(project, t)}</Td>
              <Td dataLabel={t('Project members')}>
                {getProjectAnnotation(project, 'osac.io/project-members')}
              </Td>
              <Td dataLabel={t('IP pool')}>{getProjectAnnotation(project, 'osac.io/ip-pool')}</Td>
              <Td dataLabel={t('Instance quota')}>
                {getProjectAnnotation(project, 'osac.io/instance-quota')}
              </Td>
              <Td dataLabel={t('Actions')} isActionCell>
                <ProjectActionsMenu project={project} />
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  );
};

export default ProjectTreeTable;
