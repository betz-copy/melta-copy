/* eslint-disable react-hooks/exhaustive-deps */
import { Grid } from '@mui/material';
import React from 'react';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import SearchAutoComplete from './SearchAutoComplete';

type Props = {
    moveToEntityLocations: (entity: IEntity) => void;
    entityTemplateMap: IEntityTemplateMap;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
};

const MapFilters = ({ moveToEntityLocations, entityTemplateMap, clearAutocompleteSearch }: Props) => {
    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    return (
        <Grid zIndex={1000} top={10} container wrap="nowrap" gap="15px">
            <Grid>
                <SearchAutoComplete
                    selectedTemplates={templatesWithLocationField}
                    handleEntityClick={moveToEntityLocations}
                    onClear={clearAutocompleteSearch}
                />
            </Grid>
        </Grid>
    );
};

export default MapFilters;
