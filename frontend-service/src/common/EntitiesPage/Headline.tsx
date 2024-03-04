import React, { Dispatch, SetStateAction, useRef } from 'react';
import i18next from 'i18next';
import { BaseTextFieldProps, CircularProgress, Grid, Icon, IconButton, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import CardsViewIcon from '@mui/icons-material/RecentActors';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { useSelector } from 'react-redux';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import SearchInput from '../inputs/SearchInput';
import { AddEntityButton } from './AddEntityButton';
import { IMongoCategory } from '../../interfaces/categories';
import TemplatesSelectCheckbox from '../templatesSelectCheckbox';
import { BlueTitle } from '../BlueTitle';
import { RootState } from '../../store';
import { MeltaTooltip } from '../MeltaTooltip';
import { environment } from '../../globals';

export const GlobalSearchBar: React.FC<{
    inputValue?: string;
    setInputValue?: (newInputValue: string) => void;
    onSearch: (searchValue: string) => void;
    borderRadius?: string;
    placeholder?: string;
    size?: BaseTextFieldProps['size'];
    toTopBar?: boolean;
    height?: string;
    width?: string;
}> = ({ inputValue, setInputValue, onSearch, borderRadius, placeholder, size, toTopBar = false, height, width }) => {
    const valueForSearchButtonRef = useRef(inputValue ?? '');
    const theme = useTheme();

    return (
        <SearchInput
            value={inputValue}
            onChange={(newSearchValue) => {
                valueForSearchButtonRef.current = newSearchValue;
                setInputValue?.(newSearchValue);
            }}
            onKeyDown={(event) => {
                if (event.key === 'Enter') {
                    onSearch(valueForSearchButtonRef.current);
                }
            }}
            endAdornmentChildren={
                <IconButton
                    style={{ color: theme.palette.primary.main }}
                    onClick={() => onSearch(valueForSearchButtonRef.current)}
                    sx={{ padding: 0 }}
                    disableRipple
                >
                    <img
                        color="#1E2775"
                        width="14px"
                        height="14px"
                        style={{
                            top: '7px',
                            left: '8px',
                        }}
                        src="/icons/search-blue.svg"
                    />
                </IconButton>
            }
            placeholder={placeholder}
            size={size}
            borderRadius={borderRadius}
            toTopBar={toTopBar}
            height={height}
            width={width}
        />
    );
};

const EntitiesPageHeadline: React.FC<{
    searchInput?: string;
    setSearchInput?: (newSearchInput: string) => void;
    onSearch: (value: string) => void;
    entityTemplateSelectCheckboxProps: {
        categories?: IMongoCategory[];
        templates: IMongoEntityTemplatePopulated[];
        setTemplates?: Dispatch<SetStateAction<IMongoEntityTemplatePopulated[]>>;
        templatesToShow: IMongoEntityTemplatePopulated[];
        setTemplatesToShow: Dispatch<SetStateAction<IMongoEntityTemplatePopulated[]>>;
        isDraggableDisabled?: boolean;
    };
    excelExportProps?: {
        onExcelExport: () => void;
        isLoadingExcel: boolean;
    };
    viewModeProps: {
        viewMode: 'cards-view' | 'templates-tables-view';
        setViewMode: (newViewMode: 'cards-view' | 'templates-tables-view') => void;
    };
    pageTitle: string;
}> = ({ searchInput, setSearchInput, onSearch, entityTemplateSelectCheckboxProps, excelExportProps, viewModeProps, pageTitle }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const theme = useTheme();

    return (
        <Grid
            container
            bgcolor={darkMode ? '#131313' : '#fff'}
            boxShadow="0px 4px 4px #0000000D"
            padding="0.5rem 2.5rem"
            height="3.6rem"
            marginBottom="1rem"
            justifyContent="space-between"
            alignItems="center"
            wrap="nowrap"
        >
            <Grid item>
                <Grid container direction="row" display="flex" wrap="nowrap" alignItems="center">
                    <BlueTitle title={pageTitle} component="h4" variant="h4" style={{ fontSize: environment.mainFontSizes.headlineTitleFontSize }} />
                    <Grid item paddingLeft="3rem" paddingTop="5px">
                        <Grid item container wrap="nowrap" gap="15px">
                            <Grid item data-tour="template-filter">
                                <TemplatesSelectCheckbox
                                    title={i18next.t('entityTemplatesCheckboxLabel')}
                                    templates={entityTemplateSelectCheckboxProps.templates}
                                    selectedTemplates={entityTemplateSelectCheckboxProps.templatesToShow}
                                    setSelectedTemplates={entityTemplateSelectCheckboxProps.setTemplatesToShow}
                                    categories={entityTemplateSelectCheckboxProps.categories}
                                    isDraggableDisabled={entityTemplateSelectCheckboxProps.isDraggableDisabled}
                                    setTemplates={entityTemplateSelectCheckboxProps.setTemplates}
                                    size="small"
                                    toTopBar
                                />
                            </Grid>
                            <Grid item data-tour="search-input">
                                <GlobalSearchBar
                                    inputValue={searchInput}
                                    setInputValue={setSearchInput}
                                    onSearch={onSearch}
                                    borderRadius="7px"
                                    placeholder={i18next.t('globalSearch.searchInPage')}
                                    toTopBar
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Grid container spacing={1} wrap="nowrap" alignItems="center" justifyContent="center">
                    <Grid item>
                        <ToggleButtonGroup
                            value={viewModeProps.viewMode}
                            onChange={(_e, newValue) => {
                                if (newValue !== null) {
                                    viewModeProps.setViewMode(newValue);
                                }
                            }}
                            exclusive
                            color="primary"
                            size="small"
                            sx={{ height: '35px' }}
                        >
                            <ToggleButton value="cards-view">
                                <MeltaTooltip title={i18next.t('cardsView')!}>
                                    <CardsViewIcon />
                                </MeltaTooltip>
                            </ToggleButton>
                            <ToggleButton value="templates-tables-view">
                                <MeltaTooltip title={i18next.t('templateTablesView')!}>
                                    <Icon>
                                        <img src="/icons/Tables-View.svg" height="15px" style={{ marginBottom: '10px' }} />
                                    </Icon>
                                </MeltaTooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    {excelExportProps && (
                        <Grid item>
                            <IconButton
                                style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '135px', height: '35px' }}
                                onClick={excelExportProps.onExcelExport}
                                disabled={excelExportProps.isLoadingExcel}
                            >
                                {excelExportProps.isLoadingExcel ? (
                                    <CircularProgress sx={{ color: 'white' }} size="24px" />
                                ) : (
                                    <DownloadIcon htmlColor="white" />
                                )}
                                <Typography fontSize={14} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                                    {i18next.t('downloadMultipleTables')}
                                </Typography>
                            </IconButton>
                        </Grid>
                    )}
                    <Grid item>
                        <AddEntityButton
                            disabledToolTip
                            style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '135px', height: '35px' }}
                        >
                            <AddIcon htmlColor="white" />
                            <Typography fontSize={14} style={{ fontWeight: '400', padding: '0 5px', color: 'white' }}>
                                {i18next.t('addEntity')}
                            </Typography>
                        </AddEntityButton>
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    );
};

export { EntitiesPageHeadline };
