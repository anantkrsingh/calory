import { useCallback, type SetStateAction } from 'react';
import {
  useController,
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type UseFormReturn,
  type UseControllerProps,
} from 'react-hook-form';

/** Register native/custom controls while supporting atomic updates to selections. */
export function useFormField<
  T extends FieldValues,
  N extends FieldPath<T>,
>(
  form: UseFormReturn<T>,
  name: N,
  rules?: UseControllerProps<T, N>['rules'],
) {
  const { control, getValues, setValue } = form;
  const { field } = useController({ control, name, rules });
  const setField = useCallback(
    (next: SetStateAction<FieldPathValue<T, N>>) => {
      const value = typeof next === 'function'
        ? (next as (current: FieldPathValue<T, N>) => FieldPathValue<T, N>)(getValues(name))
        : next;
      setValue(name, value, { shouldDirty: true, shouldValidate: false });
    },
    [getValues, name, setValue],
  );
  return [field.value, setField] as const;
}
