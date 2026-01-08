import _ from 'lodash';
import { useCallback, useEffect, useState } from 'react';

export type IMuiTreeItem = object & {
    children?: IMuiTreeItem[];
};

export type IFilterResult<T> = { node: T; flattenTree: T[] } | null;

type ConditionFunction<T> = (item: T, search: string | undefined, isShowDisabled: boolean) => boolean;

export const filterNodes = <T extends IMuiTreeItem>(
    node: T,
    condition: ConditionFunction<T>,
    search: string | undefined,
    isShowDisabled: boolean,
    flattenedTree: T[] = [],
): IFilterResult<T> => {
    const matches = condition(node, search, isShowDisabled);

    const children = node.children?.flatMap((child) => filterNodes(child as T, condition, search, isShowDisabled, flattenedTree)?.node ?? []) ?? [];

    if (!matches && children.length === 0) return null;

    const newNode = { ...node, children } as T;
    flattenedTree.push(newNode);

    return { node: newNode, flattenTree: flattenedTree };
};

export const useSearchUnits = <T extends IMuiTreeItem>(hierarchy: T[], getItemId: (item: T) => string, condition: ConditionFunction<T>) => {
    const [searchedUnits, setSearchedUnits] = useState<T[] | undefined>([]);
    const [search, setSearch] = useState<string>();
    const [expandedIds, setExpandedIds] = useState<string[]>([]);
    const [isShowDisabled, setIsShowDisabled] = useState<boolean>(false);

    const filterUnitsOnSearchAndDisabled = useCallback(() => {
        const filteredUnits = hierarchy.flatMap((singleHierarchy) => filterNodes(singleHierarchy, condition, search, isShowDisabled) ?? []);

        setSearchedUnits(filteredUnits.flatMap((unit) => unit?.node ?? []));

        return filteredUnits;
    }, [hierarchy, isShowDisabled, search]);

    useEffect(() => {
        const filteredUnits = filterUnitsOnSearchAndDisabled();

        if (search?.trim()) setExpandedIds(filteredUnits.flatMap((singleHierarchy) => singleHierarchy?.flattenTree.map(getItemId) ?? []));
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
