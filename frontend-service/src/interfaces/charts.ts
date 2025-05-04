import { IAggregation, IAxisField, IChartType } from '@microservices/shared-interfaces';

export type HighchartType = Exclude<IChartType, IChartType.Number>;

export const isAggregation = (field: IAxisField): field is IAggregation => typeof field !== 'string';
