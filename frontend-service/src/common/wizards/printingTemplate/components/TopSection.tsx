import { FormControlLabel, Grid, TextField, Typography } from '@mui/material';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import { IPropertyValue } from '../../../../interfaces/entities';
import { IMongoPrintingTemplate } from '../../../../interfaces/printingTemplates';
import MeltaCheckbox from '../../../MeltaDesigns/MeltaCheckbox';

interface ITopSectionProps {
    values: IMongoPrintingTemplate;
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleBlur: (event: React.FocusEvent<HTMLInputElement>) => void;
    touched: FormikTouched<IMongoPrintingTemplate>;
    errors: FormikErrors<IMongoPrintingTemplate>;
    setFieldValue: (field: string, value: IPropertyValue, shouldValidate?: boolean | undefined) => void;
}

const TopSection: React.FC<ITopSectionProps> = ({ values, handleChange, handleBlur, touched, errors, setFieldValue }) => (
    <>
        <Grid sx={{ mt: 2 }} container alignContent="center" alignItems="center" justifyContent="flex-start" spacing={5}>
            <TextField
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                size="small"
                variant="outlined"
                fullWidth
                placeholder={i18next.t('wizard.printingTemplate.templateName')}
                label={i18next.t('wizard.printingTemplate.templateName')}
                error={Boolean(touched.name && errors.name)}
                helperText={errors.name}
                sx={{ width: '350px' }}
                slotProps={{ htmlInput: { style: { textAlign: 'right', fontWeight: 400, fontSize: 14 } } }}
            />
            {['appendSignatureField', 'addEntityCheckbox'].map((key) => (
                <FormControlLabel
                    control={<MeltaCheckbox checked={values[key]} onChange={(_, checked) => setFieldValue(key, checked)} />}
                    label={<Typography sx={{ fontWeight: 400, fontSize: 14 }}>{i18next.t(`wizard.printingTemplate.${key}`)}</Typography>}
                    labelPlacement="end"
                    key={key}
                />
            ))}
        </Grid>

        <Grid container justifyContent="flex-start" sx={{ my: 2 }}>
            <Typography color="#9398C2" textAlign="left" fontSize={13}>
                {i18next.t('wizard.printingTemplate.note')}
            </Typography>
        </Grid>
    </>
);

export default TopSection;
