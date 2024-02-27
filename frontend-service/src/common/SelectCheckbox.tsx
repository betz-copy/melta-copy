import React, { Fragment, PropsWithChildren, Key, Dispatch, SetStateAction, useState } from 'react';
import i18next from 'i18next';
import lodashGroupBy from 'lodash.groupby';
import lodashUniqby from 'lodash.uniqby';
import {
    FormControl,
    Grid,
    Typography,
    ListItemText,
    MenuItem,
    Select,
    Checkbox,
    SxProps,
    Theme,
    TextField,
    Divider,
    Box,
    InputAdornment,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { RootState } from '../store';

const MenuItemContent: React.FC<{ checked: boolean; indeterminate?: boolean; label: string; order: number }> = ({
    checked,
    indeterminate,
    label,
    order,
}) => {
    return (
        <>
            <Checkbox
                checked={checked}
                indeterminate={indeterminate}
                checkedIcon={
                    <Box
                        sx={{
                            borderRadius: '4px',
                            background: '#4752B6',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <img src="/icons/checked-icon.svg" style={{ width: '14px', height: '14px' }} />
                    </Box>
                }
                icon={
                    <Box
                        sx={{
                            borderRadius: '4px',
                            background: order === 0 ? '#4752B6' : '',
                            border: order === 0 ? 'none' : '1px solid #4752B6',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {order === 0 && <img src="/icons/not-checked-icon.svg" style={{ width: '11px', height: '14px' }} />}
                    </Box>
                }
                sx={{ borderRadius: '4px', color: '#4752B6' }}
            />
            <ListItemText
                primary={
                    <Typography
                        style={{
                            fontFamily: 'Rubik',
                            fontSize: '14px',
                            fontWeight: '400',
                            lineHeight: '17px',
                            letterSpacing: '0em',
                            textAlign: 'right',
                            color: '#101440',
                            width: '45px',
                            height: '17px',
                            marginRight: '10px',
                        }}
                    >
                        {label}
                    </Typography>
                }
            />
        </>
    );
};

type SelectCheckboxGroupProps<Option extends any, Group extends any> = {
    groups: Group[];
    getGroupOfOption: (option: Option, groups: Group[]) => Group;
    getGroupId: (group: Group) => Key;
    getGroupLabel: (group: Group) => string;
};

export type SelectCheckboxProps<Option extends any, Group extends any = any> = PropsWithChildren<{
    title: string;
    options: Option[];
    selectedOptions: Option[];
    setSelectedOptions: Dispatch<SetStateAction<Option[]>>;
    getOptionId: (option: Option) => string;
    getOptionLabel: (option: Option) => string;
    groupsProps?: { useGroups: false } | ({ useGroups: true } & SelectCheckboxGroupProps<Option, Group>);
    isDraggableDisabled?: boolean;
    setOptions?: Dispatch<SetStateAction<Option[]>>;
    size?: 'small' | 'medium';
    toTopBar?: boolean;
}>;

const groupByWithInitial = <T extends any>(collection: T[], keys: PropertyKey[], func: (value: T) => PropertyKey) => {
    const groupedCollectionInitial = Object.fromEntries(keys.map((key) => [key, [] as T[]]));
    const groupedCollection = lodashGroupBy(collection, func);

    return { ...groupedCollectionInitial, ...groupedCollection };
};

const SelectOptionsMenuItems = <Option extends any, Group extends any>({
    options,
    setOptions,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled,
    menuItemSx = { width: '100%', height: '24px', padding: '0px, 5px, 0px, 0px', my: '5px' },
}: {
    options: SelectCheckboxProps<Option, Group>['options'];
    selectedOptions: SelectCheckboxProps<Option, Group>['selectedOptions'];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'];
    isDraggableDisabled: boolean;
    setOptions?: Dispatch<SetStateAction<Option[]>>;
    menuItemSx?: SxProps<Theme>;
}) => {
    const isOptionChecked = (option: Option) => selectedOptions.some((selectedOption) => getOptionId(selectedOption) === getOptionId(option));

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
        <DragDropContext onDragEnd={onDragEnd}>
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
                                        sx={menuItemSx}
                                    >
                                        <Grid
                                            style={{
                                                width: '24px',
                                                height: '24px',
                                                gap: '2px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignContent: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {!isDraggableDisabled && <img src="/icons/draggable-icon.svg" />}
                                        </Grid>
                                        <MenuItemContent checked={isOptionChecked(option)} label={getOptionLabel(option)} order={index + 1} />
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

const SelectOptionsMenuItemsGrouped = <Option extends any, Group extends any>({
    options,
    optionsFiltered,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled,
    setOptions,
    groupsProps: { groups, getGroupOfOption, getGroupId, getGroupLabel },
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
                const optionsOfGroup = optionsByGroups[getGroupId(group)];
                const filteredOptionsOfGroup = filteredOptionsByGroups[getGroupId(group)];
                const selectedOptionsOfGroup = selectedOptionsByGroups[getGroupId(group)];
                return (
                    <Fragment key={getGroupId(group)}>
                        <MenuItem
                            sx={{ width: '100%', height: '24px', padding: '0px, 5px, 0px, 0px', my: '5px' }}
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
                            }}
                        >
                            <MenuItemContent
                                checked={selectedOptionsOfGroup.length === filteredOptionsOfGroup.length}
                                indeterminate={selectedOptionsOfGroup.length > 0 && selectedOptionsOfGroup.length < filteredOptionsOfGroup.length}
                                label={getGroupLabel(group)}
                                order={index}
                            />
                        </MenuItem>
                        <SelectOptionsMenuItems
                            options={filteredOptionsOfGroup}
                            selectedOptions={selectedOptions}
                            setSelectedOptions={setSelectedOptions}
                            getOptionId={getOptionId}
                            getOptionLabel={getOptionLabel}
                            isDraggableDisabled={isDraggableDisabled}
                            setOptions={setOptions}
                        />
                        {/* divider between groups */}
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

const getOptionsAndGroupsMiniFiltered = <Option extends any, Group extends any>(
    miniFilterValue: string,
    options: SelectCheckboxProps<Option, Group>['options'],
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'],
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'],
    groupsProps: NonNullable<SelectCheckboxProps<Option, Group>['groupsProps']>,
) => {
    const optionsFilteredByLabel = options.filter((option) => getOptionLabel(option).includes(miniFilterValue));
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

export const MiniFilter: React.FC<{ value: string; onChange: (value: string) => void; toTopBar: boolean | undefined }> = ({
    value,
    onChange,
    toTopBar,
}) => {
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
                    variant="standard"
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') {
                            // prevents autoselecting item while typing (default Select behaviour)
                            e.stopPropagation();
                        }
                    }}
                    style={{
                        gap: '10px',
                        background: toTopBar ? '#FFFFFF' : '#EBEFFA',
                        borderRadius: '7px',
                        width: '199px',
                        height: '34px',
                    }}
                    placeholder={i18next.t('searchLabel')}
                    fullWidth
                    InputProps={{
                        disableUnderline: true,
                        style: {
                            height: '34px',
                            fontFamily: 'Rubik',
                            fontSize: '12px',
                            color: '#8D8D8E',
                            textAlign: 'right',
                            gap: '10px',
                            boxSizing: 'border-box',
                            borderRadius: '7px',
                        },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                                sx={{
                                    fontWeight: '400',
                                    letterSpacing: '0em',
                                    lineHeight: '16px',
                                }}
                            >
                                <Divider
                                    orientation="vertical"
                                    style={{ height: '20px', width: '1px', background: '#1E2775', border: '1.5px solid #1E2775' }}
                                />
                                <Box
                                    sx={{
                                        width: '30px',
                                        height: '28px',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        justifyItems: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <img
                                        color="#1E2775"
                                        width="14px"
                                        height="14px"
                                        style={{
                                            marginRight: '8px',
                                            marginLeft: '8px',
                                        }}
                                        src="/icons/search-blue.svg"
                                    />
                                </Box>
                            </InputAdornment>
                        ),
                        startAdornment: <InputAdornment position="start" />,
                    }}
                />
            </Grid>
        </Grid>
    );
};

const ChooseAllMenuItem = <Option extends any, Group extends any>({
    options,
    selectedOptionsFiltered,
    setSelectedOptions,
    optionsFiltered,
}: {
    options: Option[];
    selectedOptionsFiltered: Option[];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    optionsFiltered: Option[];
}) => {
    return (
        <MenuItem
            sx={{ width: '100%', height: '24px', padding: '0px, 5px, 0px, 0px', my: '5px' }}
            onClick={() => {
                const prevChecked = selectedOptionsFiltered.length === optionsFiltered.length;
                if (prevChecked) {
                    setSelectedOptions([]);
                } else {
                    setSelectedOptions(options);
                }
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
    options,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    groupsProps = { useGroups: false },
    isDraggableDisabled = false,
    setOptions,
    size = 'medium',
    toTopBar,
}: SelectCheckboxProps<Option, Group>) => {
    const [miniFilterValue, setMiniFilterValue] = useState('');

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const { optionsFiltered, groupsFiltered } = getOptionsAndGroupsMiniFiltered(miniFilterValue, options, getOptionId, getOptionLabel, groupsProps);

    const selectedOptionsFiltered = selectedOptions.filter((selectedOption) => {
        const isSelectedOptionInOptionsFiltered = optionsFiltered.some((option) => getOptionId(option) === getOptionId(selectedOption));
        return isSelectedOptionInOptionsFiltered;
    });

    return (
        <FormControl style={{ background: darkMode ? '#242424' : 'white', borderRadius: '0 7px 7px 0' }}>
            <Select
                displayEmpty
                renderValue={() => title}
                onOpen={() => {
                    setMiniFilterValue('');
                }}
                MenuProps={{
                    PaperProps: {
                        style: {
                            height: '180px',
                            minWidth: '219px',
                            backgroundColor: toTopBar ? '#EBEFFA' : '#FFFFFF',
                            borderRadius: '20px, 0px, 20px, 20px',
                            padding: '5px, 10px, 5px, 10px',
                            boxShadow: '-2px 2px 4px 0px #1E27754D',
                            top: '39px',
                            gap: '15px',
                        },
                    },
                    transformOrigin: {
                        vertical: 'top',
                        horizontal: toTopBar ? 162 : 170,
                    },
                }}
                size={size}
                sx={{ borderRadius: '7px', fontFamily: 'Rubik', fontSize: '14px', fontWeight: 400 }}
                style={
                    toTopBar
                        ? {
                              backgroundColor: '#EBEFFA',
                              maxWidth: '130px',
                              maxHeight: '35px',
                              color: '#1E2775',
                              padding: '6.99px, 13.98px, 6.99px, 13.98px',
                          }
                        : {
                              backgroundColor: '#FFFFFF',
                              maxWidth: '131px',
                              maxHeight: '34px',
                              color: '#787C9E',
                              padding: '0px, 8px, 0px, 8px',
                          }
                }
            >
                <MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} toTopBar={toTopBar} />
                <ChooseAllMenuItem
                    options={options}
                    selectedOptionsFiltered={selectedOptionsFiltered}
                    setSelectedOptions={setSelectedOptions}
                    optionsFiltered={optionsFiltered}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center', my: '5px' }}>
                    <Divider style={{ width: '199px' }} />
                </Box>
                {groupsProps.useGroups ? (
                    <SelectOptionsMenuItemsGrouped
                        options={options}
                        optionsFiltered={optionsFiltered}
                        selectedOptions={selectedOptionsFiltered}
                        setSelectedOptions={setSelectedOptions}
                        getOptionId={getOptionId}
                        getOptionLabel={getOptionLabel}
                        groupsProps={{ ...groupsProps, groups: groupsFiltered! }}
                        isDraggableDisabled={isDraggableDisabled}
                        setOptions={setOptions}
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
                    />
                )}
            </Select>
        </FormControl>
    );
};

export { SelectCheckbox };
