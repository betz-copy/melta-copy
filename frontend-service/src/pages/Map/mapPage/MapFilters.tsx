/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import SearchAutoComplete from './SearchAutoComplete';
import { IEntity } from '../../../interfaces/entities';

type props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    moveToEntityLocations: (entity: IEntity) => void;
    entityTemplateMap: IEntityTemplateMap;
};

const MapFilters = ({ selectedTemplates, setSelectedTemplates, moveToEntityLocations, entityTemplateMap }: props) => {
    const templatesWithLocationField = Array.from(entityTemplateMap.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
    }, []);

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
                />
            </Grid>
            <Grid item>
                <SearchAutoComplete selectedTemplates={selectedTemplates} handleEntityClick={(entity: IEntity) => moveToEntityLocations(entity)} />
            </Grid>
        </Grid>
    );
};

export default MapFilters;
