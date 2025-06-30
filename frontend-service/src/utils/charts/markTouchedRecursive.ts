import { FormikTouched } from 'formik';

// export const markTouched = <T extends object>(obj: T): FormikTouched<T> => {
//     return Object.fromEntries(
//         Object.keys(obj).map((key) => {
//             const value = obj[key as keyof T];

//             if (value && typeof value === 'object' && !Array.isArray(value)) return [key, markTouched(value)];

//             return [key, true];
//         }),
//     ) as FormikTouched<T>;
// };

export const markTouched = <T extends object>(obj: T): FormikTouched<T> => {
    const result: any = {};

    for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object') {
            if (Array.isArray(value)) {
                result[key] = value.map((item) => (item && typeof item === 'object' ? markTouched(item) : true));
            } else {
                result[key] = markTouched(value);
            }
        } else {
            result[key] = true;
        }
    }

    return result as FormikTouched<T>;
};
