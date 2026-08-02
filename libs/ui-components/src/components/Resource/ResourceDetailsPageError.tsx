import { useNavigate } from 'react-router-dom';
import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  PageSection,
} from '@patternfly/react-core';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';

import { useTranslation } from '../../hooks/useTranslation';

type ResourceDetailsPageErrorVariant = 'load-error' | 'not-found';

interface ResourceDetailsPageErrorProps {
  parentTo: string;
  parentLabel: string;
  resourceLabel: string;
  variant: ResourceDetailsPageErrorVariant;
  onRetry?: () => void;
}

const variantConfig = (
  t: (key: string, options?: Record<string, unknown>) => string,
  resourceLabel: string,
): Record<
  ResourceDetailsPageErrorVariant,
  {
    icon: typeof ExclamationTriangleIcon;
    status: 'danger' | 'warning';
    title: string;
    body: string;
  }
> => ({
  'load-error': {
    icon: ExclamationTriangleIcon,
    status: 'danger',
    title: t('Could not load {{resourceLabel}}', { resourceLabel }),
    body: t('Unable to load this {{resourceLabel}} right now.', { resourceLabel }),
  },
  'not-found': {
    icon: SearchIcon,
    status: 'warning',
    title: `${resourceLabel.charAt(0).toUpperCase()}${resourceLabel.slice(1)} ${t('not found')}`,
    body: t('This {{resourceLabel}} could not be found.', { resourceLabel }),
  },
});

export const ResourceDetailsPageError = ({
  parentTo,
  parentLabel,
  resourceLabel,
  variant,
  onRetry,
}: ResourceDetailsPageErrorProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { icon: Icon, status, title, body } = variantConfig(t, resourceLabel)[variant];

  return (
    <PageSection hasBodyWrapper={false} isFilled>
      <EmptyState icon={Icon} titleText={title} headingLevel="h1" status={status}>
        <EmptyStateBody>{body}</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            {variant === 'load-error' && onRetry && (
              <Button variant="primary" onClick={onRetry}>
                {t('Retry')}
              </Button>
            )}
            <Button
              variant={variant === 'load-error' && onRetry ? 'link' : 'primary'}
              onClick={() => navigate(parentTo)}
            >
              {t('Return to {{parentLabel}}', { parentLabel: parentLabel.toLowerCase() })}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </PageSection>
  );
};
