import i18next from 'i18next';
import * as Yup from 'yup';
import {
    IAggregationType,
    IAxisField,
    IBarOrLineMetaData,
    IBasicChart,
    IChartType,
    IChartTypeMetaData,
    INUmberMetaData,
    IPermission,
    IPieMetaData,
} from '../../interfaces/charts';

export const getChartAxes = (type: IChartType, metaData: IChartTypeMetaData) => {
    let xAxis;
    let yAxis;

    switch (type) {
        case IChartType.Bar:
        case IChartType.Line: {
            const chartMetaData = metaData as IBarOrLineMetaData;
            xAxis = chartMetaData.xAxis.field;
            yAxis = chartMetaData.yAxis.field;
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
        [IChartType.Bar]: {
            xAxis: { field: '', title: '' },
            yAxis: { field: '', title: '' },
        } as IBarOrLineMetaData,
        [IChartType.Line]: {
            xAxis: { field: '', title: '' },
            yAxis: { field: '', title: '' },
        } as IBarOrLineMetaData,
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
    } as IBarOrLineMetaData,
    permission: IPermission.Private,
};

const aggregationSchema = Yup.object({
    type: Yup.mixed<IAggregationType>().oneOf(Object.values(IAggregationType)).required('validation.required'),
    byField: Yup.string().optional(),
});

const axisSchema = Yup.object({
    title: Yup.string().min(2, i18next.t('validation.variableName')),
    field: Yup.mixed<IAxisField>()
        .test('is-valid-field', 'Invalid field type', (value) => {
            if (typeof value === 'string') return true;
            if (typeof value === 'object' && value !== null && 'type' in value) return aggregationSchema.isValidSync(value);
            return false;
        })
        .required(i18next.t('validation.required')),
});

const IBarOrLineMetaDataSchema = Yup.object({
    xAxis: axisSchema.required(),
    yAxis: axisSchema.required(),
});

const IPieMetaDataSchema = Yup.object({
    dividedByField: Yup.string().required(i18next.t('validation.required')),
    aggregationType: aggregationSchema.required(i18next.t('validation.required')),
});

const INUmberMetaDataSchema = Yup.object({
    accumulator: aggregationSchema.required(i18next.t('validation.required')),
});

export const chartValidationSchema = Yup.object({
    name: Yup.string().min(2, i18next.t('validation.variableName')).required(i18next.t('validation.required')),
    description: Yup.string().min(2, i18next.t('validation.variableName')),
    type: Yup.mixed<IChartType>().oneOf(Object.values(IChartType)).required(i18next.t('validation.required')),
    /// cleaner code
    metaData: Yup.mixed<IChartTypeMetaData>()
        .when('type', {
            is: IChartType.Bar,
            then: IBarOrLineMetaDataSchema.required('MetaData is required for Bar chart'),
            otherwise: Yup.mixed<IChartTypeMetaData>().when('type', {
                is: IChartType.Line,
                then: IBarOrLineMetaDataSchema.required('MetaData is required for Line chart'),
                otherwise: Yup.mixed<IChartTypeMetaData>().when('type', {
                    is: IChartType.Number,
                    then: INUmberMetaDataSchema.required('MetaData is required for Number chart'),
                    otherwise: Yup.mixed<IChartTypeMetaData>().when('type', {
                        is: IChartType.Pie,
                        then: IPieMetaDataSchema.required('MetaData is required for Pie chart'),
                        otherwise: Yup.mixed().notRequired(),
                    }),
                }),
            }),
        })
        .required('MetaData is required'),
    permission: Yup.mixed<IPermission>().oneOf(Object.values(IPermission)).required(i18next.t('validation.required')),
});
