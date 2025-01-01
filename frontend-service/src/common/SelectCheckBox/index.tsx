/* eslint-disable no-nested-ternary */
import { Box, Button, Divider, FormControl, Grid, MenuItem, Select, SxProps, Theme, useTheme } from '@mui/material';
import lodashGroupBy from 'lodash.groupby';
import lodashUniqby from 'lodash.uniqby';
import React, { Dispatch, Fragment, Key, PropsWithChildren, ReactElement, SetStateAction, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { IoIosArrowBack, IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { useDarkModeStore } from '../../stores/darkMode';
import Tree from '../Tree';
import { flattenTree } from '../../utils/hooks/useTreeUtils';
import { MenuItemContent } from './MenuItemContent';
import { MiniFilter } from './MiniFilter';
import { TreeType } from '../../interfaces/Tree';

export type SelectCheckboxGroupProps<Option extends any, Group extends any> = {
    groups: Group[];
    getGroupOfOption: (option: Option, groups: Group[]) => Group;
    getGroupId: (group: Group) => Key;
    getGroupLabel: (group: Group) => string;
};

export type SelectCheckboxProps<Option extends any, Group extends any = any> = PropsWithChildren<{
    title: string;
    img?: ReactElement;
    options: TreeType<Option>[];
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
    horizontalOrigin?: number;
    handleCheckboxClick?: (value: boolean) => void;
    onDragEnd?: (result: DropResult) => void;
    isSelectDisabled?: boolean;
    hideSearchBar?: boolean;
    hideChooseAll?: boolean;
    dynamicWidth?: number;
    showIcon?: boolean;
}>;

export const groupByWithInitial = <T extends any>(collection: T[], keys: PropertyKey[], func: (value: T) => PropertyKey) => {
    const groupedCollectionInitial = Object.fromEntries(keys.map((key) => [key, [] as T[]]));
    const groupedCollection = lodashGroupBy(collection, func);

    return { ...groupedCollectionInitial, ...groupedCollection };
};

export const SelectOptionsMenuItems = <Option extends any, Group extends any>({
    options,
    setOptions,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled,
    menuItemSx = { width: '100%', height: '24px', padding: '0px, 5px, 0px, 0px', my: '5px' },
    insideGroup,
    handleOnDragEnd,
    showIcon,
}: {
    options: SelectCheckboxProps<Option, Group>['options'];
    selectedOptions?: SelectCheckboxProps<Option, Group>['selectedOptions'];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'];
    isDraggableDisabled: boolean;
    setOptions?: Dispatch<SetStateAction<Option[]>>;
    menuItemSx?: SxProps<Theme>;
    insideGroup?: boolean;
    handleOnDragEnd?: (result: DropResult) => void;
    showIcon?: boolean;
}) => {
    const isOptionChecked = (option: Option) => selectedOptions?.some((selectedOption) => getOptionId(selectedOption) === getOptionId(option));

    const onDragEnd = (result: DropResult) => {
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
    };

    return (
        <DragDropContext onDragEnd={handleOnDragEnd ?? onDragEnd}>
            <Droppable droppableId="selectCheckboxDroppable">
                {(provided) => (
                    <Grid ref={provided.innerRef} {...provided.droppableProps}>
                        {options.map((option, index) => (
                            <Draggable draggableId={getOptionId(option)} index={index} key={getOptionId(option)} isDragDisabled={isDraggableDisabled}>
                                {(draggableProvided) => (
                                    <MenuItem
                                        ref={draggableProvided.innerRef}
                                        {...draggableProvided.draggableProps}
                                        {...draggableProvided.dragHandleProps}
                                        onClick={() => {
                                            setSelectedOptions((prevSelectedOptions) => {
                                                const isChecked = isOptionChecked(option);
                                                if (isChecked) {
                                                    return prevSelectedOptions.filter(
                                                        (selectedOption) => getOptionId(selectedOption) !== getOptionId(option),
                                                    );
                                                }
                                                return [...prevSelectedOptions, option];
                                            });
                                        }}
                                        sx={{
                                            ...menuItemSx,
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            padding: '0px',
                                        }}
                                    >
                                        <MenuItemContent
                                            checked={isOptionChecked(option)}
                                            showIcon={showIcon}
                                            label={getOptionLabel(option)}
                                            order={index + 1}
                                            isDraggable={!isDraggableDisabled}
                                            insideGroup={insideGroup}
                                            option={option}
                                        />
                                    </MenuItem>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </Grid>
                )}
            </Droppable>
        </DragDropContext>
    );
};

export const SelectOptionsMenuItemsGrouped = <Option extends any, Group extends any>({
    options,
    optionsFiltered,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled,
    setOptions,
    groupsProps: { groups, getGroupOfOption, getGroupId, getGroupLabel },
    openMap,
    setOpenMap,
    onClick,
}: {
    options: Option[];
    optionsFiltered: SelectCheckboxProps<Option, Group>['options'];
    selectedOptions: SelectCheckboxProps<Option, Group>['selectedOptions'];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'];
    groupsProps: SelectCheckboxGroupProps<Option, Group>;
    isDraggableDisabled: boolean;
    setOptions?: Dispatch<SetStateAction<Option[]>>;
    openMap: { [groupId: string]: boolean };
    setOpenMap: React.Dispatch<
        React.SetStateAction<{
            [groupId: string]: boolean;
        }>
    >;
    onClick?: () => void;
}) => {
    const optionsByGroups = groupByWithInitial(options, groups.map(getGroupId), (option) => getGroupId(getGroupOfOption(option, groups)));
    const filteredOptionsByGroups = groupByWithInitial(optionsFiltered, groups.map(getGroupId), (option) =>
        getGroupId(getGroupOfOption(option, groups)),
    );
    const selectedOptionsByGroups = groupByWithInitial(selectedOptions, groups.map(getGroupId), (option) =>
        getGroupId(getGroupOfOption(option, groups)),
    );
    return (
        <>
            {groups.map((group, index) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const groupId = getGroupId(group);
                const isOpen = openMap[groupId] || false;

                const optionsOfGroup = optionsByGroups[groupId];
                const filteredOptionsOfGroup = filteredOptionsByGroups[groupId];
                const selectedOptionsOfGroup = selectedOptionsByGroups[groupId];
                return (
                    <Fragment key={groupId}>
                        <Box display="flex" flex="row">
                            <Button
                                sx={{ minWidth: 'auto', marginLeft: '4px' }}
                                onClick={() => setOpenMap((prev) => ({ ...prev, [groupId]: !isOpen }))}
                            >
                                {isOpen ? <IoIosArrowDown /> : <IoIosArrowBack />}
                            </Button>
                            <MenuItem
                                sx={{ padding: '0px', width: '100%', height: '24px', my: '7px' }}
                                onClick={() => {
                                    setSelectedOptions((prevSelectedOptions) => {
                                        const prevSelectedOptionsOfGroup = prevSelectedOptions.filter(
                                            (option) => getGroupId(getGroupOfOption(option, groups)) === groupId,
                                        );
                                        const prevChecked = optionsOfGroup.length === prevSelectedOptionsOfGroup.length;
                                        const prevFiltered = selectedOptionsOfGroup.length === filteredOptionsOfGroup.length;

                                        if (prevChecked) {
                                            if (prevFiltered) {
                                                const selectedOptionsWithoutGroup = prevSelectedOptions.filter((prevSelectedOption) => {
                                                    const isSelectedOptionInGroup = optionsOfGroup.some(
                                                        (optionOfGroup) => getOptionId(optionOfGroup) === getOptionId(prevSelectedOption),
                                                    );
                                                    return !isSelectedOptionInGroup;
                                                });
                                                setSelectedOptions(selectedOptionsWithoutGroup);
                                                return selectedOptionsWithoutGroup;
                                            }
                                        }

                                        const selectedOptionsWithGroup = lodashUniqby([...prevSelectedOptions, ...optionsOfGroup], getOptionId);
                                        setSelectedOptions(selectedOptionsWithGroup);
                                        return selectedOptionsWithGroup;
                                    });
                                    onClick?.();
                                }}
                            >
                                <MenuItemContent
                                    checked={selectedOptionsOfGroup.length === filteredOptionsOfGroup.length}
                                    indeterminate={selectedOptionsOfGroup.length > 0 && selectedOptionsOfGroup.length < filteredOptionsOfGroup.length}
                                    label={getGroupLabel(group)}
                                    order={index}
                                    group
                                />
                            </MenuItem>
                        </Box>
                        {isOpen && (
                            <SelectOptionsMenuItems
                                options={filteredOptionsOfGroup}
                                selectedOptions={selectedOptions}
                                setSelectedOptions={setSelectedOptions}
                                getOptionId={getOptionId}
                                getOptionLabel={getOptionLabel}
                                isDraggableDisabled={isDraggableDisabled}
                                setOptions={setOptions}
                                insideGroup
                            />
                        )}
                        {index < groups.length - 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                                <Divider style={{ width: '199px' }} />
                            </Box>
                        )}
                    </Fragment>
                );
            })}
        </>
    );
};

export const getOptionsAndGroupsMiniFiltered = <Option extends any, Group extends any>(
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

const SelectCheckbox = <Option extends any, Group extends any>({
    title,
    img,
    options,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled = false,
    size = 'medium',
    overrideSx,
    toTopBar,
    horizontalOrigin = 154,
    handleCheckboxClick = () => {},
    isSelectDisabled = false,
    hideSearchBar,
    hideChooseAll,
    dynamicWidth,
}: SelectCheckboxProps<Option, Group>) => {
    const [miniFilterValue, setMiniFilterValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const optionIds = selectedOptions.map(getOptionId);

    const theme = useTheme();

    // eslint-disable-next-line no-nested-ternary

    const borderRadiusStyle = overrideSx ? (isOpen ? '12px 12px 12px 0' : '12px') : isOpen ? '7px 7px 0 0' : '7px';

    const flattenedTree = flattenTree(options, getOptionId);

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
                // eslint-disable-next-line react/no-unstable-nested-components
                IconComponent={() => (
                    <Box display="flex" alignContent="center" alignItems="center" sx={{ gap: '10px', marginRight: '14px' }}>
                        {img ||
                            (isOpen ? (
                                <IoIosArrowUp style={{ color: theme.palette.primary.main, height: '16px', width: '16px' }} />
                            ) : (
                                <IoIosArrowDown style={{ color: theme.palette.primary.main, height: '16px', width: '16px' }} />
                            ))}
                    </Box>
                )}
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
                    boxShadow: '-2px 2px 6px 0px #1E277540',
                    borderRadius: '8px',
                    ...(darkMode
                        ? { color: theme.palette.primary.main, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#d2d3e3' } }
                        : {
                              '& .MuiOutlinedInput-notchedOutline': { display: 'none' },
                              background: toTopBar ? '#EBEFFA' : '#FFFFFF',
                              color: toTopBar ? '#1E2775' : '#787C9E',
                          }),
                    maxWidth: !overrideSx ? (toTopBar ? '130px' : '131px') : undefined,
                    maxHeight: toTopBar ? '35px' : '34px',
                    padding: toTopBar ? '6.99px, 13.98px' : '0px, 8px',
                }}
            >
                {!isSelectDisabled && !hideSearchBar && <MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} toTopBar={toTopBar} />}

                <Tree
                    selectAll={!hideChooseAll}
                    flattenedTree={flattenedTree}
                    preSelectedItemsIds={optionIds}
                    getItemId={getOptionId}
                    getItemLabel={getOptionLabel}
                    multi
                    treeItems={options as any}
                    isDraggable={!isDraggableDisabled}
                    onSelectItems={(ids) => {
                        const filteredOptions = flattenedTree.filter(({ _id }) => ids.includes(_id));
                        setSelectedOptions(filteredOptions);
                    }}
                />
            </Select>
        </FormControl>
    );
};

export { SelectCheckbox };
