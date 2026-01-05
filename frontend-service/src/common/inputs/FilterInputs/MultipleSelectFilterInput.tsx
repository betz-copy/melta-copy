import { Chip, Grid, ListItemText, MenuItem } from '@mui/material';
import { IAgGridSetFilter } from '@packages/rule-breach';
import i18next from 'i18next';
import React from 'react';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { FieldOption } from '../../wizards/entityTemplate/RelationshipReference/filterEntitiesByCriteria';
import { StyledFilterInput } from './StyledFilterInput';

interface MultipleSelectFilterInputProps {
    filterField: IAgGridSetFilter | undefined;
    readOnly: boolean;
    handleCheckboxChange: (option: (string | null)[], checked: boolean) => void;
    enumOptions: FieldOption[];
    isError?: boolean;
    helperText?: string;
    allowEmpty?: boolean;
}

const MultipleSelectFilterInput: React.FC<MultipleSelectFilterInputProps> = ({
    filterField,
    readOnly,
    handleCheckboxChange,
    enumOptions,
    isError,
    helperText,
    allowEmpty = true,
}) => {
    const expectedValues = [...enumOptions, ...(allowEmpty ? [null] : [])];
    const allSelected = !!expectedValues.length && expectedValues.every((val) => filterField?.values?.includes(val?.option ?? null));
    const someSelected = !!filterField?.values?.length && !allSelected;

    return (
        <Grid container justifyContent="center">
            <StyledFilterInput
                select
                rows={2}
                size="small"
                fullWidth
                value={filterField?.values ?? []}
                error={isError}
                helperText={helperText}
                slotProps={{
                    htmlInput: {
                        readOnly,
                        style: {
                            textOverflow: 'ellipsis',
                        },
                    },
                    select: {
                        multiple: true,
                        renderValue: (selected: any) => (
                            <div>
                                {selected.map((value: string) => (
                                    <Chip key={value} label={value === null ? i18next.t('filters.empty') : value} style={{ marginRight: 5 }} />
                                ))}
                            </div>
                        ),
                    },
                }}
            >
                <MenuItem>
                    <MeltaCheckbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={(e) =>
                            handleCheckboxChange(
                                expectedValues.map((ev) => ev?.option ?? null),
                                e.target.checked,
                            )
                        }
                    />
                    <ListItemText primary={i18next.t('selectChooseAll')} />
                </MenuItem>

                {allowEmpty && (
                    <MenuItem>
                        <MeltaCheckbox
                            checked={filterField?.values?.includes(null)}
                            onChange={(e) => handleCheckboxChange([null], e.target.checked)}
                        />
                        <ListItemText primary={i18next.t('filters.empty')} />
                    </MenuItem>
                )}

                {enumOptions?.map((option, index) => (
                    <MenuItem key={`${option.option}-${index}`} value={option.option}>
                        <MeltaCheckbox
                            checked={filterField?.values.includes(option.option)}
                            onChange={(e) => handleCheckboxChange([option.option], e.target.checked)}
                        />
                        <ListItemText primary={option.label} />
                    </MenuItem>
                ))}
            </StyledFilterInput>
        </Grid>
    );
};

export { MultipleSelectFilterInput };
