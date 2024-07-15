import React from 'react';
import { TextField, Grid, Checkbox, Autocomplete, Switch, FormControlLabel } from '@mui/material';
import * as Yup from 'yup';
import i18next from 'i18next';
import { StepComponentProps } from '../index';
import { IFrameWizardValues } from '.';
import { variableUrlValidation } from '../../../utils/validation';

const createIFrameDetailsSchema = {
    name: Yup.string().required(i18next.t('validation.required')),
    description: Yup.string(),
    url: Yup.string().required(i18next.t('validation.required')), // .matches(variableUrlValidation, 'URL is not valid'),
    placeInSideBar: Yup.boolean(), // .default(false),
    // categoryIds: Yup.object({
    //     _id: Yup.string().required(i18next.t('validation.required')),
    //     displayName: Yup.string().required(i18next.t('validation.required')),
    // }).required(i18next.t('validation.required')),
};

const CreateIFrameDetails: React.FC<StepComponentProps<IFrameWizardValues>> = ({ values, touched, errors, handleChange }) => {
    // const queryClient = useQueryClient();

    // const categories = queryClient.getQueryData<ICategoryMap>('getCategories');
    // const categoriesArray = Array.from(categories!.values());
    console.log({ values });

    const [isInSideBar, setIsInSideBar] = React.useState(values.placeInSideBar);
    return (
        <Grid container direction="column" alignItems="center" spacing={1}>
            <Grid item>
                <TextField
                    name="name"
                    label={i18next.t('wizard.iFrame.name')}
                    value={values.name}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid item>
                <TextField
                    name="description"
                    label={i18next.t('wizard.iFrame.description')}
                    value={values.description}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid item>
                <TextField
                    name="url"
                    label={i18next.t('wizard.iFrame.url')}
                    value={values.url}
                    onChange={handleChange}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                />
            </Grid>
            <Grid>
                {values.placeInSideBar !== undefined && (
                    <FormControlLabel
                        control={
                            <Switch
                                name="placeInSideBar"
                                onChange={(event) => {
                                    setIsInSideBar(event.target.checked);
                                    console.log(event.target.value);

                                    handleChange({ ...values, placeInSideBar: isInSideBar });
                                }}
                                checked={isInSideBar}
                                value={values.placeInSideBar}
                            />
                        }
                        label={i18next.t('wizard.iFrame.placeInSideBar')}
                    />
                )}
            </Grid>
            {/* <Grid item>
                <Checkbox
                    checked={values.placeInSideBar}
                    name="placeInSideBar"
                    value={values.placeInSideBar}
                    // label={i18next.t('wizard.iFrame.placeInSideBar')}
                    onChange={handleChange}
                    // error={touched.name && Boolean(errors.name)}
                    // helperText={touched.name && errors.name}
                />
                {/* <MeltaCheckbox checked={values.placeInSideBar ?? false} onChange={handleChange} />
            </Grid> */}

            {/* <Grid item>
                <Autocomplete
                    id="placeInSideBar"
                    options={['כן', 'לא']}
                    onChange={handleChange}
                    // onChange={(_e, value) => setFieldValue('categoryIds', value || '')}
                    // value={values.sourceEntity._id ? values.sourceEntity : null}
                    // value={values.._id ? values.sourceEntity : null}
                    getOptionLabel={(option) => option}
                    // disabled={areThereRelationshipInstancesByTemplateId! > 0}
                    renderInput={(params) => (
                        <TextField
                            style={{ width: '220px' }}
                            {...params}
                            error={Boolean(touched.placeInSideBar && errors.placeInSideBar)}
                            fullWidth
                            helperText={touched.placeInSideBar && errors.placeInSideBar}
                            name="placeInSideBar"
                            variant="outlined"
                            label={i18next.t('wizard.iFrame.placeInSideBar')}
                        />
                    )}
                />
            </Grid> */}

            {/* <Grid item>
                <Switch
                    name="placeInSideBar"
                    id="placeInSideBar"
                    value={values.placeInSideBar}
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    checked={values.placeInSideBar}
                    onChange={() => handleChange(!values.placeInSideBar ?? false)}
                    color="primary"
                    inputProps={{ 'aria-label': 'primary checkbox' }}
                />
            </Grid> */}
        </Grid>
    );
};

export { CreateIFrameDetails, createIFrameDetailsSchema };
