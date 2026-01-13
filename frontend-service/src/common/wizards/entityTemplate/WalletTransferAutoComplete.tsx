import { InfoOutlined } from '@mui/icons-material';
import { Autocomplete, Box, TextField } from '@mui/material';
import { FormikErrors, FormikTouched, getIn } from 'formik';
import MeltaTooltip, { TooltipVariant } from '../../MeltaDesigns/MeltaTooltip';
import { EntityTemplateWizardValues } from '.';

interface WalletAutocompleteProps<T> {
    label: string;
    options: T[];
    value: T | null;
    disabled?: boolean;
    touched: FormikTouched<EntityTemplateWizardValues>;
    errors: FormikErrors<EntityTemplateWizardValues>;
    fieldPath: string;
    onChange: (value: T | null) => void;
    darkMode: boolean;
    infoTooltip?: string;
}

export function WalletTransferAutocomplete<T extends { title: string }>({
    label,
    options,
    value,
    disabled,
    touched,
    errors,
    fieldPath,
    onChange,
    darkMode,
    infoTooltip,
}: WalletAutocompleteProps<T>) {
    return (
        <>
            <Autocomplete
                options={options}
                value={value}
                onChange={(_e, val) => onChange(val)}
                getOptionLabel={(option) => option.title}
                disabled={disabled}
                sx={{
                    width: 250,
                    ...(!darkMode && {
                        '& .MuiInputBase-root.Mui-disabled': {
                            backgroundColor: '#F3F5F9',
                        },
                        '& .MuiInputLabel-root.Mui-disabled': {
                            color: '#BBBED8',
                        },
                    }),
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        label={label}
                        error={Boolean(getIn(touched, fieldPath) && getIn(errors, fieldPath))}
                        helperText={getIn(touched, fieldPath) ? getIn(errors, fieldPath) : ''}
                    />
                )}
            />
            {infoTooltip && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MeltaTooltip title={infoTooltip} variant={TooltipVariant.Bubble}>
                        <InfoOutlined sx={{ fontSize: 16, opacity: 0.7, ml: 1, color: '#9398C2' }} />
                    </MeltaTooltip>
                </Box>
            )}
        </>
    );
}
