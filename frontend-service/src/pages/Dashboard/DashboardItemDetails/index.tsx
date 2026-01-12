import { Grid } from '@mui/material';
import { DashboardItemType, MongoDashboardItem } from '@packages/dashboard';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import React, { JSX } from 'react';
import { isSchema, Schema } from 'yup';
import { StepComponentHelpers } from '../../../common/wizards';
import { DashboardItemForm, TabStepComponent, ViewMode } from '../../../interfaces/dashboard';
import DashboardItemDetailsHeader from './DashboardItemDetailsHeader';
import DashboardItemDetailsSideBar from './DashboardItemDetailsSideBar';

interface DashboardItemDetailsProps<T extends DashboardItemForm> {
    initialValues: T;
    submitFunction: (values: T) => Promise<MongoDashboardItem | IMongoChart> | Promise<IMongoIFrame>;
    onReset?: (values: T, formikHelpers: FormikHelpers<T>) => void;
    steps: TabStepComponent<T>[];
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

const DashboardItemDetails = <T extends DashboardItemForm>({
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
}: DashboardItemDetailsProps<T>) => {
    const [activeStep, setActiveStep] = React.useState(0);

    return (
        <Formik
            initialValues={initialValues}
            onSubmit={async (values) => await submitFunction(values)}
            validationSchema={steps[activeStep].validationSchema}
            enableReinitialize
            onReset={(values, formikHelpers) => onReset?.(values, formikHelpers)}
            validateOnMount
        >
            {(formikProps: FormikProps<T>) => {
                const isValidForm = steps.every((step) =>
                    step.validationSchema && isSchema(step.validationSchema)
                        ? (step.validationSchema as Schema).isValidSync(formikProps.values, { abortEarly: false })
                        : true,
                );

                return (
                    <Form>
                        <DashboardItemDetailsHeader
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
                            <Grid flexGrow={1} overflow="auto">
                                {bodyComponent(formikProps)}
                            </Grid>

                            <Grid width="375px" flexShrink={0}>
                                <DashboardItemDetailsSideBar
                                    activeStep={activeStep}
                                    setActiveStep={setActiveStep}
                                    steps={steps}
                                    formikProps={formikProps}
                                    viewMode={viewMode}
                                    type={type}
                                />
                            </Grid>
                        </Grid>
                    </Form>
                );
            }}
        </Formik>
    );
};

export default DashboardItemDetails;
