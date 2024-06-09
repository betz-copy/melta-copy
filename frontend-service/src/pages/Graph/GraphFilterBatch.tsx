import React from 'react';
import { Box } from '@mui/material';
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
}

const GraphFilterBatch: React.FC<GraphFilterBatchProps> = React.memo(
    ({ templateOptions, setFilterRecord, filters, setFilters, filterRecord, graphEntityTemplateIds }) => {
        // deletes filter box from screen
        const deleteFilter = (value) => {
            setFilters((prevFilters) => prevFilters.filter((item) => item !== value));
        };

        const removeFilterFromFilterList = (filterKey) => {
            setFilterRecord((prev) => {
                const { [filterKey]: deletedFilter, ...restFilters } = prev;
                return restFilters;
            });
        };

        return (
            <Box display="flex" flexDirection="column" style={{ paddingLeft: '10px', position: 'relative' }}>
                <Box zIndex="100" style={{ overflowY: 'auto' }}>
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
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    },
);

export { GraphFilterBatch };
