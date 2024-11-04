/* eslint-disable no-nested-ternary */
import { Menu, Search, Hive as HiveIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    ListItemText,
    MenuItem,
    Select,
    SxProps,
    TextField,
    Theme,
    Typography,
    useTheme,
} from '@mui/material';
import i18next from 'i18next';
import lodashGroupBy from 'lodash.groupby';
import lodashUniqby from 'lodash.uniqby';
import React, { Dispatch, Fragment, Key, PropsWithChildren, ReactElement, SetStateAction, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { IoIosArrowBack, IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';
import { MeltaTooltip } from './MeltaTooltip';
import { MeltaCheckbox } from './MeltaCheckbox';
import { useDarkModeStore } from '../stores/darkMode';

export type MenuItemContentProps<Option = any> = {
    checked?: boolean;
    indeterminate?: boolean;
    label: string;
    order: number;
    isDraggable?: boolean;
    group?: boolean;
    insideGroup?: boolean;
    option?: Option;
};

export const MenuItemContent: React.FC<MenuItemContentProps> = ({ checked, indeterminate, label, isDraggable, group, insideGroup, option }) => {
    return (
        <>
            {!group && (
                <Grid
                    style={{
                        width: '24px',
                        height: '24px',
                        gap: '2px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignContent: 'center',
                        justifyContent: 'center',
                        marginRight: insideGroup ? '30px' : '7px',
                    }}
                >
                    {isDraggable && <Menu sx={{ fontSize: '1rem' }} />}
                </Grid>
            )}
            <MeltaCheckbox checked={checked} indeterminate={indeterminate} />

            <ListItemText
                primary={
                    <MeltaTooltip title={label}>
                        <Typography
                            style={{
                                fontFamily: 'Rubik',
                                fontSize: '14px',
                                fontWeight: '400',
                                lineHeight: '17px',
                                letterSpacing: '0em',
                                textAlign: 'right',
                                color: '#101440',
                                width: '120px',
                                height: '17px',
                                marginRight: '10px',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                            }}
                        >
                            {label}
                        </Typography>
                    </MeltaTooltip>
                }
            />
        </>
    );
};

export type SelectCheckboxGroupProps<Option extends any, Group extends any> = {
    groups: Group[];
    getGroupOfOption: (option: Option, groups: Group[]) => Group;
    getGroupId: (group: Group) => Key;
    getGroupLabel: (group: Group) => string;
};

export type SelectCheckboxProps<Option extends any, Group extends any = any> = PropsWithChildren<{
    title: string;
    img?: ReactElement;
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
    horizontalOrigin?: number;
    handleCheckboxClick?: (value: boolean) => void;
    onDragEnd?: (result: DropResult) => void;
    isSelectDisabled?: boolean;
    hideSearchBar?: boolean;
    hideChooseAll?: boolean;
    dynamicWidth?: number;
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

                const optionsOfGroup = optionsByGroups[getGroupId(group)];
                const filteredOptionsOfGroup = filteredOptionsByGroups[getGroupId(group)];
                const selectedOptionsOfGroup = selectedOptionsByGroups[getGroupId(group)];
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
                                            (option) => getGroupId(getGroupOfOption(option, groups)) === getGroupId(group),
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

export const MiniFilter: React.FC<{ value: string; onChange: (value: string) => void; toTopBar?: boolean; templatesSelectGrid?: boolean }> = ({
    value,
    onChange,
    toTopBar,
    templatesSelectGrid,
}) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    // must wrap with TextField with Grid. no idea why, but it works :O
    return (
        <Grid container>
            <Grid
                item
                xs={12}
                width="199px"
                height="34px"
                style={{ display: 'flex', justifyContent: 'center', alignContent: 'center', maxHeight: '34px' }}
            >
                <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') {
                            // prevents autoselecting item while typing (default Select behaviour)
                            e.stopPropagation();
                        }
                    }}
                    sx={{
                        ...(darkMode
                            ? {}
                            : {
                                  background: toTopBar || templatesSelectGrid ? '#FFFFFF' : '#EBEFFA',
                                  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                              }),
                        boxShadow: templatesSelectGrid ? '-2px 2px 6px 0px #1E27754D' : '',
                        borderRadius: '7px',
                        width: '199px',
                        height: '34px',
                    }}
                    placeholder={i18next.t('searchLabel')}
                    fullWidth
                    InputProps={{
                        style: {
                            fontFamily: 'Rubik',
                            fontSize: '12px',
                            textAlign: 'right',
                            borderRadius: '7px',
                        },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                                sx={{
                                    padding: '0px, 10px, 0px, 0px',
                                    fontWeight: '400',
                                    letterSpacing: '0em',
                                    lineHeight: '16px',
                                    gap: '10px',
                                }}
                            >
                                <Divider
                                    orientation="vertical"
                                    style={{
                                        width: '1px',
                                        height: '20px',
                                        borderRadius: '1.5px',
                                        backgroundColor: theme.palette.primary.main,
                                    }}
                                />
                                <Search sx={{ fontSize: '1.3rem', color: theme.palette.primary.main }} />
                            </InputAdornment>
                        ),
                        startAdornment: <InputAdornment position="start" />,
                    }}
                />
            </Grid>
        </Grid>
    );
};

export const ChooseAllMenuItem = <Option extends any, Group extends any>({
    options,
    selectedOptionsFiltered,
    setSelectedOptions,
    optionsFiltered,
    onClick,
}: {
    options: Option[];
    selectedOptionsFiltered: Option[];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    optionsFiltered: Option[];
    onClick?: () => void;
}) => {
    return (
        <MenuItem
            sx={{ width: '100%', height: '24px', padding: '0px', my: '10px' }}
            onClick={() => {
                const prevChecked = selectedOptionsFiltered.length === optionsFiltered.length;
                if (prevChecked) {
                    setSelectedOptions([]);
                } else {
                    setSelectedOptions(options);
                }
                onClick?.();
            }}
        >
            <MenuItemContent
                checked={selectedOptionsFiltered.length === optionsFiltered.length}
                indeterminate={selectedOptionsFiltered.length < optionsFiltered.length && selectedOptionsFiltered.length > 0}
                label={i18next.t('selectChooseAll')}
                order={0}
            />
        </MenuItem>
    );
};

const SelectCheckbox = <Option extends any, Group extends any>({
    title,
    img,
    options,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    groupsProps = { useGroups: false },
    isDraggableDisabled = false,
    setOptions,
    size = 'medium',
    overrideSx,
    toTopBar,
    horizontalOrigin = 154,
    handleCheckboxClick = () => {},
    onDragEnd,
    isSelectDisabled = false,
    hideSearchBar,
    hideChooseAll,
    dynamicWidth,
}: SelectCheckboxProps<Option, Group>) => {
    const [miniFilterValue, setMiniFilterValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const darkMode = useDarkModeStore((state) => state.darkMode);

    const theme = useTheme();

    const { optionsFiltered, groupsFiltered } = getOptionsAndGroupsMiniFiltered(miniFilterValue, options, getOptionId, getOptionLabel, groupsProps);

    let selectedOptionsFiltered;
    if (!isSelectDisabled)
        selectedOptionsFiltered = selectedOptions!.filter((selectedOption) => {
            const isSelectedOptionInOptionsFiltered = optionsFiltered.some((option) => getOptionId(option) === getOptionId(selectedOption));
            return isSelectedOptionInOptionsFiltered;
        });

    // eslint-disable-next-line no-nested-ternary

    const borderRadiusStyle = overrideSx ? (isOpen ? '12px 12px 12px 0' : '12px') : isOpen ? '7px 7px 0 0' : '7px';
    const [openMap, setOpenMap] = useState<{ [groupId: string]: boolean }>({});
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
                {!isSelectDisabled && !hideChooseAll ? (
                    <>
                        <ChooseAllMenuItem
                            options={options}
                            selectedOptionsFiltered={selectedOptionsFiltered}
                            setSelectedOptions={setSelectedOptions}
                            optionsFiltered={optionsFiltered}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                            <Divider style={{ width: '199px' }} />
                        </Box>
                    </>
                ) : (
                    <Typography color={theme.palette.primary.main} fontFamily="Rubik" fontWeight={400} marginX="16px" marginY="8px">
                        {title}
                    </Typography>
                )}

                {groupsProps.useGroups ? (
                    <SelectOptionsMenuItemsGrouped
                        options={options}
                        optionsFiltered={optionsFiltered}
                        selectedOptions={selectedOptionsFiltered!}
                        setSelectedOptions={setSelectedOptions}
                        getOptionId={getOptionId}
                        getOptionLabel={getOptionLabel}
                        groupsProps={{ ...groupsProps, groups: groupsFiltered! }}
                        isDraggableDisabled={isDraggableDisabled}
                        setOptions={setOptions}
                        openMap={openMap}
                        setOpenMap={setOpenMap}
                    />
                ) : (
                    <SelectOptionsMenuItems
                        options={optionsFiltered}
                        selectedOptions={selectedOptionsFiltered}
                        setSelectedOptions={setSelectedOptions}
                        getOptionId={getOptionId}
                        getOptionLabel={getOptionLabel}
                        isDraggableDisabled={isDraggableDisabled}
                        setOptions={setOptions}
                        handleOnDragEnd={onDragEnd}
                    />
                )}
            </Select>
        </FormControl>
    );
};

export { SelectCheckbox };
