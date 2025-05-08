/* eslint-disable react/no-unstable-nested-components */
import React, { useState } from 'react';
import i18next from 'i18next';
import { IChart } from '../../../interfaces/charts';
import { StepType } from '../../../common/wizards';
import { DashboardItem } from '../pages';
import { chartValidationSchema, initialValues } from '../../../utils/charts/getChartAxes';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { ChartSideBar } from '../../Charts/ChartPage/ChartSideBar';
import { BodyComponent } from './BodyCompenent';

const Chart: React.FC = () => {
    const [filters, setFilters] = useState<number[]>([]);

    const steps: StepType<IChart>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <ChartSideBar {...props} />,
            validationSchema: chartValidationSchema,
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => <FilterSideBar filters={filters} setFilters={setFilters} readonly={false} formikProps={props} />,
            validationSchema: undefined,
            validate: undefined,
        },
    ];

    return (
        <DashboardItem
            title="הוספת תרשים"
            edit
            readonly={false}
            backPath={{ path: '/', title: 'מסך ראשי' }}
            onDelete={() => {}}
            steps={steps}
            initialValues={initialValues}
            bodyComponent={BodyComponent}
        />
    );
};

export default Chart;
