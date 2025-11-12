import { Grid } from '@mui/material';
import React, { useEffect } from 'react';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGridDateFilter, IAGGridNumberFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { StyledFilterInput } from './StyledFilterInput';
import { TypeSelectFilter } from './TypeSelectFilter';

interface TextFilterProps {
    entityFilter: boolean;
    readOnly: boolean;
    filterField: IAGGridNumberFilter | IAGGridTextFilter | undefined;
    type: string;
    handleFilterTypeChange: (
        newTypeFilter: IAGGridDateFilter['type'] | IAGGridTextFilter['type'] | IAGGridNumberFilter['type'],
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
    useEffect(() => {
        if (forceEqualsType && filterField && filterField.type !== 'equals') {
            handleFilterTypeChange('equals');
        }
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
                        filterField={filterField as IAGGridNumberFilter | IAGGridTextFilter}
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
                            type === 'number'
                                ? ({
                                      ...filterField,
                                      filter: value ? Number(value) : undefined,
                                      type: forceEqualsType ? 'equals' : filterField?.type,
                                  } as IAGGridNumberFilter)
                                : ({
                                      ...filterField,
                                      filter: value || undefined,
                                      type: forceEqualsType ? 'equals' : filterField?.type,
                                  } as IAGGridTextFilter);

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
