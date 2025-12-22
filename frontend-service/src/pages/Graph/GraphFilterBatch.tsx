import { Box } from '@mui/material';
import React from 'react';
import { IGraphFilterBody, IGraphFilterBodyBatch } from '../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { GraphFilter } from './GraphFilter';

interface GraphFilterBatchProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    setFilterRecord: (value: IGraphFilterBody, filterKey: number) => void;
    onRemoveFilter: (filterKey: number) => void;
    filters: number[];
    setFilters: React.Dispatch<React.SetStateAction<number[]>>;
    filterRecord: IGraphFilterBodyBatch;
    onFilter?: () => void;
    entityFilter?: boolean;
    readonly?: boolean;
    selectedEntityTemplate?: IMongoEntityTemplatePopulated | null;
}

const GraphFilterBatch: React.FC<GraphFilterBatchProps> = React.memo(
    ({
        templateOptions,
        setFilterRecord,
        onRemoveFilter,
        filters,
        setFilters,
        filterRecord,
        graphEntityTemplateIds,
        onFilter,
        readonly,
        selectedEntityTemplate,
        entityFilter = false,
    }) => {
        const deleteFilter = (value: number) => {
            setFilters((prevFilters) => prevFilters.filter((item) => item !== value));
        };

        const removeFilterFromFilterList = (filterKey: number) => {
            onRemoveFilter(filterKey);
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
