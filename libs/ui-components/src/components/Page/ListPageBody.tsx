import * as React from 'react';
import { Alert, Bullseye, Spinner } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

type ListPageBodyProps = {
  isLoading: boolean;
  error: unknown;
};

const ListPageBody = ({
  isLoading,
  error,
  children,
}: React.PropsWithChildren<ListPageBodyProps>) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }
  if (error) {
    return (
      <Alert variant="danger" title={t('An error occurred')} isInline>
        {getErrorMessage(error)}
      </Alert>
    );
  }

  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ListPageBody;
