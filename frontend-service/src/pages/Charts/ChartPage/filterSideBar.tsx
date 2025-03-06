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

    const [filters, setFilters] = useState<number[]>(formik.values.filter ? Object.keys(formik.values.filter) : []);

    const [filterRecord, setFilterRecord] = useState<IGraphFilterBodyBatch>(formik.values.filter ?? {});

    const addNewFilter = () => {
        setFilters((prevFilters) => [...prevFilters, Date.now()]);
    };

    return (
        <Grid container direction="column" padding="20px" marginTop={2}>
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
            <Button
                sx={{ marginRight: 'auto', marginTop: '16px', zIndex: '100' }}
                onClick={addNewFilter}
                startIcon={<BsFillPlusCircleFill style={{ marginLeft: '5px' }} />}
            >
                {i18next.t('charts.actions.filterFields')}
            </Button>
        </Grid>
    );
};

export { FilterSideBar };
