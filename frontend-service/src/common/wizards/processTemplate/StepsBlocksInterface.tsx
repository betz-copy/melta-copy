import { FormikErrors, FormikTouched } from 'formik';
import { ProcessTemplateWizardValues } from '.';
import fileDetails from '../../../interfaces/fileDetails';
import { IUser } from '../../../interfaces/users';

export interface StepsGenericBlockProps {
    values: ProcessTemplateWizardValues;
    propIndex: number;
    errors: FormikErrors<ProcessTemplateWizardValues>;
    touched?: FormikTouched<ProcessTemplateWizardValues>;
    setFieldValue: (field: string, value: string | IUser | null | fileDetails | undefined | boolean, shouldValidate?: boolean) => void;
    title?: string;
    isEditMode: boolean;
    areThereAnyInstances: boolean;
}
