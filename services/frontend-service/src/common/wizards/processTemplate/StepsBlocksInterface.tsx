import { FormikErrors, FormikTouched } from 'formik';
import { IUser } from '@microservices/shared';
import { ProcessTemplateWizardValues } from '.';
import fileDetails from '../../../interfaces/fileDetails';

export interface StepsGenericBlockProps {
    values: ProcessTemplateWizardValues;
    propIndex: number;
    errors: FormikErrors<ProcessTemplateWizardValues>;
    touched?: FormikTouched<ProcessTemplateWizardValues>;
    setFieldValue: (field: string, value: string | IUser | null | fileDetails | undefined, shouldValidate?: boolean) => void;
    title?: string;
    isEditMode: boolean;
    areThereAnyInstances: boolean;
}
