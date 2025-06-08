import { Add } from '@mui/icons-material';
import { Button, Divider, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from 'react-query';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { StepComponentProps } from '../../../common/wizards';
import { IChart } from '../../../interfaces/charts';
import { TableMetaData, ViewMode } from '../../../interfaces/dashboard';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';

const FilterSideBar = <T extends TableMetaData | IChart>({
    values,
    setFieldValue,
    filters,
    viewMode,
    moveFunction,
}: StepComponentProps<T> & {
    filters: { value: number[]; set: React.Dispatch<React.SetStateAction<number[]>> };
    viewMode: ViewMode;
    moveFunction?: (displayName: string, index: number) => void | undefined;
}) => {
    console.log({ values, valuesFilter: values.filter, filtersValue: filters.value });

    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());
    const entityTemplate = entityTemplates.get(values.templateId!);
    const [entityTemplateFields, setEntityTemplateFields] = useState<string[]>(entityTemplate && Object.keys(entityTemplate.properties.properties));
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

    useEffect(() => {
        if ('columns' in values && values.columns?.length > 0 && entityTemplateFields) {
            // Put selected columns first, in their current order
            const selectedInOrder = values.columns.filter((col) => entityTemplateFields.includes(col));
            const unselected = entityTemplateFields.filter((field) => !values.columns.includes(field));
            const reorderedFields = [...selectedInOrder, ...unselected];

            setEntityTemplateFields(reorderedFields);
        }
    }, [entityTemplateFields, values.columns]);

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
                            setSelectedOptions={(value) => {
                                console.log('value', value);
                                setFieldValue('columns', value);
                            }}
                            title="עמודות להצגה"
                            getOptionId={(_id) => _id}
                            getOptionLabel={(option) => entityTemplate?.properties.properties[option]?.title || ''}
                            toTopBar={false}
                            onDragEnd={(result) => {
                                if (!result?.source || !result?.destination || result.source.index === result.destination.index) {
                                    return;
                                }

                                const sourceIndex = result.source.index;
                                const destinationIndex = result.destination.index;

                                // Update the options order (entityTemplateFields)
                                const newOptions = Array.from(entityTemplateFields);
                                const [reorderedOption] = newOptions.splice(sourceIndex, 1);
                                newOptions.splice(destinationIndex, 0, reorderedOption);

                                // // Update entityTemplateFields (you'll need a setter for this)
                                // setEntityTemplateFields(newOptions); // You need to implement this

                                // Update the selected columns order based on the new options order
                                const newSelectedColumns = newOptions.filter((option) => values.columns.includes(option));

                                setFieldValue('columns', newSelectedColumns);

                                // Call moveFunction if provided
                                // if (moveFunction) {
                                //     const draggedItem = result.draggableId;
                                //     moveFunction(draggedItem, destinationIndex);
                                // }
                            }}
                            // hideChooseAll
                            hideSearchBar
                            // readonly={viewMode === ViewMode.ReadOnly}
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
                        console.log({ currentValue, filterKey, newValue });

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
