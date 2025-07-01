import { FormikTouched } from 'formik';

export const markTouched = <T extends object>(obj: T): FormikTouched<T> => {
    const result: FormikTouched<T> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
            if (Array.isArray(value)) result[key] = value.map((item) => (item && typeof item === 'object' ? markTouched(item) : true));
            else result[key] = markTouched(value);
        } else result[key] = true;
    }

    return result;
};
