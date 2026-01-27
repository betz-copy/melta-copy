import { FormControlLabel, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import MeltaSwitch from '../../MeltaDesigns/MeltaSwitch';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { PrintItem, PrintType } from '../PrintOptionsDialog';

const OptionsSection: React.FC<{ printItem: PrintItem }> = ({ printItem }) => {
    const { options, type, template } = printItem;

    return Object.entries(options).map(([key, value]) => {
        const isDisabled = key === 'previewPropertiesOnly' && type === PrintType.Entity && template.propertiesPreview.length === 0;

        const label = (
            <FormControlLabel
                control={<MeltaSwitch id={key} name={key} checked={value.show} onChange={() => value.set((cur) => !cur)} />}
                label={<Typography sx={{ fontSize: '14px', color: '#53566E' }}>{i18next.t(value.label)}</Typography>}
                disabled={isDisabled}
                key={value.label}
            />
        );
        return (
            value && (
                <Grid key={key}>
                    {isDisabled ? <MeltaTooltip title={i18next.t('entityPage.print.noPreviewProperties')}>{label}</MeltaTooltip> : label}
                </Grid>
            )
        );
    });
};

export default OptionsSection;
