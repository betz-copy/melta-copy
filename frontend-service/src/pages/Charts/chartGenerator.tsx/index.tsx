import { FilterModel } from '@ag-grid-community/core';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { IAxis, IAxisField, IBasicChart, IChartType, isAggregation } from '../../../interfaces/charts';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getChartOfTemplate } from '../../../services/entitiesService';
import { filterModelToFilterOfTemplate } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { NumberChartGenerator } from './NumberChartGenerator';
import { HiighchartGenerator } from './highChartgenerator';
import { getChartAxes } from '../../../utils/charts/getChartAxes';

interface IChartGenerator {
    formikValues: IBasicChart;
    template: IMongoEntityTemplatePopulated;
    entityTemplate: IMongoEntityTemplatePopulated;
    entitiesTableRef: React.RefObject<EntitiesTableOfTemplateRef<IEntity>>;
}

const ChartGenerator: React.FC<IChartGenerator> = ({ formikValues, template, entityTemplate, entitiesTableRef }) => {
    const { type, metaData } = formikValues;
    const [filterModel, setFilterMOdel] = useState<FilterModel | null>(null);
    const filterModelRef = useRef<FilterModel | null>(null);

    const isAggregationValid = (field: IAxisField): boolean => {
        if (typeof field === 'string') return Boolean(field);
        if (field.type === 'countAll') return true;
        return Boolean(field.byField);
    };

    const { xAxis, yAxis } = getChartAxes(type, metaData);

    const isQueryEnabled = type === IChartType.Number ? isAggregationValid(xAxis) : isAggregationValid(xAxis) && isAggregationValid(yAxis);

    const { data, isLoading } = useQuery(
        ['chart', template._id, xAxis, yAxis, filterModel],
        () => {
            const yAxisField = type === IChartType.Number ? undefined : yAxis;
            const currentFilter = entitiesTableRef.current?.getFilterModel();
            const filter = currentFilter ? filterModelToFilterOfTemplate(currentFilter, entityTemplate) : {};

            return getChartOfTemplate(xAxis, yAxisField, template._id, filter);
        },
        {
            enabled: Boolean(isQueryEnabled),
        },
    );

    useEffect(() => {
        if (isQueryEnabled && entitiesTableRef.current) {
            const checkFilterChanges = () => {
                const newFilterModel = entitiesTableRef.current!.getFilterModel();

                if (JSON.stringify(newFilterModel) !== JSON.stringify(filterModelRef.current)) {
                    filterModelRef.current = newFilterModel;
                    setFilterMOdel(newFilterModel);
                }
            };

            checkFilterChanges();

            const intervalId = setInterval(() => checkFilterChanges(), 1000);

            return () => clearInterval(intervalId);
        }

        return undefined;
    }, [isQueryEnabled, entitiesTableRef]);

    if (!data) return <img src="/icons/notFoundChart.svg" />;

    if (type === IChartType.Number) return <NumberChartGenerator data={data} formikValues={formikValues} />;
    return <HiighchartGenerator data={data} isLoading={isLoading} isQueryEnabled={isQueryEnabled} formikValues={formikValues} type={type} />;
};

export { ChartGenerator };
