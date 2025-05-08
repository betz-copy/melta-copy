import { Grid } from '@mui/material';
import React from 'react';
import { Form, Formik, FormikProps } from 'formik';
import { DashboardItemHeader } from './DashboardItemHeader';
import { DashboardItemSideBar } from './DashboardItemSideBar';
import { StepComponentHelpers, StepType } from '../../../common/wizards';
import { DashboardItemData } from '../../../interfaces/dashboard';

interface DashboardItemProps {
    title: string;
    /// createOrEditMutation
    // onDelete: () => void;
    initialValues: DashboardItemData;
    edit: boolean;
    readonly: boolean;
    backPath: { path: string; title: string };
    onDelete: () => void;
    steps: StepType<DashboardItemData>[];
    bodyComponent: (formikProps: FormikProps<DashboardItemData>, helpers?: StepComponentHelpers) => JSX.Element;
}

const DashboardItem: React.FC<DashboardItemProps> = ({ title, initialValues, edit, readonly, backPath, onDelete, steps, bodyComponent }) => {
    const [activeStep, setActiveStep] = React.useState(0);

    return (
        <Formik initialValues={initialValues} onSubmit={() => console.log('Submit')} validationSchema={steps[activeStep].validationSchema}>
            {(formikProps: FormikProps<DashboardItemData>) => (
                <Form>
                    <DashboardItemHeader title={title} edit={edit} readonly={readonly} backPath={backPath} onDelete={onDelete} />
                    <Grid container height="94.7vh">
                        <Grid item flexGrow={1} overflow="auto">
                            {bodyComponent(formikProps)}
                        </Grid>

                        <Grid item width="375px" flexShrink={0}>
                            <DashboardItemSideBar activeStep={activeStep} setActiveStep={setActiveStep} steps={steps} formikProps={formikProps} />
                        </Grid>
                    </Grid>
                </Form>
            )}
        </Formik>
    );
};

export { DashboardItem };
