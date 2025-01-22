import { FilterModel } from '@ag-grid-community/core';
import React, { useEffect, forwardRef, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { IAxisField, IBasicChart, IChartType } from '../../../interfaces/charts';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { getChartOfTemplate } from '../../../services/entitiesService';
import { filterModelToFilterOfTemplate } from '../../../utils/agGrid/agGridToSearchEntitiesOfTemplateRequest';
import { getChartAxes } from '../../../utils/charts/getChartAxes';
import { NumberChartGenerator } from './NumberChartGenerator';
import { HiighchartGenerator } from './highChartgenerator';

interface IChartGenerator {
    formikValues: IBasicChart;
    template: IMongoEntityTemplatePopulated;
    entityTemplate: IMongoEntityTemplatePopulated;
}

const ChartGenerator = forwardRef<EntitiesTableOfTemplateRef<IEntity>, IChartGenerator>(({ template, formikValues, entityTemplate }, ref) => {
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
            const currentFilter = ref.current?.getFilterModel();
            const filter = currentFilter ? filterModelToFilterOfTemplate(currentFilter, entityTemplate) : {};

            return getChartOfTemplate(xAxis, yAxisField, template._id, filter);
        },
        {
            enabled: Boolean(isQueryEnabled),
        },
    );

    useEffect(() => {
        if (isQueryEnabled && ref.current) {
            const checkFilterChanges = () => {
                const newFilterModel = ref.current!.getFilterModel();

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
    }, [isQueryEnabled, ref]);

    if (!data) return <img src="/icons/notFoundChart.svg" />;

    if (type === IChartType.Number) return <NumberChartGenerator data={data} name={formikValues.name} description={formikValues.description} />;
    return (
        <HiighchartGenerator
            data={data}
            isLoading={isLoading}
            isQueryEnabled={isQueryEnabled}
            name={formikValues.name}
            description={formikValues.description}
            metaData={formikValues.metaData}
            type={type}
        />
    );
});

export { ChartGenerator };
