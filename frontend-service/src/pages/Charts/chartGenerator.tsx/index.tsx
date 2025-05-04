import { CircularProgress } from '@mui/material';
import React from 'react';
import { useQuery } from 'react-query';
import { IAxisField, IChart, IChartType } from '../../../interfaces/charts';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getChartOfTemplate } from '../../../services/entitiesService';
import { getChartAxes } from '../../../utils/charts/getChartAxes';
import { filterModelToFilterOfGraph } from '../../Graph/GraphFilterToBackend';
import { NumberChartGenerator } from './NumberChartGenerator';
import { HighchartGenerator } from './HighChartgenerator';

interface IChartGeneratorProps {
    formikValues: IChart;
    template: IMongoEntityTemplatePopulated;
    entityTemplate: IMongoEntityTemplatePopulated;
    filterRecord: IGraphFilterBodyBatch;
}

const ChartGenerator: React.FC<IChartGeneratorProps> = ({ template, formikValues, entityTemplate, filterRecord }) => {
    const { type, metaData } = formikValues;

    const isAggregationValid = (field: IAxisField): boolean => {
        if (typeof field === 'string') return Boolean(field);
        if (field.type === 'countAll') return true;
        return Boolean(field.byField);
    };

    const { xAxis, yAxis } = getChartAxes(type, metaData);
    const xAxisField = xAxis as IAxisField;
    const yAxisField = yAxis as IAxisField | undefined;

    const isQueryEnabled =
        type === IChartType.Number ? isAggregationValid(xAxisField) : isAggregationValid(xAxisField) && isAggregationValid(yAxisField as IAxisField);

    const { data, isLoading } = useQuery(
        ['chart', template._id, xAxis, yAxis, filterRecord],
        () => {
            const filter =
                filterRecord && Object.keys(filterRecord).length > 0
                    ? filterModelToFilterOfGraph(filterRecord)[entityTemplate._id].filter
                    : undefined;

            return getChartOfTemplate(xAxisField, yAxisField, template._id, filter);
        },
        {
            enabled: Boolean(isQueryEnabled),
        },
    );

    if (isLoading) return <CircularProgress />;

    if (!data) return <img src="/icons/notFoundChart.svg" />;

    if (type === IChartType.Number) return <NumberChartGenerator data={data[0]} name={formikValues.name} description={formikValues.description} />;
    return (
        <HighchartGenerator
            data={data[0]}
            isLoading={isLoading}
            isQueryEnabled={isQueryEnabled}
            name={formikValues.name}
            description={formikValues.description}
            metaData={formikValues.metaData}
            type={type}
        />
    );
};

export { ChartGenerator };
