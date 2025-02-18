import {
    IAxisField,
    IChartType,
    IChartTypeMetaData,
    IColumnOrLineMetaData,
    INUmberMetaData,
    IPieMetaData,
} from '../../express/templateCharts/interface';
import { ISearchFilter } from '../../externalServices/instanceService/interfaces/entities';

export const getMetaDataAxes = (type: IChartType, metaData: IChartTypeMetaData, filter: ISearchFilter) => {
    let xAxis: IAxisField;
    let yAxis: IAxisField | undefined;

    switch (type) {
        case IChartType.Column:
        case IChartType.Line: {
            const chartMetaData = metaData as IColumnOrLineMetaData;
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

    const appliedFilter = filter ?? {
        $and: [
            {
                disabled: {
                    $in: ['false'],
                },
            },
        ],
    };

    return { xAxis, yAxis: yAxis || undefined, filter: appliedFilter };
};
