import { Add } from '@mui/icons-material';
import { Button, Divider, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useQueryClient } from 'react-query';
import { FormikProps } from 'formik';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
import { IGraphFilterBody, IGraphFilterBodyBatch } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { GraphFilterBatch } from '../../Graph/GraphFilterBatch';
import { IChart } from '../../../interfaces/charts';
import { TableMetaData } from '../../../interfaces/dashboard';

interface FilterSideBarProps {
    formikProps: FormikProps<IChart | TableMetaData>;
    filters: number[];
    setFilters: React.Dispatch<React.SetStateAction<number[]>>;
    readonly: boolean;
    moveColumn?: (colId: string, destination: number) => void;
    setColumnsVisible: (colId: string) => void;
}

const FilterSideBar: React.FC<FilterSideBarProps> = ({
    formikProps: { values, setFieldValue },
    filters,
    setFilters,
    readonly,
    moveColumn,
    setColumnsVisible,
}) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());
    const entityTemplate = entityTemplates.get(values.templateId!);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);

    const [selectedProperties, setSelectedProperties] = useState<string[]>(entityTemplateFields!);
    const [fullView, setFullView] = useState<boolean>(true);

    // useEffect(() => {
    //     entityTemplateFields?.forEach((prop) => {
    //         if (!selectedProperties.includes(prop)) setColumnsVisible?.(prop);
    //     });
    // }, [entityTemplateFields, selectedProperties, setColumnsVisible]);

    const addNewFilter = () => setFilters((prevFilters) => [...prevFilters, Date.now()]);

    const handleOnDragEnd = (result: DropResult) => {
        console.log({ result, selectedProperties });

        const { draggableId, destination } = result;

        // todo:save the order

        moveColumn?.(draggableId, destination?.index!);
    };

    const theme = useTheme();

    return (
        <Grid container direction="column">
            <SelectCheckbox
                options={entityTemplateFields!}
                selectedOptions={selectedProperties}
                setSelectedOptions={(value) => setFieldValue('myField', value)}
                title="עמודות להצגה"
                getOptionId={(_id) => _id}
                getOptionLabel={(displayName) => displayName}
                toTopBar={false}
                hideChooseAll
                hideSearchBar
                asMenu={false}
                onDragEnd={handleOnDragEnd}
                // onSelectItems={(ids)=>{

                // }}
            />
            {/* <IconButton onClick={() => setFullView(!fullView)} sx={{ color: theme.palette.primary.main }}>
                {fullView ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowUp fontSize="small" />}
            </IconButton> */}
            {/* <Divider sx={{ width: '95%' }} /> */}
            <Grid sx={{ overflowY: 'auto', maxHeight: '76vh' }}>
                <GraphFilterBatch
                    filters={filters}
                    setFilters={setFilters}
                    templateOptions={templateOptions}
                    filterRecord={values.filter || {}}
                    setFilterRecord={(value: IGraphFilterBody, filterKey: number) => {
                        const currentValue = values.filter;
                        const newValue = { ...currentValue, [filterKey]: { ...value } };

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
                    readonly={readonly}
                />
            </Grid>
            <Button
                sx={{ marginRight: 'auto', marginTop: '16px', zIndex: '100' }}
                onClick={addNewFilter}
                startIcon={<Add style={{ marginLeft: '5px' }} />}
                disabled={readonly}
            >
                {i18next.t('charts.actions.filterFields')}
            </Button>
        </Grid>
    );
};

export { FilterSideBar };
