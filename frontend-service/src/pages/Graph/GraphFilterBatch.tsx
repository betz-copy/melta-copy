/* eslint-disable react/no-array-index-key */
import React from 'react';
import { Box, Grid } from '@mui/material';
import { deepEquals } from '@rjsf/utils';
import { isEqual } from 'lodash';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { GraphFilter } from './GraphFilter';
import { IGraphFilterBody } from '../../interfaces/entities';

interface GraphFilterBatchProps {
    templateOptions: IMongoEntityTemplatePopulated[];
    graphEntityTemplateIds: string[];
    filters: IGraphFilterBody[];
    setFilters: React.Dispatch<React.SetStateAction<IGraphFilterBody[]>>;
    onFilter: () => void;
    readonly?: boolean;
    selectedEntityTemplate?: IMongoEntityTemplatePopulated | null;
}

const GraphFilterBatch: React.FC<GraphFilterBatchProps> = React.memo(
    ({ templateOptions, filters, setFilters, graphEntityTemplateIds, onFilter, readonly, selectedEntityTemplate }) => {
        // deletes filter box from screen
        const deleteFilter = (value) => {
            setFilters((prevFilters) => prevFilters.filter((item) => item !== value));
        };

        const removeFilterFromFilterList = (index: number) => {
            setFilters((prevFilters) => {
                const updatedFilters = [...prevFilters];
                updatedFilters.splice(index, 1);
                return updatedFilters;
            });

            onFilter();
        };

        console.log({ filters, setFilters });

        return (
            <Box display="flex" flexDirection="column" style={{ position: 'relative' }}>
                <Grid container zIndex="100" gap="20px">
                    {filters?.map((filter, index) => {
                        return (
                            <GraphFilter
                                key={index}
                                filterIndex={index}
                                templateOptions={templateOptions}
                                setFilters={setFilters}
                                filter={filter}
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
        return isEqual(prevProps.filters, nextProps.filters);
    },
);

export { GraphFilterBatch };
