/* eslint-disable react/no-array-index-key */
import { Box } from '@mui/material';
import React from 'react';
import { IGraphFilterBodyBatch } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { GraphFilter } from './GraphFilter';

interface GraphFilterBatchProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    setFilterRecord: React.Dispatch<React.SetStateAction<IGraphFilterBodyBatch>>;
    filters: number[];
    setFilters: React.Dispatch<React.SetStateAction<number[]>>;
    filterRecord: IGraphFilterBodyBatch;
    onFilter?: () => void;
    entityFilter: boolean;
    readonly?: boolean;
    selectedEntityTemplate?: IMongoEntityTemplatePopulated | null;
}

const GraphFilterBatch: React.FC<GraphFilterBatchProps> = React.memo(
    ({
        templateOptions,
        setFilterRecord,
        filters,
        setFilters,
        filterRecord,
        graphEntityTemplateIds,
        onFilter,
        entityFilter,
        readonly,
        selectedEntityTemplate,
    }) => {
        // deletes filter box from screen
        const deleteFilter = (value) => {
            setFilters((prevFilters) => prevFilters.filter((item) => item !== value));
        };

        const removeFilterFromFilterList = (filterKey: number) => {
            setFilterRecord((prev) => {
                const { [filterKey]: deletedFilter, ...restFilters } = prev;
                return restFilters;
            });
            onFilter?.();
        };

        return (
            <Box display="flex" flexDirection="column" style={{ paddingLeft: '10px' }}>
                <Box zIndex="100">
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
                                readOnly={readonly}
                                selectedEntityTemplate={selectedEntityTemplate}
                                entityFilter={entityFilter}
                            />
                        );
                    })}
                </Box>
            </Box>
        );
    },
);

export { GraphFilterBatch };
