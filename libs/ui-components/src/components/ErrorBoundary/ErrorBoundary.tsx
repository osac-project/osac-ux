import React from 'react';
import { Alert } from '@patternfly/react-core';

import { useTranslation } from '../../hooks/useTranslation';
import { getErrorMessage } from '../../utils/error';

interface State {
  hasError: boolean;
  error: Error;
  info: React.ErrorInfo;
}

const ErrorFallback = ({ error }: { error: Error }) => {
  const { t } = useTranslation();
  return (
    <Alert variant="danger" title={t('Unexpected error occurred')} isInline>
      {t('Please reload the page and try again')}
      <details>{getErrorMessage(error)}</details>
    </Alert>
  );
};

class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state = {
    hasError: false,
    error: { message: '', stack: '' } as Error,
    info: { componentStack: '' },
  };

  static getDerivedStateFromError = (/* error */) => {
    return { hasError: true };
  };

  componentDidCatch = (error: Error, info: React.ErrorInfo) => {
    this.setState({ error, info });
  };

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;
    if (!hasError && !children) {
      return null;
    }

    return hasError ? <ErrorFallback error={error} /> : children;
  }
}

export default ErrorBoundary;
