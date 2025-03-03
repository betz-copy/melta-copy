import { Button, Grid } from '@mui/material';
import { FormikProps } from 'formik';
import i18next from 'i18next';
import React, { useState } from 'react';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useQueryClient } from 'react-query';
import { IBasicChart } from '../../../interfaces/charts';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';

const FilterSideBar: React.FC<{ templateId: string; formik: FormikProps<IBasicChart>; template }> = ({ templateId, formik, template }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());

    // const generateFilterRecodFromBackendDocument = filterBackendToFilterDocument(formik.values.filter, template);

    // console.log({ generateFilterRecodFromBackendDocument });

    // const [filters, setFilters] = useState<number[]>(
    //     Object.keys(generateFilterRecodFromBackendDocument) ?? [1719242345678, 1719242345679, 1719242345680],
    // );
    const [filters, setFilters] = useState<number[]>(formik.values.filter ? Object.keys(formik.values.filter) : []);
    // const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>(
    //     generateFilterRecodFromBackendDocument ?? {
    //         1719242345678: { selectedProperty: 'firstName', filterField: { type: 'contains', filter: 'd' }, selectedTemplate: template },
    //         1719242345679: { selectedProperty: 'firstName', filterField: { type: 'equals', filter: 'nostrud' }, selectedTemplate: template },
    //         1719242345680: { selectedProperty: 'gender', filterField: 'true', selectedTemplate: template },
    //     },
    // );

    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>(
        formik.values.filter ??
            {} ?? {
                1719242345678: { selectedProperty: 'firstName', filterField: { type: 'contains', filter: 'd' }, selectedTemplate: template },
                1719242345679: { selectedProperty: 'firstName', filterField: { type: 'equals', filter: 'nostrud' }, selectedTemplate: template },
                1719242345680: { selectedProperty: 'gender', filterField: 'true', selectedTemplate: template },
            },
    );

    // const [filters, setFilters] = useState<number[]>([]);
    // const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>({});

    const addNewFilter = () => {
        setFilters((prevFilters) => [...prevFilters, Date.now()]);
    };

    return (
        <Grid container direction="column" padding="20px" marginTop={2}>
            <Button
                sx={{ marginRight: 'auto', zIndex: '100' }}
                onClick={addNewFilter}
                startIcon={<BsFillPlusCircleFill style={{ marginLeft: '5px' }} />}
            >
                {i18next.t('charts.actions.filterFields')}
            </Button>
            <GraphFilterBatch
                templateOptions={templateOptions}
                filterRecord={filterRecord}
                setFilterRecord={setFilterRecord}
                filters={filters}
                setFilters={setFilters}
                graphEntityTemplateIds={[templateId]}
                onFilter={(newFilter) => {
                    // console.log({
                    //     ok: filterModelToFilterOfGraph(filterRecord),
                    //     convert: filterBackendToFilterDocument(filterModelToFilterOfGraph(filterRecord)[templateId].filter),
                    // });
                    // formik.setFieldValue('filter', filterModelToFilterOfGraph(filterRecord)[templateId].filter);

                    formik.setFieldValue('filter', { ...filterRecord, ...newFilter });
                }}
                selectedEntityTemplate={entityTemplates.get(templateId)}
            />
        </Grid>
    );
};

export { FilterSideBar };
