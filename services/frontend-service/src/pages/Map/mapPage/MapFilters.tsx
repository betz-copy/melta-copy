import React, { useEffect, useMemo } from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { Delete } from '@mui/icons-material';
import {
    IMongoEntityTemplateWithConstraintsPopulated,
    IEntity,
    IEntityTemplateWithConstraintsMap,
    IMongoCategory,
} from '@microservices/shared-interfaces';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import SearchAutoComplete from './SearchAutoComplete';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { useDarkModeStore } from '../../../stores/darkMode';

type props = {
    selectedTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    moveToEntityLocations: (entity: IEntity) => void;
    entityTemplateMap: IEntityTemplateWithConstraintsMap;
    onClear: () => void;
};

const MapFilters = ({ selectedTemplates, setSelectedTemplates, moveToEntityLocations, entityTemplateMap, onClear }: props) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
    }, []);

    const categories: IMongoCategory[] = useMemo(() => {
        return [...new Map(templatesWithLocationField.map((template) => [template.category._id, template.category])).values()];
    }, [templatesWithLocationField]);

    return (
        <Grid item zIndex={1000} position="absolute" top={10} left={270} container wrap="nowrap" gap="15px">
            <Grid item>
                <TemplatesSelectCheckbox
                    title={i18next.t('entityTemplatesCheckboxLabel')}
                    templates={templatesWithLocationField}
                    selectedTemplates={selectedTemplates}
                    setSelectedTemplates={setSelectedTemplates}
                    isDraggableDisabled
                    size="small"
                    categories={categories}
                />
            </Grid>
            <Grid item>
                <SearchAutoComplete selectedTemplates={selectedTemplates} handleEntityClick={(entity: IEntity) => moveToEntityLocations(entity)} />
            </Grid>

            <Grid item>
                <IconButtonWithPopover
                    popoverText={i18next.t('location.clear')}
                    iconButtonProps={{
                        onClick: onClear,
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
            </Grid>
        </Grid>
    );
};

export default MapFilters;
