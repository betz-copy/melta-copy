import { FormikProps } from 'formik';
import { JSX } from 'react';
import { StepType } from '../common/wizards';
import { IFilterTemplate } from '../common/wizards/entityTemplate/commonInterfaces';
import { IFrameWizardValues } from '../common/wizards/iFrame';
import { ChartsAndGenerator, IChart } from './charts';
import { ISearchFilter } from './entities';
import { IMongoIFrame } from './iFrames';

export enum DashboardItemType {
    Table = 'table',
    Chart = 'chart',
    Iframe = 'iframe',
}

export interface MongoBaseFields {
    _id: string;
    createdAt: string;
    updatedAt: string;
}

export interface TableMetaData {
    templateId: string;
    name: string;
    description: string;
    columns: string[];
    filter?: string;
    childTemplateId?: string;
}

export interface TableItem {
    type: DashboardItemType.Table;
    metaData: TableMetaData;
}

interface ChartItem {
    type: DashboardItemType.Chart;
    metaData: string;
}

interface IframeItem {
    type: DashboardItemType.Iframe;
    metaData: string;
}

export type DashboardItem = TableItem | ChartItem | IframeItem;

interface ChartItemPopulated {
    type: DashboardItemType.Chart;
    metaData: ChartsAndGenerator;
}

interface IframeItemPopulated {
    type: DashboardItemType.Iframe;
    metaData: IMongoIFrame;
}

export type DashboardItemPopulated = TableItem | ChartItemPopulated | IframeItemPopulated;

export type MongoDashboardItem = DashboardItem & MongoBaseFields;
export type MongoDashboardItemPopulated = DashboardItemPopulated & MongoBaseFields;

export interface TableForm extends Omit<TableMetaData, 'filter'> {
    filter?: IFilterTemplate[];
}

export interface ChartForm extends Omit<IChart, 'filter'> {
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
    Edit = 'edit',
    ReadOnly = 'readonly',
    Add = 'add',
}

export type TabStepComponent<T extends object> = Omit<StepType<T>, 'component'> & {
    component: (formikProps: FormikProps<T>) => JSX.Element;
};
