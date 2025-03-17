import { Button, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useQueryClient } from 'react-query';
import { IGraphFilterBody, IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';

const FilterSideBar: React.FC<{
    templateId: string;
    readonly: boolean;
    template;
    filterRecord: IGraphFilterBodyBatch;
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
}> = ({ templateId, filterRecord, setFilterRecord, readonly, template }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());

    // const [filters, setFilters] = useState(Object.keys(filterRecord));

    const [filters, setFilters] = useState<number[]>(filterRecord ? Object.keys(filterRecord) : []);

    const addNewFilter = () => {
        setFilters((prevFilters) => [...prevFilters, Date.now()]);
    };

    return (
        <Grid container direction="column" marginTop={2}>
            <GraphFilterBatch
                filters={filters}
                setFilters={setFilters}
                templateOptions={templateOptions}
                filterRecord={filterRecord}
                setFilterRecord={setFilterRecord}
                graphEntityTemplateIds={[templateId]}
                entityFilter
                // onFilter={(newFilter) => {
                //     // console.log({
                //     //     ok: filterModelToFilterOfGraph(filterRecord),
                //     //     convert: filterBackendToFilterDocument(filterModelToFilterOfGraph(filterRecord)[templateId].filter),
                //     // });
                //     // formik.setFieldValue('filter', filterModelToFilterOfGraph(filterRecord)[templateId].filter);

                //     formik.setFieldValue('filter', { ...filterRecord, ...newFilter });
                // }}
                onFilter={() => console.log('hi')}
                selectedEntityTemplate={entityTemplates.get(templateId)}
                readonly={readonly}
            />
            <Button
                sx={{ marginRight: 'auto', marginTop: '16px', zIndex: '100' }}
                onClick={addNewFilter}
                startIcon={<BsFillPlusCircleFill style={{ marginLeft: '5px' }} />}
                disabled={readonly}
            >
                {i18next.t('charts.actions.filterFields')}
            </Button>
        </Grid>
    );
};

export { FilterSideBar };
