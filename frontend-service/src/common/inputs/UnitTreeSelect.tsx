import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Popover, TextField, TextFieldProps, Typography } from '@mui/material';
import i18next from 'i18next';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchUnits } from '../../pages/SystemManagement/components/UnitsRow/useSearchUnits';
import { getUnitHierarchy } from '../../services/userService';
import { useWorkspaceStore } from '../../stores/workspace';
import { ChevronDown } from '../../utils/icons/fontAwesome';
import { ColoredEnumChip } from '../ColoredEnumChip';
import MeltaTooltip from '../MeltaDesigns/MeltaTooltip';
import Tree, { flattenTree } from '../Tree';

export interface UnitSelectProps {
    value?: string | string[];
    onChange: (value: string | string[] | undefined) => void;
    label?: string;
    disabled?: boolean;
    multiple?: boolean;
    autofocus?: boolean;
    placeholder?: string;
    hideError?: boolean;
    error?: boolean;
    required?: boolean;
    textFieldProps?: TextFieldProps;
}

interface IChip {
    pathName: string;
    pathIds: string[];
    name: string;
}

const EMPTY_CHIP: IChip = { pathName: '', pathIds: [] as string[], name: '' } as const;

const UnitSelect = ({
    value,
    onChange,
    label,
    disabled = false,
    multiple = false,
    autofocus = false,
    placeholder = '',
    error = false,
    required = false,
    textFieldProps = {},
}: UnitSelectProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const inputRef = useRef<HTMLDivElement>(null);
    const [hover, setHover] = useState(false);

    const workspace = useWorkspaceStore((state) => state.workspace);

    const { data: unitHierarchies = [] } = useQuery({
        queryKey: ['unitHierarchy', workspace._id],
        queryFn: () => getUnitHierarchy(workspace._id),
        initialData: [],
    });

    const flattenedTreeMap = useMemo(
        () => new Map(flattenTree(unitHierarchies, ({ _id }) => _id, true).map((item) => [item._id, item])),
        [unitHierarchies],
    );

    const { expandedIds, searchedUnits, setExpandedIds, search, setSearch } = useSearchUnits(unitHierarchies);

    const chips: IChip[] = useMemo(() => {
        if (!value) return [];

        const valueAsArray = Array.isArray(value) ? value : [value];

        return valueAsArray.map((singleValue) => {
            const found = flattenedTreeMap.get(singleValue);
            if (!found) return EMPTY_CHIP;

            const pathIds = found.path.split('/');

            return {
                pathName: pathIds
                    .map((id) => flattenedTreeMap.get(id)?.name)
                    .reverse()
                    .join(' < '),
                pathIds: pathIds.slice(0, -1),
                name: found.name,
            };
        });
    }, [value, flattenedTreeMap]);

    const actuallyDisabled = useMemo(
        () => disabled || (!Array.isArray(value) && flattenedTreeMap.get(value ?? '')?.disabled),
        [disabled, value, flattenedTreeMap],
    );

    // biome-ignore lint/correctness/useExhaustiveDependencies: only on first render
    useEffect(() => {
        setExpandedIds(chips.flatMap(({ pathIds }) => pathIds));
    }, []);

    return (
        <>
            <TextField
                {...textFieldProps}
                ref={inputRef}
                fullWidth
                color="primary"
                disabled={actuallyDisabled}
                autoFocus={autofocus}
                placeholder={placeholder}
                variant="outlined"
                error={error}
                label={label}
                value={search}
                onClick={(event) => {
                    if (actuallyDisabled) return;

                    setAnchorEl(event.currentTarget);
                }}
                onChange={(e) => {
                    setSearch(e.target.value);
                    onChange(undefined);
                }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                required={required && !value}
                slotProps={{
                    input: {
                        autoComplete: 'off',
                        startAdornment: value ? (
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    ...(multiple
                                        ? {
                                              width: '100%',
                                              flexWrap: 'wrap',
                                              maxHeight: '8rem',
                                              overflowY: 'auto',
                                              overflowX: 'hidden',
                                              direction: 'rtl',
                                              padding: '0.5rem',
                                              justifyContent: 'flex-start',
                                              flexDirection: 'row-reverse',
                                          }
                                        : {}),
                                }}
                            >
                                {chips
                                    .filter((chip) => chip.name)
                                    .map((chip) => (
                                        <MeltaTooltip title={chip.pathName} key={chip.pathName}>
                                            <div>
                                                <ColoredEnumChip label={chip.name} />
                                            </div>
                                        </MeltaTooltip>
                                    ))}
                            </Box>
                        ) : null,
                        endAdornment: (
                            <>
                                {!actuallyDisabled && value && hover && (
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(multiple ? [] : undefined);
                                        }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                )}

                                <IconButton
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAnchorEl(inputRef.current);
                                    }}
                                    disabled={actuallyDisabled}
                                >
                                    <ChevronDown
                                        size="0.9rem"
                                        style={{
                                            rotate: anchorEl ? '180deg' : '0deg',
                                        }}
                                    />
                                </IconButton>
                            </>
                        ),
                    },
                }}
            />

            <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => {
                    setAnchorEl(null);
                    setExpandedIds([]);
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                disableAutoFocus
                transitionDuration={0}
                slotProps={{
                    paper: {
                        style: {
                            boxShadow: '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
                        },
                    },
                }}
            >
                <Box
                    sx={{
                        minWidth: inputRef.current?.clientWidth,
                        maxHeight: (inputRef.current?.clientHeight ?? 0) * 4,
                        overflowY: 'auto',
                    }}
                >
                    {searchedUnits?.length ? (
                        <Tree
                            preSelectedItemsIds={Array.isArray(value) ? value : [value ?? '']}
                            treeItems={unitHierarchies}
                            filteredTreeItems={searchedUnits}
                            preExpandedItemIds={expandedIds}
                            onExpandedItemsChange={(_e, items) => setExpandedIds(items)}
                            getItemId={(u) => u._id}
                            getItemLabel={(u) => u.name}
                            autoFocus={autofocus}
                            selectionPropagation={{
                                descendants: false,
                                parents: false,
                            }}
                            multiSelect={multiple || undefined}
                            removeDivider
                            onSelectItems={(id) => {
                                onChange((!multiple && Array.isArray(id) ? id?.[0] : id) ?? undefined);
                                setSearch('');
                            }}
                        />
                    ) : (
                        <Typography padding="0.5rem" sx={{ opacity: 0.8, marginLeft: '0.5rem' }}>
                            {i18next.t('noOptions')}
                        </Typography>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default UnitSelect;
