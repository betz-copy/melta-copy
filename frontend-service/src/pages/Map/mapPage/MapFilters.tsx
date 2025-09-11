/* eslint-disable react-hooks/exhaustive-deps */
import { Close } from '@mui/icons-material';
import { Grid, useTheme } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import SearchAutoComplete from './SearchAutoComplete';

export const DeleteMapDataBtn = ({ onClick, darkMode }: { onClick: () => void; darkMode: boolean }) => {
    const theme = useTheme();

    return (
        <IconButtonWithPopover
            popoverText={i18next.t('location.clear')}
            iconButtonProps={{
                onClick,
            }}
            style={{
                background: darkMode ? '#131313' : '#FFFFFF',
                borderRadius: '7px',
                height: '34px',
                opacity: 1,
            }}
        >
            <Close htmlColor={theme.palette.primary.main} />
        </IconButtonWithPopover>
    );
};

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
