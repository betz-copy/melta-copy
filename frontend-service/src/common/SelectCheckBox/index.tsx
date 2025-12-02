/* eslint-disable no-nested-ternary */

import { ExpandMore, FilterList } from '@mui/icons-material';
import { Box, FormControl, Grid, Select, Typography, useTheme } from '@mui/material';
import { TreeViewBaseItem } from '@mui/x-tree-view-pro';
import lodashUniqby from 'lodash.uniqby';
import { Dispatch, Key, PropsWithChildren, SetStateAction, useCallback, useState } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useDarkModeStore } from '../../stores/darkMode';
import Tree from '../Tree';
import { Search } from './Search';

export type SelectCheckboxGroupProps<Option extends {}, Group = Option> = {
    groups: Group[];
    getGroupOfOption: (option: Option, groups: Group[]) => Group;
    getGroupId: (group: Group) => Key;
    getGroupLabel: (group: Group) => string;
};

export type SelectCheckboxProps<Option extends {}, Group = Option> = PropsWithChildren<{
    title: string;
    filterIcon?: boolean;
    options: Option[];
    selectedOptions: Option[];
    setSelectedOptions: Dispatch<SetStateAction<Option[]>>;
    getOptionId: (option: Option) => string;
    getOptionLabel: (option: Option) => string;
    groupsProps?: { useGroups: false } | ({ useGroups: true } & SelectCheckboxGroupProps<Option, Group>);
    isDraggableDisabled?: boolean;
    setOptions?: Dispatch<SetStateAction<Option[]>>;
    size?: 'small' | 'medium';
    overrideSx?: object;
    toTopBar?: boolean;
    toUserProfile?: boolean;
    horizontalOrigin?: number;
    handleCheckboxClick?: (value: boolean) => void;
    onDragEnd?: (result: DropResult) => void;
    isSelectDisabled?: boolean;
    hideSearchBar?: boolean;
    hideChooseAll?: boolean;
    dynamicWidth?: number;
    showIcon?: boolean;
    treeFunc?: (groups: Group[], options: Option[], getItemId: SelectCheckboxProps<Option>['getOptionId']) => TreeViewBaseItem<Option>[];
}>;

export const getOptionsAndGroupsMiniFiltered = <Option extends {}, Group = Option>(
    miniFilterValue: string,
    options: SelectCheckboxProps<Option, Group>['options'],
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'],
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'],
    groupsProps: NonNullable<SelectCheckboxProps<Option, Group>['groupsProps']>,
) => {
    const optionsFilteredByLabel = options.filter((option) => getOptionLabel(option)?.includes(miniFilterValue));
    if (!groupsProps.useGroups) return { optionsFiltered: optionsFilteredByLabel, groupsFiltered: undefined };

    const { groups, getGroupOfOption, getGroupId, getGroupLabel } = groupsProps;

    const groupsFilteredByLabel = groups.filter((group) => getGroupLabel(group).includes(miniFilterValue));

    const optionsFilteredByGroupLabel = options.filter((option) => {
        const groupOfOption = getGroupOfOption(option, groups);
        const isGroupMatchedByLabel = groupsFilteredByLabel.some(
            (groupFilteredByLabel) => getGroupId(groupFilteredByLabel) === getGroupId(groupOfOption),
        );
        return isGroupMatchedByLabel; // if group matched by label, show all of its option
    });

    const optionsFiltered = lodashUniqby([...optionsFilteredByLabel, ...optionsFilteredByGroupLabel], getOptionId);

    const groupsFilteredBySomeOptionOfGroupLabel = groups.filter((group) => {
        const isSomeOptionOfGroupMatched = optionsFilteredByLabel.some(
            (option) => getGroupId(getGroupOfOption(option, groups)) === getGroupId(group),
        );
        return isSomeOptionOfGroupMatched; // if some option in group is shown, show it's group too
    });
    const groupsFiltered = lodashUniqby([...groupsFilteredByLabel, ...groupsFilteredBySomeOptionOfGroupLabel], getGroupId);

    return { optionsFiltered, groupsFiltered };
};

export const CustomExpandMore = ({ filterIcon, ...rest }) => {
    return <Box sx={{ gap: '10px', marginRight: '14px' }}>{filterIcon ? <FilterList {...rest} /> : <ExpandMore {...rest} />}</Box>;
};

const SelectCheckbox = <Option extends {}, Group = Option>({
    title,
    filterIcon,
    options,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled = false,
    size = 'medium',
    overrideSx,
    toTopBar,
    toUserProfile = false,
    horizontalOrigin = 154,
    handleCheckboxClick = () => {},
    isSelectDisabled = false,
    hideSearchBar,
    hideChooseAll,
    dynamicWidth,
    groupsProps = { useGroups: false },
    treeFunc,
    onDragEnd,
    setOptions,
    showIcon,
}: SelectCheckboxProps<Option, Group>) => {
    const [miniFilterValue, setMiniFilterValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const onDragEndDefault = useCallback(
        (result: DropResult) => {
            const { destination, source } = result;
            if (!destination) return;

            const newOptionsOrder = Array.from(options);
            const [movedOption] = newOptionsOrder.splice(source.index, 1);
            newOptionsOrder.splice(destination.index, 0, movedOption);

            if (setOptions) {
                setOptions(newOptionsOrder);
            }

            setSelectedOptions((prevSelectOptions) => {
                return newOptionsOrder.filter((option) =>
                    prevSelectOptions.some((selectedOption) => getOptionId(selectedOption) === getOptionId(option)),
                );
            });
        },
        [getOptionId, options, setOptions, setSelectedOptions],
    );

    const selectedOptionIds = selectedOptions.map(getOptionId);

    const theme = useTheme();

    const templatesFilteredCallback = useCallback(
        () => getOptionsAndGroupsMiniFiltered(miniFilterValue, options, getOptionId, getOptionLabel, groupsProps),
        [getOptionId, getOptionLabel, groupsProps, miniFilterValue, options],
    );

    const { optionsFiltered: templatesFiltered, groupsFiltered } = templatesFilteredCallback();

    const filteredTree = useCallback(
        () => (groupsFiltered && treeFunc ? treeFunc(groupsFiltered, templatesFiltered, getOptionId) : templatesFiltered),
        [getOptionId, groupsFiltered, templatesFiltered, treeFunc],
    );

    const treeItems = useCallback(
        () => (groupsProps.useGroups && treeFunc ? treeFunc(groupsProps.groups, options, getOptionId) : options),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [getOptionId, JSON.stringify(groupsProps), options, treeFunc],
    );

    const borderRadiusStyle = overrideSx ? (isOpen ? '12px 12px 12px 0' : '12px') : isOpen ? '7px 7px 0 0' : '7px';

    return (
        <FormControl style={{ borderRadius: isOpen ? '7px 7px 0 0' : '7px' }}>
            <Select
                displayEmpty
                renderValue={() => <Box>{title}</Box>}
                MenuProps={{
                    PaperProps: {
                        style: {
                            height: toTopBar ? '180px' : '333px',
                            minWidth: '219px',
                            width: horizontalOrigin === 154 ? '219px' : dynamicWidth ? `${dynamicWidth}px` : undefined,
                            ...(darkMode ? {} : { backgroundColor: toTopBar ? '#EBEFFA' : '#FFFFFF' }),
                            borderRadius: overrideSx ? '10px' : '20px 0px 20px 20px',
                            padding: toTopBar ? '5px, 10px' : '10px, 10px, 5px, 10px',
                            boxShadow: '-2px 2px 6px 0px #1E27754D',
                            top: '39px',
                            gap: '15px',
                            marginTop: '5px',
                            border: darkMode ? `solid 2px ${theme.palette.primary.main}` : 'none',
                        },
                        sx: {
                            overflowY: 'overlay',
                            '::-webkit-scrollbar-track': {
                                marginY: '1rem',
                                bgcolor: toTopBar ? '#EBEFFA' : '#FFFFFF',
                                borderRadius: '5px',
                            },
                            '::-webkit-scrollbar-thumb': { background: toTopBar ? '' : '#EBEFFA' },
                        },
                    },
                    transformOrigin: {
                        vertical: overrideSx ? 'top' : 'top',
                        horizontal: overrideSx ? 'center' : horizontalOrigin,
                    },
                }}
                IconComponent={(params) => CustomExpandMore({ filterIcon, ...params })}
                size={size}
                onOpen={() => {
                    setMiniFilterValue('');
                    setIsOpen(true);
                    handleCheckboxClick(true);
                }}
                onClose={() => {
                    setIsOpen(false);
                    handleCheckboxClick(false);
                }}
                sx={{
                    ...overrideSx,
                    '& .MuiSelect-select ': {
                        borderRadius: borderRadiusStyle,
                    },
                    fontFamily: 'Rubik',
                    fontSize: '14px',
                    fontWeight: 400,
                    boxShadow: toUserProfile ? '0px 3px 10px rgba(0,0,0,0.2)' : 'none',
                    borderRadius: '8px',
                    ...(darkMode
                        ? {
                              color: theme.palette.primary.main,
                              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d2d3e3' },
                          }
                        : {
                              '& .MuiOutlinedInput-notchedOutline': { display: 'none' },
                              background: toTopBar ? '#EBEFFA' : '#FFFFFF',
                              color: toTopBar ? '#1E2775' : '#787C9E',
                          }),
                    maxWidth: !overrideSx ? (toTopBar ? '130px' : '131px') : undefined,
                    maxHeight: toTopBar ? '35px' : '34px',
                    padding: toTopBar ? '6.99px, 13.98px' : '0px, 8px',
                    '& .MuiSvgIcon-root': {
                        color: filterIcon ? (darkMode ? '#9398C2' : '#1E2775') : '',
                        transform: filterIcon ? 'none' : '',
                    },
                }}
            >
                <Grid container justifyContent="center">
                    {!isSelectDisabled && !hideSearchBar && <Search value={miniFilterValue} onChange={setMiniFilterValue} toTopBar={toTopBar} />}
                </Grid>

                {hideChooseAll ? (
                    <Typography color={theme.palette.primary.main} fontFamily="Rubik" fontWeight={400} marginX="16px" marginY="8px">
                        {title}
                    </Typography>
                ) : undefined}

                <Tree
                    onDragEnd={({ itemId, newPosition, oldPosition }) => {
                        const transformedDrag: DropResult = {
                            draggableId: itemId,
                            type: 'DEFAULT',
                            source: {
                                index: oldPosition.index,
                                droppableId: oldPosition.parentId!,
                            },
                            destination: {
                                index: newPosition.index,
                                droppableId: newPosition.parentId!,
                            },
                            reason: 'DROP',
                            combine: undefined,
                            mode: 'FLUID',
                        };

                        if (onDragEnd) return onDragEnd(transformedDrag);
                        return onDragEndDefault(transformedDrag);
                    }}
                    isSelectable={!isSelectDisabled}
                    selectAll={!hideChooseAll}
                    preSelectedItemsIds={selectedOptionIds}
                    getItemId={getOptionId}
                    getItemLabel={getOptionLabel}
                    filteredTreeItems={filteredTree()}
                    multiSelect
                    treeItems={treeItems()}
                    isDraggable={!isDraggableDisabled}
                    onSelectItems={(ids) => {
                        const filteredOptions = options.filter((option) => ids.includes(getOptionId(option)));
                        setSelectedOptions(filteredOptions);
                    }}
                    showIcon={showIcon}
                />
            </Select>
        </FormControl>
    );
};

export { SelectCheckbox };
