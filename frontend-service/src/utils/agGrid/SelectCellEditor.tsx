import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, Box, Grid, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { MeltaCheckbox } from '../../common/MeltaCheckbox';
import { ColoredEnumChip } from '../../common/ColoredEnumChip';
import { MeltaTooltip } from '../../common/MeltaTooltip';
import { HighlightText } from '../HighlightText';

interface SelectCellEditorProps {
    options: string[];
    value?: string | string[];
    onValueChange: (newValue: string | string[] | null) => void;
    multiple?: boolean;
    colorsOptions?: Record<string, string>;
}

const SelectCellEditor: React.FC<SelectCellEditorProps> = ({ options, value, onValueChange, multiple = false, colorsOptions }) => {
    const [selectedValues, setSelectedValues] = useState<string | string[] | undefined>(value || (multiple ? [] : ''));

    useEffect(() => {
        setSelectedValues(value || (multiple ? [] : ''));
    }, [value, multiple]);

    const handleAutocompleteChange = (newValue: string | string[] | null) => {
        // eslint-disable-next-line no-nested-ternary
        const updatedValue = newValue === null ? (multiple ? [] : '') : newValue;
        setSelectedValues(updatedValue);
        onValueChange(updatedValue);
    };

    return (
        <Autocomplete<string, boolean>
            multiple={multiple}
            value={selectedValues}
            onChange={(_, newValue) => handleAutocompleteChange(newValue)}
            disableCloseOnSelect={multiple}
            options={options}
            fullWidth
            getOptionLabel={(option) => option}
            isOptionEqualToValue={(option, val) => option === val}
            renderOption={(props, option) => (
                <Box component="li" {...props} key={option} style={{ height: '40px' }}>
                    {multiple && <MeltaCheckbox checked={Array.isArray(selectedValues) && selectedValues.includes(option)} />}
                    <ColoredEnumChip label={option} color={colorsOptions?.[option] || 'default'} style={{ marginLeft: '8px' }} />
                </Box>
            )}
            renderTags={(tagValue, getTagProps) => {
                const maxVisible = 1;
                const visibleTags = tagValue.slice(0, maxVisible);
                const hiddenTags = tagValue.slice(maxVisible);

                return [
                    ...visibleTags.map((option, index) => {
                        const { key, onDelete, ...restTagProps } = getTagProps({ index });
                        return (
                            <Grid alignContent="center" justifyContent="center" key={key}>
                                <ColoredEnumChip
                                    label={option}
                                    color={colorsOptions?.[option] || 'default'}
                                    onDelete={onDelete}
                                    deleteIcon={<Close />}
                                    {...restTagProps}
                                    style={{ margin: '2px 4px 2px 0' }}
                                />
                            </Grid>
                        );
                    }),
                    ...(hiddenTags.length > 0
                        ? [
                              <Grid item style={{ cursor: 'pointer' }} key="more">
                                  <MeltaTooltip
                                      title={hiddenTags.map((item) => (
                                          <Typography key={item} style={{ margin: '5px' }}>
                                              <HighlightText text={item} />
                                          </Typography>
                                      ))}
                                      arrow
                                  >
                                      <Grid
                                          container
                                          alignItems="center"
                                          justifyContent="center"
                                          sx={{ borderRadius: '30px', height: '24px', width: '24px', background: 'var(--Gray-Medium, #9398C2)' }}
                                      >
                                          <Typography color="white" fontWeight={500} fontSize="12px">
                                              +{hiddenTags.length}
                                          </Typography>
                                      </Grid>
                                  </MeltaTooltip>
                              </Grid>,
                          ]
                        : []),
                ];
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    fullWidth
                    variant="outlined"
                    error={false}
                    inputProps={{
                        ...params.inputProps,
                        startAdornment:
                            value && !Array.isArray(value) ? (
                                <ColoredEnumChip label={value} color={colorsOptions?.[value] || 'default'} />
                            ) : undefined,
                        inputProps: {
                            ...params.inputProps,
                            style: value ? { display: 'none' } : {},
                        },
                    }}
                />
            )}
        />
    );
};

export default SelectCellEditor;
