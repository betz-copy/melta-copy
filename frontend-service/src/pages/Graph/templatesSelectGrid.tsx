import React, { Dispatch, useState } from 'react';
import { Box, Button, Divider, Grid, Paper, Typography } from '@mui/material';
import i18next from 'i18next';
import { makeStyles } from '@mui/styles';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { IMongoCategory } from '../../interfaces/categories';
import {
    ChooseAllMenuItem,
    MiniFilter,
    SelectCheckboxGroupProps,
    SelectCheckboxProps,
    SelectOptionsMenuItemsGrouped,
    getOptionsAndGroupsMiniFiltered,
} from '../../common/SelectCheckbox';

const useStyles = makeStyles(() => ({
    button: {
        backgroundColor: 'white',
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        borderColor: 'white',
    },
    popper: {
        borderRadius: '10px',
    },
}));

export const getCategoriesSelectCheckboxGroupProps = (
    categories: IMongoCategory[] | undefined,
): SelectCheckboxProps<IMongoEntityTemplatePopulated, IMongoCategory>['groupsProps'] => {
    if (!categories) {
        return {
            useGroups: false,
        };
    }

    return {
        useGroups: true,
        groups: categories,
        getGroupId: (category) => category._id,
        getGroupLabel: (category) => category.displayName,
        getGroupOfOption: (entityTemplate, _categories) => entityTemplate.category,
    };
};

const getOptionId: SelectCheckboxProps<IMongoEntityTemplatePopulated, IMongoCategory>['getOptionId'] = ({ _id }) => _id;
const getOptionLabel: SelectCheckboxProps<IMongoEntityTemplatePopulated, IMongoCategory>['getOptionLabel'] = ({ displayName }) => displayName;

const TemplatesSelectGrid: React.FC<{
    templates: IMongoEntityTemplatePopulated[];
    selectedTemplates: IMongoEntityTemplatePopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    categories?: IMongoCategory[];
    setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
    setOpenFilter: React.Dispatch<React.SetStateAction<boolean>>;
    openFilter: boolean;
}> = ({ templates, selectedTemplates, setSelectedTemplates, categories, setTemplates, setOpenFilter, openFilter }) => {
    const classes = useStyles();
    const [showAll, setShowAll] = useState<boolean>(false);

    const [miniFilterValue, setMiniFilterValue] = useState('');

    const filteredCategories = categories?.filter((category) => templates.some((template) => template.category._id === category._id));

    const groupsProps = getCategoriesSelectCheckboxGroupProps(filteredCategories) as { useGroups: true } & SelectCheckboxGroupProps<
        IMongoEntityTemplatePopulated,
        IMongoCategory
    >;
    const { optionsFiltered: templatesFiltered, groupsFiltered: categoriesFiltered } = getOptionsAndGroupsMiniFiltered(
        miniFilterValue,
        templates,
        getOptionId,
        getOptionLabel,
        groupsProps,
    );

    const selectedTemplatesFiltered = selectedTemplates.filter((selectedOption) => {
        const isSelectedOptionInOptionsFiltered = templatesFiltered.some((option) => getOptionId(option) === getOptionId(selectedOption));
        return isSelectedOptionInOptionsFiltered;
    });

    const first3CategoriesFiltered = categoriesFiltered!.slice(0, 3);
    const extendedCategoriesFiltered = categoriesFiltered!.slice(3);
    const [openMap, setOpenMap] = useState<{ [groupId: string]: boolean }>({});

    return (
        <Grid container gap="10px">
            <Grid item>
                <Box style={{ marginBottom: '20px', overflowY: 'auto' }} borderRadius="10px">
                    <Button
                        className={classes.button}
                        variant="outlined"
                        onClick={() => {
                            setOpenFilter(!openFilter);
                        }}
                        style={{
                            width: openFilter ? '235px' : '120px',
                            height: '50px',
                            gap: '20px',
                            zIndex: '100',
                            padding: '17px, 20px, 17px, 20px',
                            display: 'flex',
                            justifyContent: openFilter ? 'space-between' : 'center',
                            alignContent: 'center',
                        }}
                    >
                        <Box>
                            <img src="/icons/select-checkbox.svg" style={{ marginLeft: '15px' }} />
                            {i18next.t('graph.filter')}
                        </Box>
                        {openFilter && <img src="/icons/star.svg" />}
                    </Button>
                </Box>
                {openFilter && (
                    <Paper className={classes.popper} style={{ zIndex: '100', position: 'relative', padding: '5px', width: '235px' }}>
                        <Typography
                            style={{
                                color: '#1E2775',
                                fontWeight: '500',
                                fontFamily: 'Rubik',
                                fontSize: '14px',
                                padding: '15px',
                                marginRight: '7px',
                            }}
                            variant="body1"
                        >
                            {i18next.t('graph.filterTitle')}
                        </Typography>
                        <MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} toTopBar={false} templatesSelectGrid />
                        <ChooseAllMenuItem
                            options={templates}
                            selectedOptionsFiltered={selectedTemplatesFiltered}
                            setSelectedOptions={setSelectedTemplates}
                            optionsFiltered={templatesFiltered}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                            <Divider style={{ width: '199px' }} />
                        </Box>

                        <Box style={{ maxHeight: '25rem', paddingBottom: '5px', overflowY: 'auto', overflowX: 'hidden' }}>
                            <SelectOptionsMenuItemsGrouped
                                options={templates}
                                optionsFiltered={templatesFiltered}
                                selectedOptions={selectedTemplatesFiltered}
                                setSelectedOptions={setSelectedTemplates}
                                getOptionId={getOptionId}
                                getOptionLabel={getOptionLabel}
                                groupsProps={{ ...groupsProps, groups: first3CategoriesFiltered }}
                                isDraggableDisabled
                                setOptions={setTemplates}
                                setOpenMap={setOpenMap}
                                openMap={openMap}
                            />
                            <Button
                                style={{
                                    marginRight: '17px',
                                    width: '195px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'start',
                                    gap: '20px',
                                }}
                                onClick={() => {
                                    setShowAll(!showAll);
                                }}
                            >
                                {showAll ? <IoIosArrowDown /> : <IoIosArrowBack />}
                                <Typography fontFamily="rubik" fontSize="14px">
                                    {i18next.t('graph.additionalTemplates')}
                                </Typography>
                            </Button>
                        </Box>
                    </Paper>
                )}
            </Grid>
            <Grid item>
                <Box style={{ marginTop: '4.4rem' }}>
                    {openFilter && showAll && (
                        <Paper
                            className={classes.popper}
                            style={{
                                zIndex: '100',
                                position: 'absolute',
                                width: '235px',
                            }}
                        >
                            <div style={{ width: '100%', maxHeight: '28rem', overflowY: 'auto', paddingBottom: '4px' }}>
                                <SelectOptionsMenuItemsGrouped
                                    options={templates}
                                    optionsFiltered={templatesFiltered}
                                    selectedOptions={selectedTemplatesFiltered}
                                    setSelectedOptions={setSelectedTemplates}
                                    getOptionId={getOptionId}
                                    getOptionLabel={getOptionLabel}
                                    groupsProps={{ ...groupsProps, groups: extendedCategoriesFiltered }}
                                    isDraggableDisabled
                                    setOptions={setTemplates}
                                    setOpenMap={setOpenMap}
                                    openMap={openMap}
                                />
                            </div>
                        </Paper>
                    )}
                </Box>
            </Grid>
        </Grid>
    );
};

export default TemplatesSelectGrid;
