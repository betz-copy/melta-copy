import { IChart, IMongoChart } from '@packages/chart';
import { DashboardItemType, TableMetaData } from '@packages/dashboard';
import { ISearchFilter } from '@packages/entity';
import { IFrame } from '@packages/iframe';
import { FormikProps } from 'formik';
import { JSX } from 'react';
import { StepType } from '../common/wizards';
import { IFilterTemplate } from '../common/wizards/entityTemplate/commonInterfaces';
import { IFrameWizardValues } from '../common/wizards/iFrame';

export interface TableForm extends Omit<TableMetaData, 'filter'> {
    filter?: IFilterTemplate[];
}

export interface ChartForm extends Omit<IMongoChart, 'filter'> {
    filter?: IFilterTemplate[];
}

export interface ChartToBackend extends Omit<IChart, 'filter'> {
    filter?: ISearchFilter;
}
interface TableToBackend extends Omit<TableMetaData, 'filter'> {
    filter?: ISearchFilter;
}

export interface TableItemToBackend {
    type: DashboardItemType.Table;
    metaData: TableToBackend;
}

export type DashboardItemForm = ChartForm | IFrameWizardValues | TableForm;

export enum ViewMode {
    ReadOnly = 'readonly',
    Edit = 'edit',
    Add = 'add',
}

export type TabStepComponent<T extends object> = Omit<StepType<T>, 'component'> & {
    component: (formikProps: FormikProps<T>) => JSX.Element;
};
export type { IFrame };
