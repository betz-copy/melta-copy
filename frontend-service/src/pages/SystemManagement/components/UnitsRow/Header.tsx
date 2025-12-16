import { _debounce } from '@ag-grid-community/core';
import { IMongoUnit, IUnitHierarchy } from '@microservices/shared';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Grid, IconButton, Tooltip } from '@mui/material';
import i18next from 'i18next';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import SearchInput from '../../../../common/inputs/SearchInput';
import { flattenTree } from '../../../../common/Tree';
import { CreateButton } from '../CreateButton';

interface HeaderProps {
    expandedIds: string[];
    setExpandedIds: React.Dispatch<React.SetStateAction<string[]>>;

    hierarchy: IUnitHierarchy[];
    setFilteredUnits: React.Dispatch<React.SetStateAction<IUnitHierarchy[] | undefined>>;

    setWizardDialogState: React.Dispatch<
        React.SetStateAction<{
            isWizardOpen: boolean;
            unit: Partial<IMongoUnit> | IMongoUnit | null;
        }>
    >;
}

const filterNodes = (
    node: IUnitHierarchy,
    filterObject: Record<string, { value: any; mode: 'includes' | 'equals' }>,
    flattenedTree: IUnitHierarchy[] = [],
): { node: IUnitHierarchy; flattenTree: IUnitHierarchy[] } | null => {
    const matches = Object.entries(filterObject).every(([prop, rule]) => {
        const val = node[prop as keyof IUnitHierarchy];
        if (rule.value == null) return true;
        return rule.mode === 'includes' ? val?.toString().toLowerCase().includes(String(rule.value).toLowerCase()) : val === rule.value;
    });

    const children = node.children?.flatMap((child) => filterNodes(child, filterObject, flattenedTree)?.node ?? []);

    if (!matches && !children.length) return null;
    if (filterObject.disabled && node.disabled && !matches && !children.length) return null;

    const newNode = { ...node, children };
    flattenedTree.push(newNode);

    return { node: newNode, flattenTree: flattenedTree };
};

const Header = ({ setFilteredUnits, hierarchy, setWizardDialogState, setExpandedIds, expandedIds }: HeaderProps) => {
    const [isShowDisabled, setIsShowDisabled] = useState<boolean>(false);
    const [search, setSearch] = useState<string>();

    const flattenedTree = useMemo(() => flattenTree(hierarchy, ({ _id }) => _id, true), [hierarchy]);

    const filterUnitsOnSearchAndDisabled = useCallback(() => {
        const filteredUnits = hierarchy.flatMap(
            (singleHierarchy) =>
                filterNodes(singleHierarchy, {
                    name: { value: search, mode: 'includes' },
                    ...(isShowDisabled ? {} : { disabled: { value: false, mode: 'equals' } }),
                }) ?? [],
        );

        setFilteredUnits(filteredUnits.flatMap((unit) => unit?.node ?? []));

        return filteredUnits;
    }, [hierarchy, isShowDisabled, search, setFilteredUnits]);

    useEffect(() => {
        const filteredUnits = filterUnitsOnSearchAndDisabled();

        if (search?.trim()) {
            setExpandedIds(filteredUnits.flatMap((singleHierarchy) => singleHierarchy?.flattenTree.map(({ _id }) => _id) ?? []));
        }
    }, [search, setExpandedIds, filterUnitsOnSearchAndDisabled]);

    const onSearch = useCallback(
        _debounce((value: string) => {
            if (!value.trim()) {
                filterUnitsOnSearchAndDisabled();
                setExpandedIds([]);
            }
            setSearch(value);
        }, 500),
        [],
    );

    return (
        <Grid
            container
            spacing={1}
            alignItems="center"
            sx={{
                display: 'flex',
                flexDirection: 'row',
                marginBottom: '1rem',
                width: 'maxContent',
            }}
        >
            <Grid>
                <SearchInput onChange={onSearch} borderRadius="7px" placeholder={i18next.t('globalSearch.searchUnits')} />
            </Grid>

            <Grid>
                <CreateButton onClick={() => setWizardDialogState({ isWizardOpen: true, unit: null })} text={i18next.t('systemManagement.newUnit')} />
            </Grid>

            <div
                style={{
                    display: 'flex',
                    marginRight: '2rem',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <Tooltip
                    title={`${i18next.t(expandedIds.length ? 'wizard.unit.header.collapse' : 'wizard.unit.header.expand')} ${i18next.t('wizard.unit.unitTree')}`}
                >
                    <IconButton
                        onClick={() => {
                            if (expandedIds.length) setExpandedIds([]);
                            else setExpandedIds(flattenedTree?.map(({ _id }) => _id) ?? []);
                        }}
                    >
                        {expandedIds.length ? <CloseFullscreenIcon color="primary" /> : <OpenInFullIcon color="primary" />}
                    </IconButton>
                </Tooltip>

                <Tooltip
                    title={`${i18next.t(isShowDisabled ? 'wizard.unit.header.hide' : 'wizard.unit.header.show')} ${i18next.t('wizard.unit.header.disabledUnits')}`}
                >
                    <IconButton onClick={() => setIsShowDisabled((prev) => !prev)}>
                        {isShowDisabled ? <VisibilityIcon color="primary" /> : <VisibilityOffIcon color="primary" />}
                    </IconButton>
                </Tooltip>
            </div>
        </Grid>
    );
};
export default Header;
