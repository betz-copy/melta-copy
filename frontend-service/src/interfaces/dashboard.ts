import React from 'react';
import { FormikProps } from 'formik';
import { ObjectShape } from 'yup/lib/object';
import * as Yup from 'yup';
import { ChartsAndGenerator, IChart } from './charts';
import { IGraphFilterBodyBatch } from './entities';
import { IFrame, IMongoIFrame } from './iFrames';

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
    filter?: IGraphFilterBodyBatch;
}

export interface TableItem {
    type: DashboardItemType.Table;
    metaData: TableMetaData;
}

export interface ChartItem {
    type: DashboardItemType.Chart;
    metaData: string;
}

export interface IframeItem {
    type: DashboardItemType.Iframe;
    metaData: string;
}

export type DashboardItem = TableItem | ChartItem | IframeItem;

export interface ChartItemPopulated {
    type: DashboardItemType.Chart;
    metaData: ChartsAndGenerator;
}

export interface IframeItemPopulated {
    type: DashboardItemType.Iframe;
    metaData: IMongoIFrame;
}

export type DashboardItemPopulated = TableItem | ChartItemPopulated | IframeItemPopulated;

export type MongoDashboardItem = DashboardItem & MongoBaseFields;
export type MongoDashboardItemPopulated = DashboardItemPopulated & MongoBaseFields;

export enum ViewMode {
    Edit = 'edit',
    ReadOnly = 'readonly',
    Add = 'add',
}
