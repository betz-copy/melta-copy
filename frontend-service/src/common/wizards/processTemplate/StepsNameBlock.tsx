import { Grid, TextField } from '@mui/material';
import { FormikErrors } from 'formik';
import i18next from 'i18next';
import { debounce } from 'lodash';
import React, { useCallback, useState } from 'react';
import { ProcessTemplateWizardValues } from './index';
import { StepsGenericBlockProps } from './StepsBlocksInterface';

const StepsNameBlock: React.FC<StepsGenericBlockProps> = ({
    values,
    touched,
    errors,
    propIndex,
    setFieldValue,
    isEditMode,
    areThereAnyInstances,
}) => {
    const errorsOfStep = errors.steps?.[propIndex] as FormikErrors<ProcessTemplateWizardValues['steps'][number]> | undefined;
    const touchedOfStep = touched?.steps?.[propIndex];

    const [name, setName] = useState(values.steps[propIndex].name);
    const [displayName, setDisplayName] = useState(values.steps[propIndex].displayName);

    const setNameFieldDebounced = useCallback(
        debounce((newName: string) => {
            setFieldValue(`steps[${propIndex}].name`, newName);
        }, 1000),
        [],
    );
    const setDisplayNameFieldDebounced = useCallback(
        debounce((newDisplayName: string) => {
            setFieldValue(`steps[${propIndex}].displayName`, newDisplayName);
        }, 1000),
        [],
    );

    return (
        <Grid container direction="row" alignItems="center" spacing={1} style={{ justifyContent: 'center', marginBottom: '3%' }}>
            <Grid>
                <TextField
                    label={i18next.t('wizard.name')}
                    disabled={isEditMode && areThereAnyInstances}
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                        setNameFieldDebounced(event.target.value);
                    }}
                    error={touchedOfStep?.name && Boolean(errorsOfStep?.name)}
                    helperText={touchedOfStep?.name && errorsOfStep?.name}
                />
            </Grid>
            <Grid>
                <TextField
                    label={i18next.t('wizard.displayName')}
                    value={displayName}
                    onChange={(event) => {
                        setDisplayName(event.target.value);
                        setDisplayNameFieldDebounced(event.target.value);
                    }}
                    error={touchedOfStep?.displayName && Boolean(errorsOfStep?.displayName)}
                    helperText={touchedOfStep?.displayName && errorsOfStep?.displayName}
                />
            </Grid>
        </Grid>
    );
};

export { StepsNameBlock };
