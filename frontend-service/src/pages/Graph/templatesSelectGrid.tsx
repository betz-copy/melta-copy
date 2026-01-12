import { useMatomo } from '@datapunt/matomo-tracker-react';
import { FilterList } from '@mui/icons-material';
import { Box, Button, Grid, SxProps, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { TreeViewBaseItem } from '@mui/x-tree-view-pro';
import { IMongoCategory } from '@packages/category';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import i18next from 'i18next';
import React, { Dispatch, useState } from 'react';
import { IoIosArrowBack, IoIosArrowDown } from 'react-icons/io';
import { getOptionsAndGroupsMiniFiltered, SelectCheckboxGroupProps, SelectCheckboxProps } from '../../common/SelectCheckBox';
import { Search } from '../../common/SelectCheckBox/Search';
import Tree from '../../common/Tree';
import { SelectAll } from '../../common/Tree/SelectAll';
import { useDarkModeStore } from '../../stores/darkMode';
import { groupTemplatesByCategory } from '../../utils/hooks/useTreeUtils';

const useStyles = makeStyles(() => ({
    button: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
    },
    popper: {
        borderRadius: '10px',
    },
}));

type ISplitTree = {
    tree: TreeViewBaseItem<IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory>[];
    flattenedTree: (IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory)[];
    filteredTree: (IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory)[];
};

export const getCategoriesSelectCheckboxGroupProps = (
    categories: IMongoCategory[] | undefined,
): SelectCheckboxProps<IMongoEntityTemplateWithConstraintsPopulated, IMongoCategory>['groupsProps'] => {
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

const getOptionId: SelectCheckboxProps<IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory, IMongoCategory>['getOptionId'] = ({ _id }) =>
    _id;
const getOptionLabel: SelectCheckboxProps<IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory, IMongoCategory>['getOptionLabel'] = ({
    displayName,
}) => displayName;

const getTreeOnSplittedTemplates = (splitTemplates: IMongoEntityTemplateWithConstraintsPopulated[], searchValue: string): ISplitTree => {
    const categories = splitTemplates.map(({ category }) => category);

    const filteredCategories = categories?.filter((category) => splitTemplates.some((template) => template.category._id === category._id));

    const groupsProps = getCategoriesSelectCheckboxGroupProps(filteredCategories) as { useGroups: true } & SelectCheckboxGroupProps<
        IMongoEntityTemplateWithConstraintsPopulated,
        IMongoCategory
    >;

    const { optionsFiltered: templatesFiltered, groupsFiltered: categoriesFiltered } = getOptionsAndGroupsMiniFiltered(
        searchValue,
        splitTemplates,
        getOptionId,
        getOptionLabel,
        groupsProps,
    );

    const tree = groupTemplatesByCategory(categories, splitTemplates, getOptionId);
    const filteredTree = categoriesFiltered ? groupTemplatesByCategory(categoriesFiltered, templatesFiltered, getOptionId) : templatesFiltered;

    return { tree, flattenedTree: splitTemplates, filteredTree };
};

const splitCategories = (templates: IMongoEntityTemplateWithConstraintsPopulated[], categories?: IMongoCategory[], splitIndex = 3) => {
    if (!categories?.length) return { firstSplittedTemplates: templates.slice(0, splitIndex), secondSplittedTemplates: templates.slice(splitIndex) };

    const firstSplittedCategoryIds = categories?.slice(0, splitIndex).map(({ _id }) => _id);
    const firstSplittedTemplates: IMongoEntityTemplateWithConstraintsPopulated[] = [];
    const secondSplittedTemplates: IMongoEntityTemplateWithConstraintsPopulated[] = [];

    templates.forEach((template) => {
        if (firstSplittedCategoryIds?.includes(template.category._id)) {
            firstSplittedTemplates.push(template);
        } else {
            secondSplittedTemplates.push(template);
        }
    });

    return { firstSplittedTemplates, secondSplittedTemplates };
};

const singleTree = (
    firstTree: ISplitTree,
    secondTree: ISplitTree,
    selectedTemplates: IMongoEntityTemplateWithConstraintsPopulated[],
    setSelectedTemplates: React.Dispatch<React.SetStateAction<(IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory)[]>>,
    onClick: () => void,
) => (
    <Tree
        preSelectedItemsIds={selectedTemplates.map(({ _id }) => _id)}
        getItemId={getOptionId}
        getItemLabel={getOptionLabel}
        multiSelect
        treeItems={firstTree.tree}
        filteredTreeItems={firstTree.filteredTree}
        onSelectItems={(ids) => {
            const newTree = [...firstTree.flattenedTree, ...secondTree.flattenedTree].filter((option) => ids.includes(getOptionId(option)));

            setSelectedTemplates(newTree);
            onClick();
        }}
    />
);

const TemplatesSelectGrid: React.FC<{
    templates: IMongoEntityTemplateWithConstraintsPopulated[];
    selectedTemplates: IMongoEntityTemplateWithConstraintsPopulated[];
    setSelectedTemplates: React.Dispatch<React.SetStateAction<(IMongoEntityTemplateWithConstraintsPopulated | IMongoCategory)[]>>;
    categories?: IMongoCategory[];
    setTemplates?: Dispatch<React.SetStateAction<IMongoEntityTemplateWithConstraintsPopulated[]>>;
    setOpenFilter: React.Dispatch<React.SetStateAction<boolean>>;
    openFilter: boolean;
    onClick: () => void;
}> = ({ templates, selectedTemplates, setSelectedTemplates, categories, setOpenFilter, openFilter, onClick }) => {
    const classes = useStyles();
    const [showAll, setShowAll] = useState<boolean>(false);

    const [miniFilterValue, setMiniFilterValue] = useState('');

    const { firstSplittedTemplates, secondSplittedTemplates } = splitCategories(templates, categories);

    const firstTree = getTreeOnSplittedTemplates(firstSplittedTemplates, miniFilterValue);
    const secondTree = getTreeOnSplittedTemplates(secondSplittedTemplates, miniFilterValue);
    const hasFirstTree = firstTree?.filteredTree?.length;

    const darkMode = useDarkModeStore((state) => state.darkMode);
    const { trackEvent } = useMatomo();

    const floatingBoxStyle: SxProps = {
        backgroundColor: darkMode ? '#121212' : '#fff',
        borderColor: darkMode ? '#121212' : '#fff',
        borderRadius: '0.5rem',
    };

    return (
        <Grid container gap="10px">
            <Grid>
                <Box sx={{ marginBottom: '20px', overflowY: 'auto', ...floatingBoxStyle }}>
                    <Button
                        className={classes.button}
                        onClick={() => {
                            setOpenFilter(!openFilter);

                            trackEvent({
                                category: 'filter-graph',
                                action: 'click',
                            });
                        }}
                        style={{
                            width: openFilter ? '235px' : '120px',
                            height: '50px',
                            zIndex: '100',
                            justifyContent: openFilter ? 'space-between' : 'center',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: openFilter ? '1rem' : '' }}>
                            <FilterList />
                            {i18next.t('graph.filter')}
                        </Box>
                    </Button>
                </Box>
                {openFilter && (
                    <Box sx={{ zIndex: '100', position: 'relative', padding: '5px', width: '235px', ...floatingBoxStyle }}>
                        <Typography
                            style={{
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
                        <Grid justifyItems="center">
                            <Search value={miniFilterValue} onChange={setMiniFilterValue} toTopBar={false} templatesSelectGrid />
                        </Grid>
                        <Box style={{ maxHeight: '25rem', paddingBottom: '5px', overflowY: 'auto', overflowX: 'hidden' }}>
                            <SelectAll
                                allOptionIds={templates.map(getOptionId)}
                                setSelectedOptionIds={(ids) => {
                                    const populated = templates.filter((option) => ids.includes(getOptionId(option)));
                                    setSelectedTemplates(populated);

                                    onClick();
                                }}
                                selectedOptionIds={selectedTemplates.map(getOptionId)}
                            />
                            {firstTree?.filteredTree?.length
                                ? singleTree(firstTree, secondTree, selectedTemplates, setSelectedTemplates, onClick)
                                : singleTree(secondTree, firstTree, selectedTemplates, setSelectedTemplates, onClick)}
                            {!!secondTree?.filteredTree?.length && (
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
                            )}
                        </Box>
                    </Box>
                )}
            </Grid>
            {!!secondTree?.filteredTree?.length && (
                <Grid>
                    <Box style={{ marginTop: '4.4rem' }}>
                        {openFilter && showAll && (
                            <Box sx={{ zIndex: '100', position: 'absolute', width: '235px', ...floatingBoxStyle }}>
                                <Box style={{ width: '100%', maxHeight: '28rem', overflowY: 'auto', paddingBottom: '4px' }}>
                                    {singleTree(
                                        hasFirstTree ? secondTree : firstTree,
                                        hasFirstTree ? firstTree : secondTree,
                                        selectedTemplates,
                                        setSelectedTemplates,
                                        onClick,
                                    )}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};

export default TemplatesSelectGrid;
