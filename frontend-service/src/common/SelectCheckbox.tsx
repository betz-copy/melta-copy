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
}) => {
    return (
        <>
            <Checkbox checked={checked} indeterminate={indeterminate} />
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
    menuItemSx = { width: '100%', height: '24px', padding: '0px, 5px, 0px, 0px' },
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
                                            {!isDraggableDisabled && (
                                                <>
                                                    <Divider color="#101440" style={{ width: '8px' }} />
                                                    <Divider color="#101440" style={{ width: '8px' }} />
                                                    <Divider color="#101440" style={{ width: '8px' }} />
                                                </>
                                            )}
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
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    isDraggableDisabled,
    setOptions,
    groupsProps: { groups, getGroupOfOption, getGroupId, getGroupLabel },
}: {
    options: SelectCheckboxProps<Option, Group>['options'];
    selectedOptions: SelectCheckboxProps<Option, Group>['selectedOptions'];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'];
    groupsProps: SelectCheckboxGroupProps<Option, Group>;
    isDraggableDisabled: boolean;
    setOptions?: Dispatch<SetStateAction<Option[]>>;
}) => {
    const optionsByGroups = groupByWithInitial(options, groups.map(getGroupId), (option) => getGroupId(getGroupOfOption(option, groups)));
    const selectedOptionsByGroups = groupByWithInitial(selectedOptions, groups.map(getGroupId), (option) =>
        getGroupId(getGroupOfOption(option, groups)),
    );

    return (
        <>
            {groups.map((group, index) => {
                const optionsOfGroup = optionsByGroups[getGroupId(group)];
                const selectedOptionsOfGroup = selectedOptionsByGroups[getGroupId(group)];
                return (
                    <Fragment key={getGroupId(group)}>
                        <MenuItem
                            sx={{ padding: '0px, 5px, 0px, 0px' }}
                            onClick={() => {
                                setSelectedOptions((prevSelectedOptions) => {
                                    const prevSelectedOptionsOfGroup = prevSelectedOptions.filter(
                                        (option) => getGroupId(getGroupOfOption(option, groups)) === getGroupId(group),
                                    );
                                    const prevChecked = optionsOfGroup.length === prevSelectedOptionsOfGroup.length;

                                    if (prevChecked) {
                                        const selectedOptionsWithoutGroup = prevSelectedOptions.filter((prevSelectedOption) => {
                                            const isSelectedOptionInGroup = optionsOfGroup.some(
                                                (optionOfGroup) => getOptionId(optionOfGroup) === getOptionId(prevSelectedOption),
                                            );
                                            return !isSelectedOptionInGroup;
                                        });
                                        return selectedOptionsWithoutGroup;
                                    }

                                    const selectedOptionsWithGroup = lodashUniqby([...prevSelectedOptions, ...optionsOfGroup], getOptionId);
                                    return selectedOptionsWithGroup;
                                });
                            }}
                        >
                            <MenuItemContent
                                checked={selectedOptionsOfGroup.length === optionsOfGroup.length}
                                indeterminate={selectedOptionsOfGroup.length > 0 && selectedOptionsOfGroup.length < optionsOfGroup.length}
                                label={getGroupLabel(group)}
                                order={index}
                            />
                        </MenuItem>
                        <SelectOptionsMenuItems
                            options={optionsOfGroup}
                            selectedOptions={selectedOptions}
                            setSelectedOptions={setSelectedOptions}
                            getOptionId={getOptionId}
                            getOptionLabel={getOptionLabel}
                            isDraggableDisabled={isDraggableDisabled}
                            setOptions={setOptions}
                            menuItemSx={{ padding: '8px 16px 8px 36px' }}
                        />
                        {/* divider between groups */}
                        {index < groups.length - 1 && <Divider style={{ width: '199px', border: '1px solid #9398C280', background: '#9398C280' }} />}
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

export const MiniFilter: React.FC<{ value: string; onChange: (value: string) => void }> = ({ value, onChange }) => {
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
                    style={{
                        gap: '10px',
                        background: '#FFFFFF',
                        borderRadius: '7px',
                        width: '199px',
                        height: '34px',
                    }}
                    placeholder={i18next.t('searchLabel')}
                    fullWidth
                    InputProps={{
                        style: {
                            height: '34px',
                        },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                                style={{
                                    margin: 'auto',
                                    maxHeight: '34px',
                                    minHeight: '34px',
                                    height: '34px',
                                    borderRadius: '7px',
                                    padding: '0px, 10px, 0px, 0px',
                                    fontFamily: 'Rubik',
                                    fontSize: '12px',
                                    fontWeight: '400',
                                    lineHeight: '16px',
                                    letterSpacing: '0em',
                                    color: '#8D8D8E',
                                    textAlign: 'right',
                                    gap: '10px',
                                    boxSizing: 'border-box',
                                    font: 'webkit-control',
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
                                            top: '7px',
                                            left: '8px',
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
    selectedOptionsFiltered,
    setSelectedOptions,
    optionsFiltered,
    getOptionId,
}: {
    selectedOptionsFiltered: Option[];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    optionsFiltered: Option[];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
}) => {
    return (
        <MenuItem
            sx={{ padding: '0px, 5px, 0px, 0px' }}
            onClick={() => {
                const prevChecked = selectedOptionsFiltered.length === optionsFiltered.length;
                if (prevChecked) {
                    setSelectedOptions((prevSelectedOptions) => {
                        const selectedOptionsWithoutOptionsFiltered = prevSelectedOptions.filter((selectedOption) => {
                            const isSelectedOptionInOptionsFiltered = optionsFiltered.some(
                                (option) => getOptionId(option) === getOptionId(selectedOption),
                            );
                            return !isSelectedOptionInOptionsFiltered;
                        });
                        return selectedOptionsWithoutOptionsFiltered;
                    });
                } else {
                    setSelectedOptions((prevSelectedOptions) => {
                        const newSelectedOptions = lodashUniqby([...prevSelectedOptions, ...optionsFiltered], getOptionId);
                        return newSelectedOptions;
                    });
                }
            }}
        >
            <Grid
                style={{
                    width: '24px',
                    height: '24px',
                    gap: '2px',
                }}
            />
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
        <FormControl style={{ background: darkMode ? '#EBEFFA' : '#EBEFFA', borderRadius: '7px, 7px, 0px, 0px' }}>
            <Select
                displayEmpty
                renderValue={() => title}
                MenuProps={{
                    PaperProps: {
                        style: {
                            height: '180px',
                            minWidth: '219px',
                            backgroundColor: '#EBEFFA',
                            borderRadius: '20px, 0px, 20px, 20px',
                            padding: '5px, 10px, 5px, 10px',
                            boxShadow: '-2px 2px 4px 0px #1E27754D',
                            top: '39px',
                            gap: '15px',
                        },
                    },
                    transformOrigin: {
                        vertical: 'top',
                        horizontal: 162,
                    },
                }}
                size={size}
                style={
                    toTopBar
                        ? {
                              borderRadius: '7px',
                              backgroundColor: '#EBEFFA',
                              maxWidth: '130px',
                              maxHeight: '35px',
                              fontFamily: 'Rubik',
                              color: '#1E2775',
                              padding: '6.99px, 13.98px, 6.99px, 13.98px',
                              fontSize: '14px',
                              fontWeight: 400,
                          }
                        : {
                              borderRadius: '7px',
                          }
                }
            >
                <MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} />
                <ChooseAllMenuItem
                    selectedOptionsFiltered={selectedOptionsFiltered}
                    setSelectedOptions={setSelectedOptions}
                    optionsFiltered={optionsFiltered}
                    getOptionId={getOptionId}
                />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Divider style={{ width: '199px' }} />
                </Box>
                {groupsProps.useGroups ? (
                    <SelectOptionsMenuItemsGrouped
                        options={optionsFiltered}
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
