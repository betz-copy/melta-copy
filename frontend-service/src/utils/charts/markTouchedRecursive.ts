import { FormikTouched } from 'formik';

export const markTouched = <T extends object>(obj: T): FormikTouched<T> => {
    return Object.fromEntries(
        Object.keys(obj).map((key) => {
            const value = obj[key as keyof T];

            if (value && typeof value === 'object' && !Array.isArray(value)) return [key, markTouched(value)];

            return [key, true];
        }),
    ) as FormikTouched<T>;
};
