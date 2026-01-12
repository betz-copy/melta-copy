import { IAxisField, IChartType, IChartTypeMetaData, IColumnOrLineMetaData, INumberMetaData, IPieMetaData } from '@packages/chart';

export const getMetaDataAxes = (type: IChartType, metaData: IChartTypeMetaData, filter?: string) => {
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
            const { accumulator } = metaData as INumberMetaData;
            xAxis = accumulator;
            break;
        }
        default:
            throw new Error(`Unsupported chart type: ${type}`);
    }

    const appliedFilter = filter
        ? JSON.parse(filter)
        : {
              $and: [
                  {
                      disabled: {
                          $in: ['false'],
                      },
                  },
              ],
          };

    return { xAxis, yAxis, filter: appliedFilter };
};
