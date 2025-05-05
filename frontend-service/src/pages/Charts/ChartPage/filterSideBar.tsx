import { Add } from '@mui/icons-material';
import { Button, Divider, Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useQueryClient } from 'react-query';
import { options } from 'linkifyjs';
import { SelectCheckbox } from '../../../common/SelectCheckBox';
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
    moveColumn?: (colId: string, destination: number) => void;
    setColumnsVisible: (colId: string) => void;
}> = ({ templateId, filterRecord, setFilterRecord, filters, setFilters, readonly, moveColumn, setColumnsVisible }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const templateOptions = Array.from(entityTemplates.values());
    const entityTemplate = entityTemplates.get(templateId);
    const entityTemplateFields = entityTemplate && Object.keys(entityTemplate.properties.properties);

    const [selectedProperties, setSelectedProperties] = useState<string[]>(entityTemplateFields);
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
        <Grid container direction="column" marginTop={2}>
            <SelectCheckbox
                options={entityTemplateFields!}
                selectedOptions={selectedProperties}
                setSelectedOptions={setSelectedProperties}
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
            <Divider sx={{ width: '95%' }} />
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
                startIcon={<Add style={{ marginLeft: '5px' }} />}
                disabled={readonly}
            >
                {i18next.t('charts.actions.filterFields')}
            </Button>
        </Grid>
    );
};

export { FilterSideBar };
