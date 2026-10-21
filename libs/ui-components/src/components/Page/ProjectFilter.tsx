import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import FolderIcon from '@patternfly/react-icons/dist/esm/icons/folder-icon';

import { useAllProjects } from '@osac/ui-components/api/v1/project';
import { HierarchicalSelect } from '@osac/ui-components/components/Primitives/HierarchicalSelect';
import { serializePageFilter } from '@osac/ui-components/hooks/use-page-filter';
import { PROJECT_FILTER_PARAM, useSession } from '@osac/ui-components/hooks/use-session';
import { getErrorMessage } from '@osac/ui-components/utils/error';

import { useTranslation } from '../../hooks/useTranslation';
import { buildProjectTree, getFullProjectPath, getProjectName } from '../Project/utils';

import './ProjectFilter.css';

interface ProjectFilterProps {
  showAllProjectsIcon?: boolean;
}

const ProjectFilter = ({ showAllProjectsIcon = false }: ProjectFilterProps) => {
  const { t } = useTranslation();
  const { projects, setProjects } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error } = useAllProjects();

  // Sync selected project paths → URL search params
  useEffect(() => {
    if (projects !== undefined) {
      const serialized = serializePageFilter(projects);
      if (!serialized) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete(PROJECT_FILTER_PARAM);
            return next;
          },
          { replace: true },
        );
        return;
      }

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(PROJECT_FILTER_PARAM, serialized);
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams, projects]);

  // Remove stale selected paths when project data loads
  const selectedProjects = (data ?? []).filter((d) => projects.includes(getFullProjectPath(d)));
  const hasAllProjects = projects.length === selectedProjects.length;

  useEffect(() => {
    if (!isLoading && !hasAllProjects) {
      setProjects(selectedProjects.map(getFullProjectPath));
    }
    // trigger based on hasAllProjects + isLoading only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAllProjects, isLoading]);

  const items = useMemo(
    () =>
      buildProjectTree(data ?? [], (p) => getProjectName(p, t)).map(({ project, depth }) => ({
        id: getFullProjectPath(project),
        label: getProjectName(project, t),
        depth,
      })),
    [data, t],
  );

  return (
    <div className="project-filter">
      <HierarchicalSelect
        items={items}
        selectedIds={projects}
        onSelectionChange={setProjects}
        placeholder={t('All projects')}
        clearLabel={t('All projects')}
        clearIcon={showAllProjectsIcon ? <FolderIcon aria-hidden /> : undefined}
        isLoading={isLoading}
        error={error ? getErrorMessage(error) : undefined}
        aria-label={t('Filter by project')}
      />
    </div>
  );
};

export default ProjectFilter;
