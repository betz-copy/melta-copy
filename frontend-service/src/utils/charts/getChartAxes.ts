import i18next from 'i18next';
import * as Yup from 'yup';
import {
    IAggregationType,
    IAxisField,
    IColumnOrLineMetaData,
    IBasicChart,
    IChartType,
    IChartTypeMetaData,
    INUmberMetaData,
    IPermission,
    IPieMetaData,
    IAxis,
} from '../../interfaces/charts';

export const getChartAxes = (type: IChartType, metaData: IChartTypeMetaData, includeTitle: boolean = false) => {
    let xAxis: IAxis | IAxisField;
    let yAxis: IAxis | IAxisField | undefined;

    switch (type) {
        case IChartType.Column:
        case IChartType.Line: {
            const chartMetaData = metaData as IColumnOrLineMetaData;
            xAxis = includeTitle ? chartMetaData.xAxis : chartMetaData.xAxis.field;
            yAxis = includeTitle ? chartMetaData.yAxis : chartMetaData.yAxis.field;
            break;
        }
        case IChartType.Pie: {
            const { dividedByField, aggregationType } = metaData as IPieMetaData;
            xAxis = dividedByField;
            yAxis = aggregationType;
            break;
        }
        case IChartType.Number: {
            const { accumulator } = metaData as INUmberMetaData;
            xAxis = accumulator;
            break;
        }
        default:
            throw new Error(`Unsupported chart type: ${type}`);
    }

    return { xAxis, yAxis };
};

export const initializeChartMetaData = (type: IChartType): IChartTypeMetaData => {
    const chartMetadataMap: Record<IChartType, IChartTypeMetaData> = {
        [IChartType.Column]: {
            xAxis: { field: '', title: '' },
            yAxis: { field: '', title: '' },
        } as IColumnOrLineMetaData,
        [IChartType.Line]: {
            xAxis: { field: '', title: '' },
            yAxis: { field: '', title: '' },
        } as IColumnOrLineMetaData,
        [IChartType.Pie]: {
            dividedByField: '',
            aggregationType: { type: 'countAll' },
        } as IPieMetaData,
        [IChartType.Number]: {
            accumulator: { type: 'countAll' },
        } as INUmberMetaData,
    };

    const metaData = chartMetadataMap[type];

    if (!metaData) throw new Error(`Unsupported chart type: ${type}`);

    return metaData;
};

export const initialValues: IBasicChart = {
    name: '',
    description: '',
    type: IChartType.Line,
    metaData: {
        xAxis: { field: '', title: '' },
        yAxis: { field: '', title: '' },
    } as IColumnOrLineMetaData,
    permission: IPermission.Private,
};

const aggregationSchema = Yup.object({
    type: Yup.mixed<IAggregationType>().oneOf(Object.values(IAggregationType)).required('validation.required'),
    byField: Yup.string().optional(),
});

const axisSchema = Yup.object({
    title: Yup.string().min(2, i18next.t('validation.variableName')),
    field: Yup.mixed<IAxisField>()
        .test('is-valid-field', i18next.t('validation.required'), (value) => {
            if (typeof value === 'string') return true;
            if (typeof value === 'object' && value !== null && 'type' in value) return aggregationSchema.isValidSync(value);
            return false;
        })
        .required(i18next.t('validation.required')),
});

const IBarOrLineMetaDataSchema = Yup.object({
    xAxis: axisSchema.required().required(i18next.t('validation.required')),
    yAxis: axisSchema.required().required(i18next.t('validation.required')),
});

const IPieMetaDataSchema = Yup.object({
    dividedByField: Yup.string().required(i18next.t('validation.required')),
    aggregationType: aggregationSchema.required(i18next.t('validation.required')),
});

const INUmberMetaDataSchema = Yup.object({
    accumulator: aggregationSchema.required(i18next.t('validation.required')),
});

const getMetaDataSchema = (type: IChartType) => {
    const schemaMap: Record<IChartType, Yup.AnySchema> = {
        [IChartType.Column]: IBarOrLineMetaDataSchema.required('MetaData is required for Column chart'),
        [IChartType.Line]: IBarOrLineMetaDataSchema.required('MetaData is required for Line chart'),
        [IChartType.Number]: INUmberMetaDataSchema.required('MetaData is required for Number chart'),
        [IChartType.Pie]: IPieMetaDataSchema.required('MetaData is required for Pie chart'),
    };

    return schemaMap[type];
};

export const chartValidationSchema = Yup.object({
    name: Yup.string().min(2, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    description: Yup.string().min(2, i18next.t('validation.variableName')),
    type: Yup.mixed<IChartType>().oneOf(Object.values(IChartType)).required(i18next.t('validation.required')),
    metaData: Yup.mixed()
        .when('type', (type: IChartType, schema: Yup.AnySchema) => schema.concat(getMetaDataSchema(type)))
        .required('metaData is required'),
    permission: Yup.mixed<IPermission>().oneOf(Object.values(IPermission)).required(i18next.t('validation.required')),
});
