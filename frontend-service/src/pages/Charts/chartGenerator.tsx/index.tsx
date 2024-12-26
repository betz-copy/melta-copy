import React from 'react';
import { useQuery } from 'react-query';
import { IAxis, IBasicChart, IChartType } from '../../../interfaces/charts';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getChartOfTemplate } from '../../../services/entitiesService';
import { NumberChartGenerator } from './NumberChartGenerator';
import { HiighchartGenerator } from './highChartgenerator';

interface IChartGenerator {
    formikValues: IBasicChart;
    template: IMongoEntityTemplatePopulated;
}

const ChartGenerator: React.FC<IChartGenerator> = ({ formikValues, template }) => {
    const { type, xAxis, yAxis } = formikValues;

    const isAggregationValid = ({ field }: IAxis): boolean => {
        if (typeof field === 'string') return Boolean(field);
        if (field.type === 'countAll') return true;
        return Boolean(field.byField);
    };

    const isQueryEnabled = type === IChartType.Number ? isAggregationValid(xAxis) : isAggregationValid(xAxis) && isAggregationValid(yAxis);

    const { data, isLoading } = useQuery(
        ['chart', template._id, formikValues.xAxis.field, formikValues.yAxis.field],
        () => {
            const { field: xField } = xAxis;
            const { field: yField } = yAxis;

            const yAxisField = type === IChartType.Number ? undefined : yField;

            return getChartOfTemplate(xField, yAxisField, template._id);
        },
        {
            enabled: Boolean(isQueryEnabled),
        },
    );

    if (type === IChartType.Number) return <NumberChartGenerator data={data} formikValues={formikValues} />;
    return <HiighchartGenerator data={data} isLoading={isLoading} isQueryEnabled={isQueryEnabled} formikValues={formikValues} type={type} />;
};

export { ChartGenerator };
