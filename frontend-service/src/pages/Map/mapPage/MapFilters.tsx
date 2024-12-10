import React, { useEffect } from 'react';
import i18next from 'i18next';
import { Grid } from '@mui/material';
import { useQueryClient } from 'react-query';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import TemplatesSelectCheckbox from '../../../common/templatesSelectCheckbox';
import { GlobalSearchBar } from '../../../common/EntitiesPage/Headline';

type props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    searchValue?: string;
    setSearchValue?: (newInputValue: string) => void;
};

const MapFilters = ({ searchValue, selectedTemplates, setSearchValue, setSelectedTemplates }: props) => {
    const queryClient = useQueryClient();
    const entityTemplateMap = queryClient.getQueryData<IEntityTemplateMap>(['getEntityTemplates']);

    const templatesWithLocationField = Array.from(entityTemplateMap!.values()).filter((key) =>
        Object.values(key.properties.properties).some((obj) => obj.format === 'location'),
    );

    useEffect(() => {
        setSelectedTemplates(templatesWithLocationField);
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
                    // setTemplates={entityTemplateSelectCheckboxProps.setTemplates}
                    size="small"
                />
            </Grid>
            <Grid item>
                <GlobalSearchBar
                    inputValue={searchValue}
                    setInputValue={setSearchValue}
                    onSearch={() => console.log('hello')}
                    borderRadius="7px"
                    placeholder={i18next.t('globalSearch.searchInPage')}
                    autoSearch
                />
            </Grid>
        </Grid>
    );
};

export default MapFilters;
