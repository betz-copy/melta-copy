import { Add } from '@mui/icons-material';
import { Button, Divider, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { StepComponentProps } from '../../../common/wizards';
import { IChart } from '../../../interfaces/charts';
import { TableMetaData } from '../../../interfaces/dashboard';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';
import { FilterOfGraphToFilterRecord } from '../../Graph/GraphFilterToBackend';

const FilterSideBar = <T extends TableMetaData | IChart>({
    values,
    setFieldValue,
    filters,
}: StepComponentProps<T> & { filters: { value: number[]; set: React.Dispatch<React.SetStateAction<number[]>> } }) => {
    console.log({ values, valuesFilter: values.filter });

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());
    const entityTemplate = entityTemplates.get(values.templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);
    // const [filters, setFilters] = useState<number[]>([]);

    const [selectedProperties, setSelectedProperties] = useState<string[]>(entityTemplateFields!);
    const [fullView, setFullView] = useState<boolean>(true);

    console.log({ selectedProperties });

    // useEffect(() => {
    //     entityTemplateFields?.forEach((prop) => {
    //         if (!selectedProperties.includes(prop)) setColumnsVisible?.(prop);
    //     });
    // }, [entityTemplateFields, selectedProperties, setColumnsVisible]);

    // init columns value
    // useEffect(() => {
    //     if ('columns' in values && !values.columns.length) {
    //         setFieldValue('columns', entityTemplateFields);
    //     }
    // }, [entityTemplateFields, setFieldValue, values]);

    const addNewFilter = () => filters.set((prevFilters) => [...prevFilters, Date.now()]);

    const theme = useTheme();

    return (
        <Grid item display="flex" direction="column" gap={3}>
            {/* <IconButton onClick={() => setFullView(!fullView)} sx={{ color: theme.palette.primary.main }}>
                {fullView ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
            </IconButton> */}
            {'columns' in values && (
                <>
                    <Grid item>
                        <SelectCheckbox
                            options={entityTemplateFields!}
                            selectedOptions={values.columns}
                            setSelectedOptions={(value) => setFieldValue('columns', value)}
                            // setSelectedOptions={setSelectedProperties}
                            title="עמודות להצגה"
                            getOptionId={(_id) => _id}
                            getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                            toTopBar={false}
                            // hideChooseAll
                            hideSearchBar
                            // asMenu={false}
                            // onSelectItems={(ids)=>{

                            // }}
                        />
                    </Grid>
                    <Grid item>
                        <Divider sx={{ width: '95%' }} />
                    </Grid>
                </>
            )}
            <Grid item sx={{ overflowY: 'auto', maxHeight: '76vh' }}>
                <GraphFilterBatch
                    filters={filters.value}
                    setFilters={filters.set}
                    templateOptions={templateOptions}
                    filterRecord={values.filter || {}}
                    setFilterRecord={(value: IGraphFilterBody, filterKey: number) => {
                        const currentValue = values.filter;
                        const newValue = { ...currentValue, [filterKey]: { ...value } };
                        console.log({ newValue });

                        setFieldValue('filter', newValue);
                    }}
                    onRemoveFilter={(filterKey: number) => {
                        const currentValue = values.filter;
                        const newValue = { ...currentValue };
                        delete newValue[filterKey];

                        setFieldValue('filter', newValue);
                    }}
                    graphEntityTemplateIds={[values.templateId!]}
                    entityFilter
                    selectedEntityTemplate={entityTemplates.get(values.templateId!)}
                />
            </Grid>
            <Button sx={{ marginRight: 'auto', zIndex: '100' }} onClick={addNewFilter} startIcon={<Add style={{ marginLeft: '5px' }} />}>
                {i18next.t('charts.actions.filterFields')}
            </Button>
        </Grid>
    );
};

export { FilterSideBar };
