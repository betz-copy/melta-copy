import {
    IMongoProcessInstanceReviewerPopulated,
    IMongoProcessTemplateReviewerPopulated,
    IReferencedEntityForProcess,
    StepsObjectPopulated,
} from '@packages/process';
import { FormikProps } from 'formik';

export interface ProcessDetailsValues {
    template: IMongoProcessTemplateReviewerPopulated | null;
    name: string;
    startDate: Date | null;
    endDate: Date | null;
    details: object;
    detailsAttachments: object;
    entityReferences: Record<string, IReferencedEntityForProcess | string>;
    steps: StepsObjectPopulated;
}

interface IStepProps {
    onNext: () => void;
    onBack: () => void;
}

export interface IDetailsStepProp extends IStepProps {
    detailsFormikData: FormikProps<ProcessDetailsValues>;
    isEditMode?: boolean;
    processInstance: IMongoProcessInstanceReviewerPopulated | undefined;
    toPrint?: boolean;
    setContentDisplay?: (val: 'SUMMARY' | 'REVIEWERS') => void;
    contentDisplay?: 'SUMMARY' | 'REVIEWERS';
    viewMode?: boolean;
}
