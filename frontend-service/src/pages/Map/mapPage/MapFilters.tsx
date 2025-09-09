/* eslint-disable react-hooks/exhaustive-deps */
import { Close } from '@mui/icons-material';
import { Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect } from 'react';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import SearchAutoComplete from './SearchAutoComplete';

export const DeleteMapDataBtn = ({ onClick, darkMode }: { onClick: () => void; darkMode: boolean }) => (
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
        <Close htmlColor={darkMode ? '#9398c2' : '#787c9e'} />
    </IconButtonWithPopover>
);

type Props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<(IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[]>>;
    moveToEntityLocations: (entity: IEntity) => void;
    entityTemplateMap: IEntityTemplateMap;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
};

const MapFilters = ({ selectedTemplates, setSelectedTemplates, moveToEntityLocations, entityTemplateMap, clearAutocompleteSearch }: Props) => {
    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Grid item zIndex={1000} top={10} container wrap="nowrap" gap="15px">
            <Grid item>
                <SearchAutoComplete
                    selectedTemplates={selectedTemplates}
                    handleEntityClick={moveToEntityLocations}
                    onClear={clearAutocompleteSearch}
                />
            </Grid>
        </Grid>
    );
};

export default MapFilters;
