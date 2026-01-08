import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { IFilter } from '../../../../interfaces/childTemplates';
import { IUnitHierarchy } from '../../../../interfaces/units';

const filterNodes = (
    node: IUnitHierarchy,
    filterObject: Record<string, { value: IFilter; mode: 'includes' | 'equals' }>,
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

export const useSearchUnits = (hierarchy: IUnitHierarchy[]) => {
    const [searchedUnits, setSearchedUnits] = useState<IUnitHierarchy[] | undefined>([]);
    const [search, setSearch] = useState<string>();
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [isShowDisabled, setIsShowDisabled] = useState<boolean>(false);

    const filterUnitsOnSearchAndDisabled = useCallback(() => {
        const filteredUnits = hierarchy.flatMap(
            (singleHierarchy) =>
                filterNodes(singleHierarchy, {
                    name: { value: search, mode: 'includes' },
                    ...(isShowDisabled ? {} : { disabled: { value: false, mode: 'equals' } }),
                }) ?? [],
        );

        setSearchedUnits(filteredUnits.flatMap((unit) => unit?.node ?? []));

        return filteredUnits;
    }, [hierarchy, isShowDisabled, search]);

    useEffect(() => {
        const filteredUnits = filterUnitsOnSearchAndDisabled();

        if (search?.trim()) setExpandedIds(filteredUnits.flatMap((singleHierarchy) => singleHierarchy?.flattenTree.map(({ _id }) => _id) ?? []));
    }, [search, filterUnitsOnSearchAndDisabled]);

    const onSearch = useCallback(
        _.debounce((value: string) => {
            if (!value.trim()) {
                filterUnitsOnSearchAndDisabled();
                setExpandedIds([]);
            }
            setSearch(value);
        }, 500),
        [],
    );

    return {
        searchedUnits,
        setSearchedUnits,
        search,
        setSearch,
        expandedIds,
        setExpandedIds,
        setIsShowDisabled,
        onSearch,
        isShowDisabled,
    };
};
