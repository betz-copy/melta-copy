import { Add } from '@mui/icons-material';
import { Button, Divider, Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { useQueryClient } from 'react-query';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { StepComponentProps } from '../../../common/wizards';
import { ChartForm, TableForm, ViewMode } from '../../../interfaces/dashboard';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';

const FilterSideBar = <T extends TableForm | ChartForm>({
    values,
    setFieldValue,
    filters,
    viewMode,
}: StepComponentProps<T> & {
    filters: { value: number[]; set: React.Dispatch<React.SetStateAction<number[]>> };
    viewMode: ViewMode;
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());
    const entityTemplate = entityTemplates.get(values.templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);

    const addNewFilter = () => filters.set((prevFilters) => [...prevFilters, Date.now()]);

    return (
        <Grid item display="flex" sx={{ flexDirection: 'column' }} gap={3}>
            {'columns' in values && (
                <>
                    <Grid item>
                        <SelectCheckbox
                            options={entityTemplateFields!}
                            selectedOptions={values.columns}
                            setSelectedOptions={(value) => setFieldValue('columns', value)}
                            title={i18next.t('dashboard.tables.columnsToShow')}
                            getOptionId={(_id) => _id}
                            getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                            toTopBar={false}
                            hideSearchBar
                            isDraggableDisabled
                            isSelectDisabled={viewMode === ViewMode.ReadOnly}
                            hideChooseAll={viewMode === ViewMode.ReadOnly}
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
                        console.log({ valuesIN: values });

                        const currentValue = values.filter;
                        const newValue = { ...currentValue, [filterKey]: { ...value } };
                        console.log({ currentValue, newValue });

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
                    readonly={viewMode === ViewMode.ReadOnly}
                />
            </Grid>
            {viewMode !== ViewMode.ReadOnly && (
                <Button sx={{ marginRight: 'auto', zIndex: '100' }} onClick={addNewFilter} startIcon={<Add style={{ marginLeft: '5px' }} />}>
                    {i18next.t('charts.actions.filterFields')}
                </Button>
            )}
        </Grid>
    );
};

export { FilterSideBar };
