/* eslint-disable react/no-unstable-nested-components */
import i18next from 'i18next';
import React, { useRef, useState } from 'react';
import * as Yup from 'yup';
import { EntitiesTableOfTemplateRef } from '../../../common/EntitiesTableOfTemplate';
import { StepType } from '../../../common/wizards';
import { TableMetaData } from '../../../interfaces/dashboard';
import { IEntity } from '../../../interfaces/entities';
import { FilterSideBar } from '../../Charts/ChartPage/filterSideBar';
import { DashboardItem } from '../pages';
import { BodyComponent } from './BodyCompenet';
import { SideBarDetails } from './sideBarDetails';

const Table: React.FC = () => {
    const entitiesTableRef = useRef<EntitiesTableOfTemplateRef<IEntity>>(null);
    const [filters, setFilters] = useState<number[]>([]);

    const setColumnsVisible = (colId: string) => entitiesTableRef.current?.setColumnsVisible(colId);

    const moveColumn = (colId: string, destination: number) => entitiesTableRef.current?.moveColumn(colId, destination);

    const steps: StepType<TableMetaData>[] = [
        {
            label: i18next.t('charts.generalDetails'),
            component: (props) => <SideBarDetails {...props} />,
            validationSchema: Yup.object().shape({
                name: Yup.string().required(i18next.t('validation.required')),
                description: Yup.string().required(i18next.t('validation.required')),
            }),
        },
        {
            label: i18next.t('charts.filterDetails'),
            component: (props) => (
                <FilterSideBar
                    filters={filters}
                    setFilters={setFilters}
                    readonly={false}
                    moveColumn={moveColumn}
                    setColumnsVisible={setColumnsVisible}
                    formikProps={props}
                />
            ),
            validationSchema: undefined,
            validate: undefined,
        },
    ];

    return (
        <DashboardItem
            title="הוספת טבלה"
            edit
            readonly={false}
            backPath={{ path: '/', title: 'מסך ראשי' }}
            onDelete={() => {}}
            steps={steps}
            initialValues={
                {
                    templateId: '',
                    name: '',
                    description: '',
                    columns: [],
                    columnsOrder: [],
                    filter: {},
                    // filters: {},
                } as TableMetaData
            }
            bodyComponent={BodyComponent}
        />
    );
};

export default Table;
