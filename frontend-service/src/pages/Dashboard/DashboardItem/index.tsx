import { Grid } from '@mui/material';
import React from 'react';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import { DashboardItemHeader } from './DashboardItemHeader';
import { DashboardItemSideBar } from './DashboardItemSideBar';
import { StepComponentHelpers, StepType } from '../../../common/wizards';
import { DashboardItemData, DashboardItemType, ViewMode } from '../../../interfaces/dashboard';

interface DashboardItemProps<T extends DashboardItemData> {
    initialValues: T;
    submitFunction: (values: T) => Promise<T>;
    onReset?: (values: T, formikHelpers: FormikHelpers<T>) => void;
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
    type: DashboardItemType;
    chartPageProps?: {
        isChartPage: boolean;
        usedInDashboard?: boolean;
    };
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
    onReset,
    viewMode,
    type,
    chartPageProps,
}: DashboardItemProps<T>) => {
    const [activeStep, setActiveStep] = React.useState(0);

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={async (values) => {
                await submitFunction(values);
            }}
            validationSchema={steps[activeStep].validationSchema}
            enableReinitialize
            onReset={(values, formikHelpers) => {
                onReset?.(values, formikHelpers);
            }}
            validateOnMount
        >
            {(formikProps: FormikProps<T>) => {
                const isValidForm = steps.every((step) =>
                    step.validationSchema ? step.validationSchema.isValidSync(formikProps.values, { abortEarly: false }) : true,
                );

                return (
                    <Form>
                        <DashboardItemHeader
                            title={title}
                            backPath={backPath}
                            onDelete={onDelete}
                            isLoading={isLoading}
                            viewMode={viewMode}
                            type={type}
                            chartPageProps={chartPageProps}
                            isValidForm={isValidForm}
                            formikProps={formikProps}
                        />

                        <Grid container height="94.7vh" wrap="nowrap">
                            <Grid item flexGrow={1} overflow="auto">
                                {bodyComponent(formikProps)}
                            </Grid>

                            <Grid item width="375px" flexShrink={0}>
                                <DashboardItemSideBar activeStep={activeStep} setActiveStep={setActiveStep} steps={steps} formikProps={formikProps} />
                            </Grid>
                        </Grid>
                    </Form>
                );
            }}
        </Formik>
    );
};

export { DashboardItem };
