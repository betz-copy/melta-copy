import {
    IAggregationType,
    IChart,
    IChartType,
    IColumnOrLineMetaData,
    INUmberMetaData,
    IPermission,
    IPieMetaData,
} from '../interfaces/templateCharts';

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
        permission: IPermission.Protected,
        templateId: travelAgentId,
    },
    {
        name: 'תרשים פאי עפ"י מגדר',
        type: IChartType.Pie,
        metaData: {
            dividedByField: 'gender',
            aggregationType: { type: IAggregationType.CountAll },
        } as IPieMetaData,
        createdBy: userId,
        permission: IPermission.Protected,
        templateId: travelAgentId,
    },
    {
        name: 'גיל מקסימלי של סוכן נסיעות',
        type: IChartType.Number,
        metaData: {
            accumulator: { type: IAggregationType.Maximum, byField: 'age' },
        } as INUmberMetaData,
        createdBy: userId,
        permission: IPermission.Protected,
        templateId: travelAgentId,
    },
    {
        name: 'גיל ממוצע',
        type: IChartType.Column,
        metaData: {
            xAxis: { field: 'age', title: 'גיל' },
            yAxis: { field: { type: IAggregationType.Average, byField: 'age' }, title: 'ממוצע' },
        } as IColumnOrLineMetaData,
        createdBy: userId,
        permission: IPermission.Protected,
        templateId: touristId,
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
        permission: IPermission.Protected,
        templateId: allPropertiesId,
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
        permission: IPermission.Protected,
        templateId: tripId,
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
        permission: IPermission.Protected,
        templateId: flightId,
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
        permission: IPermission.Protected,
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
        permission: IPermission.Protected,
        templateId: phoneId,
    },
];
