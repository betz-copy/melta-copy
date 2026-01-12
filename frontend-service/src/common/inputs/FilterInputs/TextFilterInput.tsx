import { Grid } from '@mui/material';
import { IGraphFilterBody } from '@packages/entity';
import { basicFilterOperationTypes, FilterTypes, IAgGridDateFilter, IAgGridNumberFilter, IAgGridTextFilter } from '@packages/rule-breach';
import React, { useEffect } from 'react';
import { StyledFilterInput } from './StyledFilterInput';
import { TypeSelectFilter } from './TypeSelectFilter';

interface TextFilterProps {
    entityFilter: boolean;
    readOnly: boolean;
    filterField: IAgGridNumberFilter | IAgGridTextFilter | undefined;
    type: string;
    handleFilterTypeChange: (
        newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type'],
        condition?: boolean,
    ) => void;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    hideFilterType?: boolean;
    forceEqualsType?: boolean;
    error?: boolean;
    helperText?: string;
}

const TextFilterInput: React.FC<TextFilterProps> = ({
    entityFilter,
    readOnly,
    filterField,
    type,
    handleFilterTypeChange,
    handleFilterFieldChange,
    error,
    helperText,
    hideFilterType = false,
    forceEqualsType = false,
}) => {
    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        if (forceEqualsType && filterField && filterField.type !== basicFilterOperationTypes.equals)
            handleFilterTypeChange(basicFilterOperationTypes.equals);
    }, [forceEqualsType, filterField]);

    return (
        <Grid
            container
            justifyContent="center"
            direction={entityFilter ? 'row' : 'column'}
            spacing={1}
            sx={{ height: 'fit-content', display: 'flex', flexWrap: 'nowrap' }}
        >
            {!hideFilterType && (
                <Grid size={{ xs: entityFilter ? 5 : 12 }}>
                    <TypeSelectFilter
                        filterField={filterField as IAgGridNumberFilter | IAgGridTextFilter}
                        handleFilterTypeChange={handleFilterTypeChange}
                        readOnly={readOnly || forceEqualsType}
                        type={type}
                    />
                </Grid>
            )}

            <Grid size={{ xs: hideFilterType ? 12 : entityFilter ? 7 : 12 }}>
                <StyledFilterInput
                    size="small"
                    fullWidth
                    type={type}
                    value={filterField?.filter !== undefined ? String(filterField.filter) : ''}
                    disabled={readOnly}
                    error={error}
                    helperText={helperText}
                    onChange={(e) => {
                        const { value } = e.target;
                        const updatedFilter =
                            type === FilterTypes.number
                                ? ({
                                      ...filterField,
                                      filter: value ? Number(value) : undefined,
                                      type: forceEqualsType ? basicFilterOperationTypes.equals : filterField?.type,
                                  } as IAgGridNumberFilter)
                                : ({
                                      ...filterField,
                                      filter: value || undefined,
                                      type: forceEqualsType ? basicFilterOperationTypes.equals : filterField?.type,
                                  } as IAgGridTextFilter);

                        handleFilterFieldChange(updatedFilter);
                    }}
                    readOnly={readOnly}
                    forceOutlined
                />
            </Grid>
        </Grid>
    );
};

export { TextFilterInput };
