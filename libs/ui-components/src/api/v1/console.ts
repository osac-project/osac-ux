import { useMutation } from '@tanstack/react-query';

import { ConsoleResourceType, type ConsoleSession, ConsoleType } from '@osac/types';

import { useApiFetch } from '../api-context';

export { ConsoleResourceType, ConsoleType };

export const useCreateConsoleSession = () => {
  const apiFetch = useApiFetch();
  return useMutation({
    mutationFn: (input: {
      resourceId: string;
      resourceType?: ConsoleResourceType;
      type?: ConsoleType;
      clientId?: string;
    }) =>
      apiFetch<ConsoleSession>('v1/console_sessions', {
        method: 'POST',
        body: {
          resourceType: input.resourceType ?? ConsoleResourceType.COMPUTE_INSTANCE,
          resourceId: input.resourceId,
          type: input.type ?? ConsoleType.SERIAL,
          clientId: input.clientId ?? '',
        },
      }),
    retry: false,
  });
};
