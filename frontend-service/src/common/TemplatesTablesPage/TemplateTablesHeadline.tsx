import React, { Dispatch, SetStateAction, useState } from 'react';
import i18next from 'i18next';
import { Divider, Grid, IconButton, Typography } from '@mui/material';
import { AddCircle as AddIcon, DownloadForOffline as DonwloadIcon, TravelExplore as GlobalSearchIcon } from '@mui/icons-material';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import SearchInput from '../inputs/SearchInput';
import { AddEntityButton } from './AddEntityButton';
import { IMongoCategory } from '../../interfaces/categories';
import TemplatesSelectCheckbox from '../templatesSelectCheckbox';

const GlobalSearch: React.FC<{ onSearch: (searchValue: string) => void }> = ({ onSearch }) => {
    const [input, setInput] = useState('');

    return (
        <SearchInput
            onChange={setInput}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    onSearch(input);
                }
            }}
            endAdornmentChildren={
                <IconButton onClick={() => onSearch(input)}>
                    <GlobalSearchIcon />
                </IconButton>
            }
        />
    );
};

const TemplateTablesHeadline: React.FC<{
    onSearch: (value: string) => void;
    entityTemplateSelectCheckboxProps: {
        categories?: IMongoCategory[];
        templates: IMongoEntityTemplatePopulated[];
        templatesToShow: IMongoEntityTemplatePopulated[];
        setTemplatesToShow: Dispatch<SetStateAction<IMongoEntityTemplatePopulated[]>>;
    };
    onExcelExport: () => void;
}> = ({ onSearch, entityTemplateSelectCheckboxProps, onExcelExport }) => {
    return (
        <Grid container spacing={2}>
            <Grid item xs={12} container justifyContent="space-between" alignItems="center">
                <Grid item>
                    <Grid container spacing={1}>
                        <Grid item flexGrow={1}>
                            <GlobalSearch onSearch={onSearch} />
                        </Grid>
                        <Grid item>
                            <TemplatesSelectCheckbox
                                title={i18next.t('templatesTablesEntityTemplatesCheckboxLabel')}
                                templates={entityTemplateSelectCheckboxProps.templates}
                                selectedTemplates={entityTemplateSelectCheckboxProps.templatesToShow}
                                setSelectedTemplates={entityTemplateSelectCheckboxProps.setTemplatesToShow}
                                categories={entityTemplateSelectCheckboxProps.categories}
                                size="small"
                            />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item>
                    <Grid container spacing={1}>
                        <Grid item>
                            <IconButton style={{ background: 'white', borderRadius: '7px' }} onClick={onExcelExport}>
                                <DonwloadIcon color="primary" />
                                <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                                    {i18next.t('downloadMultipleTables')}
                                </Typography>
                            </IconButton>
                        </Grid>
                        <Grid item>
                            <AddEntityButton disabledToolTip style={{ background: 'white', borderRadius: '7px' }}>
                                <AddIcon color="primary" />
                                <Typography fontSize={14} style={{ fontWeight: '500', paddingRight: '5px' }}>
                                    {i18next.t('addEntity')}
                                </Typography>
                            </AddEntityButton>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <Divider />
            </Grid>
        </Grid>
    );
};

export { TemplateTablesHeadline };
