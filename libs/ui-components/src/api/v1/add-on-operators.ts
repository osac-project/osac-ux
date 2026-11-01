import { AddOnOperators, type AddOnOperator } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { useApiQuery } from '../use-api-query';

type AddOnOperatorsQueryOptions = {
  enabled?: boolean;
};

export const useAddOnOperators = (
  params: ListParams = {},
  options: AddOnOperatorsQueryOptions = {},
) => {
  const client = useApiFetch(AddOnOperators);
  return useApiQuery({
    queryKey: apiQueryKey('v1/add_on_operators', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const addOnOperatorDisplayName = (operator: AddOnOperator): string =>
  operator.title?.trim() || operator.metadata?.name || operator.id;
