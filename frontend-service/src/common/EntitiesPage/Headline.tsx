import { GridApi } from '@ag-grid-community/core';
import { useMatomo } from '@datapunt/matomo-tracker-react';
import {
    IEntity,
    IMongoCategory,
    IMongoChildTemplateWithConstraintsPopulated,
    IMongoEntityTemplateWithConstraintsPopulated,
} from '@microservices/shared';
import {
    Add as AddIcon,
    AutoAwesome,
    AutoAwesomeOutlined,
    RecentActors as CardsViewIcon,
    VerticalAlignBottomOutlined as DownloadIcon,
    Search,
    TableChartOutlined,
} from '@mui/icons-material';
import { BaseTextFieldProps, Box, CircularProgress, Grid, IconButton, ToggleButton, ToggleButtonGroup, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { useDarkModeStore } from '../../stores/darkMode';
import { useWorkspaceStore } from '../../stores/workspace';
import { convertToBool } from '../../utils/convertStringToBool';
import { useLocalStorage } from '../../utils/hooks/useLocalStorage';
import { useSearchParams } from '../../utils/hooks/useSearchParams';
import { isChildTemplate } from '../../utils/templates';
import SearchInput from '../inputs/SearchInput';
import BlueTitle from '../MeltaDesigns/BlueTitle';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import TemplatesSelectCheckbox from '../templatesSelectCheckbox';
import { AddEntityButton } from './Buttons/AddEntity';

export const GlobalSearchBar: React.FC<{
    inputValue?: string;
    setInputValue?: (newInputValue: string) => void;
    onSearch: (searchValue: string) => void;
    gridApi?: GridApi;
    borderRadius?: string;
    placeholder?: string;
    size?: BaseTextFieldProps['size'];
    toTopBar?: boolean;
    height?: string;
    width?: string;
    autoSearch?: boolean;
    showAiButton?: boolean;
}> = ({
    inputValue,
    setInputValue,
    onSearch,
    gridApi,
    borderRadius,
    placeholder,
    size,
    toTopBar = false,
    height,
    width,
    autoSearch = false,
    showAiButton = false,
}) => {
    const valueForSearchButtonRef = useRef(inputValue ?? '');
    const theme = useTheme();
    const { trackEvent } = useMatomo();

    const [semanticSearch, setSemanticSearch] = useLocalStorage<boolean>('semanticSearch', true);
    const [urlSearchParams, setUrlSearchParams] = useSearchParams();
    const urlSemanticSearch = urlSearchParams.get('semanticSearch');
    const boolUrl = convertToBool(urlSemanticSearch!);

    const [debouncedSearchValue, setDebouncedSearchValue] = useState(inputValue ?? '');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            if (value !== valueForSearchButtonRef.current) {
                valueForSearchButtonRef.current = value;
                onSearch(value);
                if (gridApi) {
                    gridApi.setGridOption('quickFilterText', value);
                }
                trackEvent({
                    category: 'search',
                    action: semanticSearch ? 'on' : 'off',
                });
            }
        }, 300),
        [onSearch, gridApi, valueForSearchButtonRef.current],
    );

    useEffect(() => {
        // If a value exists in the url, override the value in the localStorage.
        const realValue = urlSemanticSearch ? boolUrl : semanticSearch;

        if (realValue !== semanticSearch) setSemanticSearch(realValue);
        if (realValue !== boolUrl) setUrlSearchParams({ ...Object.fromEntries(urlSearchParams.entries()), semanticSearch: realValue.toString() });
    }, [boolUrl, semanticSearch, urlSemanticSearch, showAiButton, setSemanticSearch, setUrlSearchParams, urlSearchParams]);

    useEffect(() => {
        if (autoSearch) {
            debouncedSearch(debouncedSearchValue);

            return () => {
                debouncedSearch.cancel();
            };
        }

        return undefined;
    }, [debouncedSearchValue, gridApi, onSearch, autoSearch, debouncedSearch]);

    const aiToolTip = useCallback(
        () => (
            <MeltaTooltip title={boolUrl ? i18next.t('globalSearch.turnOffSemanticSearch') : i18next.t('globalSearch.turnOnSemanticSearch')} arrow>
                <IconButton
                    onClick={() =>
                        setUrlSearchParams({
                            ...Object.fromEntries(urlSearchParams.entries()),
                            semanticSearch: (!convertToBool(urlSemanticSearch!)).toString(),
                        })
                    }
                    sx={{ padding: 0, paddingLeft: 0.5 }}
                >
                    {boolUrl ? <AutoAwesome color="primary" /> : <AutoAwesomeOutlined />}
                </IconButton>
            </MeltaTooltip>
        ),
        [boolUrl, setUrlSearchParams, urlSearchParams, urlSemanticSearch],
    );

    return (
        <SearchInput
            value={debouncedSearchValue}
            onChange={(newSearchValue) => {
                setDebouncedSearchValue(newSearchValue);
                setInputValue?.(newSearchValue);
            }}
            onKeyDown={(event) => {
                if (!autoSearch && event.key === 'Enter') {
                    onSearch(debouncedSearchValue);
                }
            }}
            endAdornmentChildren={
                <Box>
                    <IconButton
                        style={{ color: theme.palette.primary.main }}
                        onClick={() => onSearch(valueForSearchButtonRef.current)}
                        sx={{ padding: 0 }}
                        disableRipple
                    >
                        <Search sx={{ fontSize: '1.25rem' }} />
                    </IconButton>
                    {showAiButton && aiToolTip()}
                </Box>
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

type EntitiesPageHeadlineProps<T extends IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated> = {
    searchInput?: string;
    setSearchInput?: (newSearchInput: string) => void;
    onSearch: (value: string) => void;
    entityTemplateSelectCheckboxProps: {
        categories?: IMongoCategory[];
        templates: T[];
        setTemplates?: Dispatch<SetStateAction<T[]>>;
        templatesToShow: T[];
        setTemplatesToShow: Dispatch<SetStateAction<T[]>>;
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
    onAddEntity: (id: string) => void;
    refreshServerSide: (templateId: string) => void;
    setUpdatedEntities: React.Dispatch<React.SetStateAction<IEntity[]>>;
    setUpdatedTemplateIds?: React.Dispatch<React.SetStateAction<string[]>>;
};

const EntitiesPageHeadline = <T extends IMongoEntityTemplateWithConstraintsPopulated | IMongoChildTemplateWithConstraintsPopulated>({
    searchInput,
    setSearchInput,
    onSearch,
    entityTemplateSelectCheckboxProps,
    excelExportProps,
    viewModeProps,
    pageTitle,
    onAddEntity,
    refreshServerSide,
    setUpdatedEntities,
    setUpdatedTemplateIds,
}: EntitiesPageHeadlineProps<T>) => {
    const workspace = useWorkspaceStore((state) => state.workspace);
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const theme = useTheme();
    const { trackEvent } = useMatomo();

    const onSuccessCreate = (entity: IEntity) => {
        const handleTemplatesTablesView = () => {
            const template = entityTemplateSelectCheckboxProps.templates.find(
                (entityTemplate) => (isChildTemplate(entityTemplate) ? entityTemplate.parentTemplate?._id : entityTemplate._id) === entity.templateId,
            );

            if (template) {
                try {
                    refreshServerSide(template._id);
                } catch {
                    onAddEntity(entity.templateId);
                }
            }
            trackEvent({
                category: 'top-bar-action',
                action: 'add entity',
            });
        };

        if (viewModeProps.viewMode === 'templates-tables-view') {
            handleTemplatesTablesView();
        } else {
            onAddEntity(entity.properties._id);
        }
    };

    const handleToggleChange = useCallback(
        (_e: React.MouseEvent<HTMLElement>, newValue: 'cards-view' | 'templates-tables-view') => {
            if (newValue !== null) {
                viewModeProps.setViewMode(newValue);
                if (newValue === 'cards-view') {
                    trackEvent({
                        category: 'view-mode',
                        action: 'cards view',
                    });
                }
            }
        },
        [viewModeProps, trackEvent],
    );

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
            <Grid>
                <Grid container direction="row" display="flex" wrap="nowrap" alignItems="center">
                    <BlueTitle
                        title={pageTitle}
                        component="h4"
                        variant="h4"
                        style={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize }}
                    />
                    <Grid paddingLeft="3rem" paddingTop="5px">
                        <Grid container wrap="nowrap" gap="15px">
                            <Grid data-tour="template-filter">
                                <TemplatesSelectCheckbox
                                    title={i18next.t('entityTemplatesCheckboxLabel')}
                                    templates={entityTemplateSelectCheckboxProps.templates}
                                    selectedTemplates={entityTemplateSelectCheckboxProps.templatesToShow}
                                    setSelectedTemplates={entityTemplateSelectCheckboxProps.setTemplatesToShow}
                                    categories={entityTemplateSelectCheckboxProps.categories ?? []}
                                    isDraggableDisabled={entityTemplateSelectCheckboxProps.isDraggableDisabled}
                                    setTemplates={entityTemplateSelectCheckboxProps.setTemplates}
                                    size="small"
                                    toTopBar
                                />
                            </Grid>
                            <Grid data-tour="search-input">
                                <GlobalSearchBar
                                    inputValue={searchInput}
                                    setInputValue={setSearchInput}
                                    onSearch={onSearch}
                                    borderRadius="7px"
                                    placeholder={i18next.t('globalSearch.searchInPage')}
                                    toTopBar
                                    autoSearch
                                    showAiButton
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid>
                <Grid container spacing={1} wrap="nowrap" alignItems="center" justifyContent="center">
                    <Grid>
                        <ToggleButtonGroup
                            value={viewModeProps.viewMode}
                            onChange={handleToggleChange}
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
                                    <TableChartOutlined />
                                </MeltaTooltip>
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Grid>
                    {excelExportProps && (
                        <Grid>
                            <IconButton
                                style={{ background: theme.palette.primary.main, borderRadius: '7px', width: '135px', height: '35px' }}
                                onClick={() => {
                                    excelExportProps.onExcelExport();
                                    trackEvent({
                                        category: 'top-bar-action',
                                        action: 'download templates',
                                    });
                                }}
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
                    <Grid>
                        <AddEntityButton
                            disabledToolTip
                            style={{
                                background: theme.palette.primary.main,
                                borderRadius: '7px',
                                width: '135px',
                                height: '35px',
                            }}
                            onSuccessCreate={onSuccessCreate}
                            setUpdatedEntities={setUpdatedEntities}
                            setUpdatedTemplateIds={setUpdatedTemplateIds}
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
