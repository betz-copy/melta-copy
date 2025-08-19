/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo } from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import SearchAutoComplete from './SearchAutoComplete';
import { IEntity } from '../../../interfaces/entities';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { IMongoCategory } from '../../../interfaces/categories';
import { IMongoChildTemplatePopulated } from '../../../interfaces/childTemplates';

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
        <Delete htmlColor={darkMode ? '#9398c2' : '#787c9e'} />
    </IconButtonWithPopover>
);

type Props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<(IMongoEntityTemplatePopulated | IMongoChildTemplatePopulated)[]>>;
    moveToEntityLocations: (entity: IEntity) => void;
    entityTemplateMap: IEntityTemplateMap;
    onClear: () => void;
    darkMode: boolean;
    clearAutocompleteSearch: () => void;
};

const MapFilters = ({
    selectedTemplates,
    setSelectedTemplates,
    moveToEntityLocations,
    entityTemplateMap,
    onClear,
    darkMode,
    clearAutocompleteSearch,
}: Props) => {
    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const categories: IMongoCategory[] = useMemo(() => {
        return [...new Map(templatesWithLocationField.map((template) => [template.category._id, template.category])).values()];
    }, [templatesWithLocationField]);

    return (
        <Grid zIndex={1000} top={10} container wrap="nowrap" gap="15px">
            <Grid>
                <TemplatesSelectCheckbox
                    title={i18next.t('entityTemplatesCheckboxLabel')}
                    templates={templatesWithLocationField}
                    selectedTemplates={selectedTemplates}
                    setSelectedTemplates={setSelectedTemplates}
                    isDraggableDisabled
                    size="small"
                    categories={categories}
                    overrideSx={{ background: darkMode ? '#121212' : '#FFFFFF' }}
                />
            </Grid>
            <Grid>
                <SearchAutoComplete
                    selectedTemplates={selectedTemplates}
                    handleEntityClick={moveToEntityLocations}
                    onClear={clearAutocompleteSearch}
                />
            </Grid>

            <Grid>
                <DeleteMapDataBtn onClick={onClear} darkMode={darkMode} />
            </Grid>
        </Grid>
    );
};

export default MapFilters;
