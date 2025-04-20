import { Button, Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useQueryClient } from 'react-query';
import { IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';

const FilterSideBar: React.FC<{
    templateId: string;
    filterRecord: IGraphFilterBodyBatch;
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    filters: number[];
    readonly: boolean;
    setFilters: React.Dispatch<React.SetStateAction<number[]>>;
}> = ({ templateId, filterRecord, setFilterRecord, filters, setFilters, readonly }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());

    const addNewFilter = () => setFilters((prevFilters) => [...prevFilters, Date.now()]);

    return (
        <Grid container direction="column" marginTop={2}>
            <Grid sx={{ overflowY: 'auto', maxHeight: '76vh' }}>
                <GraphFilterBatch
                    filters={filters}
                    setFilters={setFilters}
                    templateOptions={templateOptions}
                    filterRecord={filterRecord}
                    setFilterRecord={setFilterRecord}
                    graphEntityTemplateIds={[templateId]}
                    entityFilter
                    selectedEntityTemplate={entityTemplates.get(templateId)}
                    readonly={readonly}
                />
            </Grid>
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
