import React, { Fragment, PropsWithChildren, Key, Dispatch, SetStateAction, useState, useEffect } from 'react';
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
    OutlinedInput,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { DragHandle as DragHandleIcon } from '@mui/icons-material';
import { RootState } from '../store';

const MenuItemContent: React.FC<{ checked: boolean; indeterminate?: boolean; label: string; order: number }> = ({
    checked,
    indeterminate,
    label,
}) => {
    return (
        <>
            <Checkbox checked={checked} indeterminate={indeterminate} sx={{ padding: '0px' }} />
            <ListItemText primary={<Typography style={{ fontWeight: '100' }}>{label}</Typography>} />
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
    overrideSx?: object;
    handleCheckboxClick: (value: boolean) => void;
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
    menuItemSx = { padding: '6px 16px 6px 16px' },
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

        // sync order to selectedOptions too
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
                                        <MenuItemContent checked={isOptionChecked(option)} label={getOptionLabel(option)} order={index + 1} />
                                        {!isDraggableDisabled && <DragHandleIcon fontSize="small" sx={{ zIndex: 1000 }} />}
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
                        {index < groups.length - 1 && <Divider />}
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
        <Grid container padding="8px 16px 8px 16px">
            <Grid item xs={12}>
                <TextField
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key !== 'Escape') {
                            // prevents autoselecting item while typing (default Select behaviour)
                            e.stopPropagation();
                        }
                    }}
                    placeholder={i18next.t('searchLabel')}
                    variant="standard"
                    fullWidth
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
    overrideSx,
    handleCheckboxClick = () => {},
}: SelectCheckboxProps<Option, Group>) => {
    const [miniFilterValue, setMiniFilterValue] = useState('');

    const darkMode = useSelector((state: RootState) => state.darkMode);

    const { optionsFiltered, groupsFiltered } = getOptionsAndGroupsMiniFiltered(miniFilterValue, options, getOptionId, getOptionLabel, groupsProps);

    const selectedOptionsFiltered = selectedOptions.filter((selectedOption) => {
        const isSelectedOptionInOptionsFiltered = optionsFiltered.some((option) => getOptionId(option) === getOptionId(selectedOption));
        return isSelectedOptionInOptionsFiltered;
    });

    return (
        <FormControl sx={{ background: darkMode ? '#242424' : 'white', width: '13rem' }}>
            <Select
                displayEmpty
                renderValue={() => title}
                MenuProps={{
                    PaperProps: {
                        style: {
                            maxHeight: '230px',
                        },
                    },
                }}
                size={size}
                sx={{ ...overrideSx, backgroundColor: 'white' }}
                onOpen={() => {
                    handleCheckboxClick(true);
                }}
                onClose={() => {
                    handleCheckboxClick(false);
                }}
            >
                <MiniFilter value={miniFilterValue} onChange={setMiniFilterValue} />
                <ChooseAllMenuItem
                    selectedOptionsFiltered={selectedOptionsFiltered}
                    setSelectedOptions={setSelectedOptions}
                    optionsFiltered={optionsFiltered}
                    getOptionId={getOptionId}
                />
                <Divider />
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
