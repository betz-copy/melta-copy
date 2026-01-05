import { Grid, MenuItem } from '@mui/material';
import { IGraphFilterBody } from '@packages/entity';
import { IAgGridDateFilter, IAgGridNumberFilter, IAgGridTextFilter } from '@packages/rule-breach';
import i18next from 'i18next';
import React from 'react';
import { FieldOption } from '../../wizards/entityTemplate/RelationshipReference/filterEntitiesByCriteria';
import { StyledFilterInput } from './StyledFilterInput';
import { TypeSelectFilter } from './TypeSelectFilter';

interface SelectFilterInputProps {
    filterField?: IAgGridNumberFilter | IAgGridDateFilter | IAgGridTextFilter;
    handleFilterFieldChange: (value: IGraphFilterBody['filterField'], condition?: boolean) => void;
    readOnly?: boolean;
    isBooleanSelect?: boolean;
    enumOptions?: FieldOption[];
    error?: boolean;
    helperText?: string;
    filterType?: {
        type: string;
        handleFilterTypeChange: (
            newTypeFilter: IAgGridDateFilter['type'] | IAgGridTextFilter['type'] | IAgGridNumberFilter['type'],
            condition?: boolean,
        ) => void;
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
    const key = filterField?.filterType === 'date' ? 'dateFrom' : 'filter';

    return (
        <Grid container justifyContent="space-between">
            {!!filterType && (
                <Grid size={{ xs: entityFilter ? 4.85 : 12 }}>
                    <TypeSelectFilter
                        filterField={filterField as IAgGridNumberFilter | IAgGridTextFilter}
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
                    value={filterField?.[key]}
                    onChange={(e) =>
                        handleFilterFieldChange({ ...filterField, [key]: e.target.value } as
                            | IAgGridNumberFilter
                            | IAgGridDateFilter
                            | IAgGridTextFilter)
                    }
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
