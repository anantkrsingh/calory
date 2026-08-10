import type { BodyMeasurement } from '@fitness/types';
import type { CreateMeasurementInput } from '@fitness/validation';
import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { measurementsService } from '@/services/measurements.service';

export function useCreateMeasurement(): UseMutationResult<
  BodyMeasurement,
  Error,
  CreateMeasurementInput
> {
  return useMutation({
    mutationFn: (input: CreateMeasurementInput) =>
      measurementsService.create(input),
  });
}
