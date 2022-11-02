import React, { Dispatch, SetStateAction, useState } from 'react';
import i18next from 'i18next';
import { CircularProgress, Grid, IconButton, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import SearchInput from '../inputs/SearchInput';
import { AddEntityButton } from './AddEntityButton';
import { IMongoCategory } from '../../interfaces/categories';
import TemplatesSelectCheckbox from '../templatesSelectCheckbox';
import { BlueTitle } from '../BlueTitle';

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
                <IconButton onClick={() => onSearch(input)} sx={{ padding: 0 }}>
                    <SearchIcon />
                </IconButton>
            }
            topBarBorderRadius="0 7px 7px 0"
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
    pageTitle: string;
    isLoadingExcel: boolean;
}> = ({ onSearch, entityTemplateSelectCheckboxProps, onExcelExport, pageTitle, isLoadingExcel }) => {
    return (
        <Grid
            container
            bgcolor="#fcfeff"
            boxShadow="0px 4px 4px #0000000D"
            padding="0.5rem 2.5rem"
            height="3.6rem"
            marginBottom="1rem"
            justifyContent="space-between"
            alignItems="center"
            wrap="nowrap"
        >
            <Grid item>
                <Grid container direction="row" display="flex" wrap="nowrap">
                    <BlueTitle title={pageTitle} component="h4" variant="h4" />
                    <Grid item paddingLeft="3rem" paddingTop="5px">
                        <Grid item container wrap="nowrap">
                            <Grid item data-tour="template-filter">
                                <TemplatesSelectCheckbox
                                    title={i18next.t('templatesTablesEntityTemplatesCheckboxLabel')}
                                    templates={entityTemplateSelectCheckboxProps.templates}
                                    selectedTemplates={entityTemplateSelectCheckboxProps.templatesToShow}
                                    setSelectedTemplates={entityTemplateSelectCheckboxProps.setTemplatesToShow}
                                    categories={entityTemplateSelectCheckboxProps.categories}
                                    size="small"
                                    toTopBar
                                />
                            </Grid>
                            <Grid item data-tour="search-input">
                                <GlobalSearch onSearch={onSearch} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Grid container spacing={1} wrap="nowrap">
                    <Grid item>
                        <IconButton style={{ background: '#eeeeee', borderRadius: '5px' }} onClick={onExcelExport}>
                            {isLoadingExcel ? <CircularProgress size="24px" /> : <DownloadIcon htmlColor="#225AA7" />}
                            <Typography fontSize={14} style={{ fontWeight: '500', padding: '0 10px', color: '#225AA7' }}>
                                {i18next.t('downloadMultipleTables')}
                            </Typography>
                        </IconButton>
                    </Grid>
                    <Grid item>
                        <AddEntityButton disabledToolTip style={{ background: '#225AA7', borderRadius: '5px' }}>
                            <AddIcon htmlColor="white" />
                            <Typography fontSize={14} style={{ fontWeight: '500', padding: '0 10px', color: 'white' }}>
                                {i18next.t('addEntity')}
                            </Typography>
                        </AddEntityButton>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { TemplateTablesHeadline };
