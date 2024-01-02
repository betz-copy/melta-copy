import React, { Dispatch, SetStateAction, useRef } from 'react';
import i18next from 'i18next';
import { BaseTextFieldProps, CircularProgress, Grid, IconButton, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import CardsViewIcon from '@mui/icons-material/RecentActors';
import TablesViewIcon from '@mui/icons-material/CalendarViewMonth';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/VerticalAlignBottomOutlined';
import { useSelector } from 'react-redux';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import SearchInput from '../inputs/SearchInput';
import { AddEntityButton } from './AddEntityButton';
import { IMongoCategory } from '../../interfaces/categories';
import TemplatesSelectCheckbox from '../templatesSelectCheckbox';
import { BlueTitle } from '../BlueTitle';
import { RootState } from '../../store';
import { lightTheme } from '../../theme';

export const GlobalSearchBar: React.FC<{
    inputValue?: string;
    setInputValue?: (newInputValue: string) => void;
    onSearch: (searchValue: string) => void;
    borderRadius?: string;
    placeholder?: string;
    size?: BaseTextFieldProps['size'];
}> = ({ inputValue, setInputValue, onSearch, borderRadius, placeholder, size }) => {
    const valueForSearchButtonRef = useRef(inputValue ?? '');

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
                <IconButton onClick={() => onSearch(valueForSearchButtonRef.current)} sx={{ padding: 0 }} disableRipple>
                    <SearchIcon />
                </IconButton>
            }
            placeholder={placeholder}
            size={size}
            borderRadius={borderRadius}
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
                <Grid container direction="row" display="flex" wrap="nowrap">
                    <BlueTitle title={pageTitle} component="h4" variant="h4" />
                    <Grid item paddingLeft="3rem" paddingTop="5px">
                        <Grid item container wrap="nowrap">
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
                                    borderRadius="0 7px 7px 0"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid item>
                <Grid container spacing={1} wrap="nowrap" alignItems="center">
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
                        >
                            <ToggleButton value="cards-view">
                                <Tooltip title={i18next.t('cardsView')!}>
                                    <CardsViewIcon />
                                </Tooltip>
                            </ToggleButton>
                            <ToggleButton value="templates-tables-view">
                                <Tooltip title={i18next.t('templateTablesView')!}>
                                    <TablesViewIcon />
                                </Tooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    {excelExportProps && (
                        <Grid item>
                            <IconButton
                                style={{ background: lightTheme.palette.primary.main, borderRadius: '5px' }}
                                onClick={excelExportProps.onExcelExport}
                                disabled={excelExportProps.isLoadingExcel}
                            >
                                {excelExportProps.isLoadingExcel ? (
                                    <CircularProgress sx={{ color: 'white' }} size="24px" />
                                ) : (
                                    <DownloadIcon htmlColor="white" />
                                )}
                                <Typography fontSize={14} style={{ fontWeight: '500', padding: '0 10px', color: 'white' }}>
                                    {i18next.t('downloadMultipleTables')}
                                </Typography>
                            </IconButton>
                        </Grid>
                    )}
                    <Grid item>
                        <AddEntityButton disabledToolTip style={{ background: lightTheme.palette.primary.main, borderRadius: '5px' }}>
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

export { EntitiesPageHeadline };
