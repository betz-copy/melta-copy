import React, { useCallback, useEffect, useState } from 'react';
import { Autocomplete, Grid, TextField, Typography } from '@mui/material';
import i18next from 'i18next';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';
import { _debounce } from '@ag-grid-community/core';
import { InfoOutlined } from '@mui/icons-material';
import { getEntitiesWithDirectConnections } from '../../../services/entitiesService';
import { IEntity } from '../../../interfaces/entities';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { EntityPropertiesInternal } from '../../../common/EntityProperties';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';

type props = {
    selectedTemplates: IMongoEntityTemplatePopulated[];
};

const SearchAutoComplete = ({ selectedTemplates }: props) => {
    const [inputValue, setInputValue] = useState('');
    const [searchResults, setSearchResults] = useState<IEntity[]>([]);
    const [templatesObject, setTemplatesObject] = useState<Record<string, {}>>({});

    useEffect(() => {
        const updatedTemplatesObject = selectedTemplates.map(({ _id }) => _id).reduce((acc, template) => ({ ...acc, [template]: {} }), {});
        setTemplatesObject(updatedTemplatesObject);
    }, [selectedTemplates]);

    const mutation = useMutation(
        () =>
            getEntitiesWithDirectConnections({
                limit: 100,
                textSearch: inputValue,
                templates: templatesObject,
            }),
        {
            onSuccess: (data) => {
                setSearchResults(data.entities.map(({ entity }) => entity));
            },
            onError: (error) => {
                toast.error(error);
            },
        },
    );

    useEffect(() => {
        mutation.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        _debounce((debounedValue: string) => {
            setInputValue(debounedValue);
        }, 300),
        [],
    );

    return (
        <Autocomplete
            options={searchResults}
            getOptionLabel={(option) => option.properties._id}
            renderInput={(params) => (
                <TextField
                    {...params}
                    onChange={(e) => debouncedSearch(e.target.value)}
                    sx={{ backgroundColor: 'white', width: 400, borderRadius: '10px' }}
                    label={i18next.t('globalSearch.searchInPage')}
                    size="small"
                    variant="outlined"
                />
            )}
            renderOption={(props, option) => {
                const template = selectedTemplates.find(({ _id }) => _id === option.templateId)!;
                const displayOptionValues = [template.propertiesOrder[0], template.propertiesOrder[1]].map((key) => option.properties[key]);

                return (
                    <li {...props}>
                        <Grid container justifyContent="space-between" direction="row" spacing={1}>
                            {displayOptionValues.map((displayOptionValue, index) => (
                                <Grid item key={displayOptionValue} xs={4} overflow="hidden">
                                    <MeltaTooltip placement="right" title={displayOptionValue}>
                                        <Typography color={index > 0 ? '#166BD4' : 'black'} overflow="hidden">
                                            {displayOptionValue}
                                        </Typography>
                                    </MeltaTooltip>
                                </Grid>
                            ))}
                            <Grid item xs={0}>
                                <MeltaTooltip
                                    title={
                                        template.propertiesPreview.length === 0 ? (
                                            i18next.t('templateEntitiesAutocomplete.noPreviewFields')
                                        ) : (
                                            <EntityPropertiesInternal
                                                properties={option.properties}
                                                entityTemplate={template}
                                                showPreviewPropertiesOnly
                                                mode="white"
                                                textWrap
                                            />
                                        )
                                    }
                                >
                                    <InfoOutlined sx={{ color: '#166BD4' }} />
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    </li>
                );
            }}
        />
    );
};

export default SearchAutoComplete;
