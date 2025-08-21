import { Box, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import * as Yup from 'yup';
import { variableNameValidation } from '../../../utils/validation';
import { StepComponentProps } from '../index';
import { ChooseCategory } from './ChooseCategory';
import MeltaCheckbox from '../../MeltaDesigns/MeltaCheckbox';
import { CreateTemplateName } from './CreateTemplateName';
import { InfoOutlined } from '@mui/icons-material';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';

export const useCreateOrEditTemplateNameSchema = (templates: Map<any, any>, currentTemplateId?: string) => {
    const otherTemplates = Array.from(templates.values()).filter((template) => template._id !== currentTemplateId);

    const existingTemplateNames = otherTemplates.map((template) => template.name);
    const existingTemplateDisplayNames = otherTemplates.map((template) => template.displayName);

    return Yup.object({
        name: Yup.string()
            .matches(variableNameValidation, i18next.t('validation.variableName'))
            .required(i18next.t('validation.required'))
            .test('unique-name', i18next.t('validation.existingName'), (value) => {
                return !existingTemplateNames.includes(value || '');
            }),
        displayName: Yup.string()
            .required(i18next.t('validation.required'))
            .test('unique-displayName', i18next.t('validation.existingDisplayName'), (value) => {
                return !existingTemplateDisplayNames.includes(value || '');
            }),
    });
};

const CreateTemplateSettings = <Values extends { name: string; displayName: string }>(
    props: React.PropsWithChildren<StepComponentProps<Values, 'isEditMode'>> & {
        exportFormats: { value: boolean; set: (val: boolean) => void };
        showAccountDisplay: { value: boolean; set: (val: boolean) => void };
    },
) => {
    return (
        <Grid container direction="column" alignItems="center" spacing={4}>
            <Grid item container direction="row" alignItems="center">
                <ChooseCategory {...props} />
            </Grid>
            <CreateTemplateName {...props} gridProps={{ direction: 'row', alignItems: 'center', spacing: 2 }} />
            <Grid item container direction="column" alignItems="flex-start" spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center' }} marginBottom={2}>
                    <MeltaCheckbox
                        checked={props.showAccountDisplay.value}
                        onChange={(e) => {
                            props.showAccountDisplay.set(e.target.checked);
                        }}
                    />
                    <Typography>{i18next.t('wizard.entityTemplate.currentAccountDisplay')}</Typography>
                    <MeltaTooltip title="fdgdg">
                        <InfoOutlined
                            sx={{
                                fontSize: 16,
                                opacity: 0.7,
                                cursor: 'help',
                                ml: 1,
                            }}
                        />
                    </MeltaTooltip>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MeltaCheckbox
                        checked={props.exportFormats.value}
                        onChange={(e) => {
                            props.exportFormats.set(e.target.checked);
                        }}
                    />
                    <Typography>{i18next.t('wizard.entityTemplate.exportDocumentsSelect')}</Typography>
                    <MeltaTooltip title="fdgdg">
                        <InfoOutlined
                            sx={{
                                fontSize: 16,
                                opacity: 0.7,
                                cursor: 'help',
                                ml: 1,
                            }}
                        />
                    </MeltaTooltip>
                </Box>
            </Grid>
        </Grid>
    );
};

export { CreateTemplateSettings };
