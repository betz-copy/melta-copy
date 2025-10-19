/* eslint-disable import/prefer-default-export */
import { IAggregationType, IChart, IChartType, IColumnOrLineMetaData, INUmberMetaData, IChartPermission, IPieMetaData } from '@microservices/shared';

export const chartsCreator = (
    travelAgentId: string,
    touristId: string,
    allPropertiesId: string,
    tripId: string,
    flightId: string,
    phoneId: string,
    creditCardId: string,
    userId: string,
): IChart[] => [
    {
        name: 'כמות רשומות לפי שם סוכן נסיעות',
        type: IChartType.Line,
        metaData: {
            xAxis: { title: 'שם פרטי', field: 'firstName' },
            yAxis: { title: 'כמות רשומות', field: { type: IAggregationType.CountAll } },
        } as IColumnOrLineMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: travelAgentId,
        description: '',
    },
    {
        name: 'תרשים פאי עפ"י מגדר',
        type: IChartType.Pie,
        metaData: {
            dividedByField: 'gender',
            aggregationType: { type: IAggregationType.CountAll },
        } as IPieMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: travelAgentId,
        description: '',
    },
    {
        name: 'גיל מקסימלי של סוכן נסיעות',
        type: IChartType.Number,
        metaData: {
            accumulator: { type: IAggregationType.Maximum, byField: 'age' },
        } as INUmberMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: travelAgentId,
        description: '',
    },
    {
        name: 'גיל ממוצע',
        type: IChartType.Column,
        metaData: {
            xAxis: { field: 'age', title: 'גיל' },
            yAxis: { field: { type: IAggregationType.Average, byField: 'age' }, title: 'ממוצע' },
        } as IColumnOrLineMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: touristId,
        description: '',
    },
    {
        name: 'תרשים פאי עפ" רשימה',
        type: IChartType.Pie,
        metaData: {
            dividedByField: 'enum',
            aggregationType: {
                type: IAggregationType.CountAll,
            },
        } as IPieMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: allPropertiesId,
        description: '',
    },
    {
        name: 'כמות רשומות לפי תאריך',
        type: IChartType.Column,
        metaData: {
            xAxis: {
                field: 'startDate',
                title: 'תאירך התחלה',
            },
            yAxis: {
                field: { type: IAggregationType.CountAll },
                title: 'כמות רשומות',
            },
        } as IColumnOrLineMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: tripId,
        description: '',
    },
    {
        name: 'כמות רשומות לפי סוג מושב',
        type: IChartType.Pie,
        metaData: {
            dividedByField: 'seatType',
            aggregationType: {
                type: IAggregationType.CountAll,
            },
        } as IPieMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: flightId,
        description: '',
    },
    {
        name: 'סכום תקרה לכל שם',
        description: '',
        type: IChartType.Line,
        metaData: {
            xAxis: {
                field: 'name',
                title: 'שם',
            },
            yAxis: {
                field: {
                    type: 'sum',
                    byField: 'monthlyAmount',
                },
                title: 'סכום תקרה',
            },
        } as IColumnOrLineMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: creditCardId,
    },
    {
        name: 'כמות טלפונים',
        description: '',
        type: IChartType.Number,
        metaData: {
            accumulator: {
                type: 'countAll',
            },
        } as INUmberMetaData,
        createdBy: userId,
        permission: IChartPermission.Protected,
        templateId: phoneId,
    },
];
