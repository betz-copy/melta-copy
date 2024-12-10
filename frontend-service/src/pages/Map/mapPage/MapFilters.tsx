import React, { useEffect } from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import SearchAutoComplete from './SearchAutoComplete';

type props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
};

const MapFilters = ({ selectedTemplates, setSelectedTemplates }: props) => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const templatesWithLocationField = Array.from(entityTemplateMap!.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Grid item zIndex={1000} position="absolute" top={10} left={100} container wrap="nowrap" gap="15px">
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
                <SearchAutoComplete selectedTemplates={selectedTemplates} />
            </Grid>
        </Grid>
    );
};

export default MapFilters;
