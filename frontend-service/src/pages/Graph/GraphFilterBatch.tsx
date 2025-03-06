import React from 'react';
import { Box, Grid } from '@mui/material';
import { deepEquals } from '@rjsf/utils';
import { isEqual } from 'lodash';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { GraphFilter } from './GraphFilter';
import { IGraphFilterBodyBatch } from '../../interfaces/entities';

interface GraphFilterBatchProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    filters: number[];
    setFilters: React.Dispatch<React.SetStateAction<number[]>>;
    filterRecord: IGraphFilterBodyBatch;
    onFilter: () => void;
    selectedEntityTemplate?: IMongoEntityTemplatePopulated | null;
}

const GraphFilterBatch: React.FC<GraphFilterBatchProps> = React.memo(
    ({ templateOptions, setFilterRecord, filters, setFilters, filterRecord, graphEntityTemplateIds, onFilter, selectedEntityTemplate }) => {
        // deletes filter box from screen
        const deleteFilter = (value) => {
            setFilters((prevFilters) => prevFilters.filter((item) => item !== value));
        };

        const removeFilterFromFilterList = (filterKey) => {
            setFilterRecord((prev) => {
                const { [filterKey]: deletedFilter, ...restFilters } = prev;
                return restFilters;
            });
            onFilter();
        };

        console.log({ filters, setFilters });

        return (
            <Box display="flex" flexDirection="column" style={{ position: 'relative' }}>
                <Grid container zIndex="100" gap="20px">
                    {filters?.map((key) => {
                        return (
                            <GraphFilter
                                key={key}
                                filterKey={key}
                                templateOptions={templateOptions}
                                setFilterRecord={setFilterRecord}
                                filter={filterRecord[key]}
                                deleteFilter={deleteFilter}
                                graphEntityTemplateIds={graphEntityTemplateIds}
                                removeFilterFromFilterList={removeFilterFromFilterList}
                                onFilter={onFilter}
                                selectedEntityTemplate={selectedEntityTemplate}
                            />
                        );
                    })}
                </Grid>
            </Box>
        );
    },
    (prevProps, nextProps) => {
        console.log('Previous filterRecord:', prevProps.filterRecord);
        console.log('Next filterRecord:', nextProps.filterRecord);
        console.log('isEqual', isEqual(prevProps.filterRecord, nextProps.filterRecord));

        return isEqual(prevProps.filterRecord, nextProps.filterRecord) && deepEquals(prevProps.filters, nextProps.filters);
    },
);

export { GraphFilterBatch };
