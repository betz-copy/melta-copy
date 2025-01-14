import * as mongoose from 'mongoose';
import { IChartDocument, IChartType, IPermission } from './interface';

// const AggregationSchema = new mongoose.Schema({
//     type: {
//         type: String,
//         enum: Object.values(IAggregationType),
//         required: true,
//     },
//     byField: {
//         type: String,
//     },
// });

// const AxisSchema = new mongoose.Schema<IAxis>({
//     title: String,
//     field: { type: mongoose.Schema.Types.Mixed },
// });

// const BarOrLineMetaDataSchema = new mongoose.Schema<IBarOrLineMetaData>({
//     xAxis: {
//         type: AxisSchema,
//         required: true,
//     },
//     yAxis: {
//         type: AxisSchema,
//         required: true,
//     },
// });

// const PieMetaDataSchema = new mongoose.Schema<IPieMetaData>({
//     dividedByField: {
//         type: String,
//         required: true,
//     },
//     aggregationType: { type: AggregationSchema, required: true },
// });

// const NumberMetaDataSchema = new mongoose.Schema<INUmberMetaData>({
//     accumulator: { type: AggregationSchema, required: true },
// });

const ChartSchema = new mongoose.Schema<IChartDocument>(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: Object.values(IChartType),
            required: true,
        },
        metaData: {
            type: Object,
            required: true,
        },
        templateId: {
            type: String,
            required: true,
            index: true,
        },
        permission: {
            type: String,
            enum: Object.values(IPermission),
            required: true,
        },
        createdBy: {
            type: String,
        },
        filter: {
            type: Object,
        },
    },
    { timestamps: true, versionKey: false },
);

export default ChartSchema;
