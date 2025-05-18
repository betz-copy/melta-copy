import { Grid } from '@mui/material';
import React from 'react';
import { Form, Formik, FormikProps } from 'formik';
import { DashboardItemHeader } from './DashboardItemHeader';
import { DashboardItemSideBar } from './DashboardItemSideBar';
import { StepComponentHelpers, StepType } from '../../../common/wizards';
import { DashboardItemData, ViewMode } from '../../../interfaces/dashboard';

// interface DashboardItemProps {
//     title: string;
//     /// createOrEditMutation
//     // onDelete: () => void;
//     initialValues: DashboardItemData;
//     backPath: { path: string; title: string };
//     onDelete: () => void;
//     steps: StepType<DashboardItemData>[];
//     bodyComponent: (formikProps: FormikProps<DashboardItemData>, helpers?: StepComponentHelpers) => JSX.Element;
//     isLoading: boolean;
//     submitFunction: (values: DashboardItemData) => Promise<any>;
//     viewMode: ViewMode;
//     setViewMode: React.Dispatch<React.SetStateAction<ViewMode>>;
// }

interface DashboardItemProps<T extends DashboardItemData> {
    initialValues: T;
    submitFunction: (values: T) => Promise<any>;
    steps: StepType<T>[];
    viewMode: {
        value: ViewMode;
        set: React.Dispatch<React.SetStateAction<ViewMode>>;
    };
    title: string;
    isLoading: boolean;
    backPath: { path: string; title: string };
    onDelete: () => void;
    bodyComponent: (formikProps: FormikProps<T>, helpers?: StepComponentHelpers) => JSX.Element;
}

const DashboardItem = <T extends DashboardItemData>({
    title,
    initialValues,
    backPath,
    onDelete,
    steps,
    bodyComponent,
    isLoading,
    submitFunction,
    viewMode,
}: DashboardItemProps<T>) => {
    const [activeStep, setActiveStep] = React.useState(0);

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={async (values) => {
                await submitFunction(values);
            }}
            validationSchema={steps[activeStep].validationSchema}
        >
            {(formikProps: FormikProps<T>) => (
                <Form>
                    <DashboardItemHeader title={title} backPath={backPath} onDelete={onDelete} isLoading={isLoading} viewMode={viewMode} />

                    <Grid container height="94.7vh" wrap="nowrap">
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
