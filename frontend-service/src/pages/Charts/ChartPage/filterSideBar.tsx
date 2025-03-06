import { Button, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import { BsFillPlusCircleFill } from 'react-icons/bs';
import { useQueryClient } from 'react-query';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';

const FilterSideBar: React.FC<{
    templateId: string;
    setFilters: React.Dispatch<React.SetStateAction<IGraphFilterBody[]>>;
    filters: IGraphFilterBody[];
    readonly: boolean;
    template;
}> = ({ templateId, filters, setFilters, readonly, template }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());

    // const [filters, setFilters] = useState<number[]>(formik.values.filter ? Object.keys(formik.values.filter) : []);

    const addNewFilter = () => {
        setFilters((prevFilters) => [...prevFilters, { selectedTemplate: template }]);
    };

    useEffect(() => {
        console.log({ filters });
    }, [filters]);

    return (
        <Grid container direction="column" padding="20px" marginTop={2}>
            <GraphFilterBatch
                templateOptions={templateOptions}
                filters={filters}
                setFilters={setFilters}
                graphEntityTemplateIds={[templateId]}
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
