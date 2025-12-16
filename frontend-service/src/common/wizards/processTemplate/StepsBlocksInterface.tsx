import { FileDetails, IUser } from '@microservices/shared';
import { FormikErrors, FormikTouched } from 'formik';
import { ProcessTemplateWizardValues } from '.';

export interface StepsGenericBlockProps {
    values: ProcessTemplateWizardValues;
    propIndex: number;
    errors: FormikErrors<ProcessTemplateWizardValues>;
    touched?: FormikTouched<ProcessTemplateWizardValues>;
    setFieldValue: (field: string, value: string | IUser | null | FileDetails | undefined | boolean, shouldValidate?: boolean) => void;
    title?: string;
    isEditMode: boolean;
    areThereAnyInstances: boolean;
}
