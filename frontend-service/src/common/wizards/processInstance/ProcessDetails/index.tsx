import { FormikProps } from 'formik';
import { IMongoProcessInstancePopulated, IReferencedEntityForProcess, StepsObjectPopulated } from '../../../../interfaces/processes/processInstance';
import { IMongoProcessTemplatePopulated } from '../../../../interfaces/processes/processTemplate';

export interface ProcessDetailsValues {
    template: IMongoProcessTemplatePopulated | null;
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
    processInstance: IMongoProcessInstancePopulated | undefined;
    toPrint?: boolean;
    setContentDisplay?: (val: 'SUMMARY' | 'REVIEWERS') => void;
    contentDisplay?: 'SUMMARY' | 'REVIEWERS';
    viewMode?: boolean;
}
