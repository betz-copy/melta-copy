import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import FileInput from '../../../common/inputs/ImageFileInput';
import { StepComponentProps } from '../../../common/wizards/index';
import { WorkspaceWizardValues } from './index';

export const ChooseIcons: React.FC<StepComponentProps<WorkspaceWizardValues>> = ({ values, setFieldValue }) => (
    <Grid container direction="column" spacing={4} paddingBottom="3rem">
        <Grid>
            <FileInput
                onDropFile={(acceptedFile) => setFieldValue('icon', { file: acceptedFile, name: acceptedFile.name })}
                onDeleteFile={() => setFieldValue('icon', undefined)}
                file={values.icon?.file}
                inputText={i18next.t('wizard.workspace.icon')}
                acceptedFilesTypes={{ 'image/svg': ['.svg'] }}
                disableCamera
            />
        </Grid>

        <Grid>
            <FileInput
                onDropFile={(acceptedFile) => setFieldValue('logo', { file: acceptedFile, name: acceptedFile.name })}
                onDeleteFile={() => setFieldValue('logo', undefined)}
                file={values.logo?.file}
                inputText={i18next.t('wizard.workspace.logo')}
                acceptedFilesTypes={{ 'image/svg': ['.svg'] }}
                disableCamera
            />
        </Grid>
    </Grid>
);
