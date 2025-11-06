import { Grid, MenuItem } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IGraphFilterBody } from '../../../interfaces/entities';
import { IAGGridNumberFilter, IAGGridTextFilter } from '../../../utils/agGrid/interfaces';
import { IAGGridFilter } from '../../wizards/entityTemplate/commonInterfaces';
import { StyledFilterInput } from './StyledFilterInput';
import { TypeSelectFilter } from './TypeSelectFilter';

interface SelectFilterInputProps {
    filterField: IAGGridFilter | undefined;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    readOnly?: boolean;
    isBooleanSelect?: boolean;
    enumOptions?: { option: string; label: string }[];
    error?: boolean;
    helperText?: string;
    filterType?: {
        type: string;
        handleFilterTypeChange: (newTypeFilter: IAGGridFilter['filterType'], condition?: boolean) => void;
    };
    entityFilter?: boolean;
}

const SelectFilterInput: React.FC<SelectFilterInputProps> = ({
    filterField,
    handleFilterFieldChange,
    enumOptions,
    readOnly,
    isBooleanSelect,
    error,
    helperText,
    filterType,
    entityFilter,
}) => {
    const options = isBooleanSelect
        ? [
              { option: true, label: i18next.t('booleanOptions.yes') },
              { option: false, label: i18next.t('booleanOptions.no') },
          ]
        : enumOptions;

    return (
        <Grid container justifyContent="space-between">
            {!!filterType && (
                <Grid size={{ xs: entityFilter ? 4.85 : 12 }}>
                    <TypeSelectFilter
                        filterField={filterField as IAGGridNumberFilter | IAGGridTextFilter}
                        handleFilterTypeChange={filterType.handleFilterTypeChange}
                        readOnly={readOnly}
                        type={filterType.type ?? ''}
                        filterType
                    />
                </Grid>
            )}

            <Grid size={{ xs: !filterType ? 12 : entityFilter ? 7 : 12 }}>
                <StyledFilterInput
                    select
                    size="small"
                    fullWidth
                    value={filterField?.filter ?? ''}
                    onChange={(e) => handleFilterFieldChange({ filterType: 'text', type: 'equals', filter: e.target.value } as IAGGridTextFilter)}
                    disabled={readOnly}
                    error={error}
                    helperText={helperText}
                    slotProps={{
                        htmlInput: {
                            readOnly,
                            style: {
                                textOverflow: 'ellipsis',
                            },
                        },
                    }}
                    forceOutlined
                    label={filterType ? i18next.t('wizard.entityTemplate.relationshipRef.fieldLabel') : undefined}
                >
                    {options?.map(({ option, label }) => (
                        <MenuItem key={option} value={option}>
                            {label}
                        </MenuItem>
                    ))}
                </StyledFilterInput>
            </Grid>
        </Grid>
    );
};

export { SelectFilterInput };
