import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';

export const useParseRecipe = () => {
  return useMutation({
    mutationFn: (text: string) => apiClient.parseRecipe(text),
  });
};