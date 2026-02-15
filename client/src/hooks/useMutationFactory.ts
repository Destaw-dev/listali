import { QueryKey, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '../contexts/NotificationContext';

type InvalidateResolver<TData, TVariables> =
  | QueryKey[]
  | ((data: TData, variables: TVariables) => QueryKey[]);

interface MutationFactoryOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  successMessage?: string;
  invalidateQueries?: InvalidateResolver<TData, TVariables>;
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}

export const useMutationFactory = <TData, TVariables>(
  options: MutationFactoryOptions<TData, TVariables>
) => {
  const queryClient = useQueryClient();
  const { showSuccess, handleApiError } = useNotification();

  return useMutation<TData, Error, TVariables>({
    mutationFn: options.mutationFn,
    onSuccess: (data, variables) => {
      if (options.invalidateQueries) {
        const keys =
          typeof options.invalidateQueries === 'function'
            ? options.invalidateQueries(data, variables)
            : options.invalidateQueries;

        keys.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });
      }

      options.onSuccess?.(data, variables);

      if (options.successMessage) {
        showSuccess(options.successMessage);
      }
    },
    onError: (error, variables) => {
      if (options.onError) {
        options.onError(error, variables);
        return;
      }
      handleApiError(error);
    },
  });
};
