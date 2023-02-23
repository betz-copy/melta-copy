import React, { Fragment, PropsWithChildren, Key, Dispatch, SetStateAction, useState } from 'react';
import i18next from 'i18next';
import lodashGroupBy from 'lodash.groupby';
import lodashUniqby from 'lodash.uniqby';
import { FormControl, Grid, Typography, ListItemText, MenuItem, Select, Checkbox, SxProps, Theme, TextField, Divider } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const MenuItemContent: React.FC<{ checked: boolean; indeterminate?: boolean; label: string }> = ({ checked, indeterminate, label }) => {
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
    getOptionId: (option: Option) => Key;
    getOptionLabel: (option: Option) => string;
    groupsProps?: { useGroups: false } | ({ useGroups: true } & SelectCheckboxGroupProps<Option, Group>);
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
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    menuItemSx = { padding: '6px 16px 6px 16px' },
}: {
    options: SelectCheckboxProps<Option, Group>['options'];
    selectedOptions: SelectCheckboxProps<Option, Group>['selectedOptions'];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'];
    menuItemSx?: SxProps<Theme>;
}) => {
    return (
        <>
            {options.map((option) => {
                const optionId = getOptionId(option);
                return (
                    <MenuItem
                        key={optionId}
                        onClick={() => {
                            setSelectedOptions((prevSelectedOptions) => {
                                const prevCheckedIndex = prevSelectedOptions.findIndex((selectedOption) => getOptionId(selectedOption) === optionId);
                                if (prevCheckedIndex === -1) {
                                    return [...prevSelectedOptions, option];
                                }
                                const newSelectedOptions = [...prevSelectedOptions];
                                newSelectedOptions.splice(prevCheckedIndex, 1);
                                return newSelectedOptions;
                            });
                        }}
                        sx={menuItemSx}
                    >
                        <MenuItemContent
                            checked={selectedOptions.some((selectedOption) => getOptionId(selectedOption) === optionId)}
                            label={getOptionLabel(option)}
                        />
                    </MenuItem>
                );
            })}
        </>
    );
};

const SelectOptionsMenuItemsGrouped = <Option extends any, Group extends any>({
    options,
    selectedOptions,
    setSelectedOptions,
    getOptionId,
    getOptionLabel,
    groupsProps: { groups, getGroupOfOption, getGroupId, getGroupLabel },
}: {
    options: SelectCheckboxProps<Option, Group>['options'];
    selectedOptions: SelectCheckboxProps<Option, Group>['selectedOptions'];
    setSelectedOptions: SelectCheckboxProps<Option, Group>['setSelectedOptions'];
    getOptionId: SelectCheckboxProps<Option, Group>['getOptionId'];
    getOptionLabel: SelectCheckboxProps<Option, Group>['getOptionLabel'];
    groupsProps: SelectCheckboxGroupProps<Option, Group>;
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
                            />
                        </MenuItem>
                        <SelectOptionsMenuItems
                            options={optionsOfGroup}
                            selectedOptions={selectedOptions}
                            setSelectedOptions={setSelectedOptions}
                            getOptionId={getOptionId}
                            getOptionLabel={getOptionLabel}
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
                MenuProps={{
                    PaperProps: {
                        style: {
                            maxHeight: '230px',
                        },
                    },
                }}
                size={size}
                style={toTopBar ? { borderRadius: '0 7px 7px 0' } : { borderRadius: '7px 7px 7px 7px' }}
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
                    />
                ) : (
                    <SelectOptionsMenuItems
                        options={optionsFiltered}
                        selectedOptions={selectedOptionsFiltered}
                        setSelectedOptions={setSelectedOptions}
                        getOptionId={getOptionId}
                        getOptionLabel={getOptionLabel}
                    />
                )}
            </Select>
        </FormControl>
    );
};

export { SelectCheckbox };
