import { DashboardItemType } from '@microservices/shared';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab, useTheme } from '@mui/material';
import { FormikProps } from 'formik';
import React from 'react';
import { ChartForm, DashboardItemForm, TabStepComponent, ViewMode } from '../../../interfaces/dashboard';
import { markTouched } from '../../../utils/charts/markTouchedRecursive';

interface DashboardItemDetailsSideBarProps<T extends DashboardItemForm> {
    activeStep: number;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    steps: TabStepComponent<T>[];
    formikProps: FormikProps<T>;
    viewMode: {
        value: ViewMode;
        set: React.Dispatch<React.SetStateAction<ViewMode>>;
    };
    type: DashboardItemType;
}

const DashboardItemDetailsSideBar = <T extends DashboardItemForm>({
    activeStep,
    setActiveStep,
    steps,
    formikProps,
    viewMode,
    type,
}: DashboardItemDetailsSideBarProps<T>): React.ReactElement => {
    const theme = useTheme();
    const isDisabled =
        viewMode.value === ViewMode.Add && type === DashboardItemType.Chart && (formikProps.values as ChartForm & { _id?: string })._id;

    const handleTabChange = async (_event: React.SyntheticEvent, newValue: number) => {
        const allTouched = markTouched(formikProps.values);
        await formikProps.setTouched(allTouched);

        const errors = await formikProps.validateForm();

        if (!isDisabled && Object.keys(errors).length === 0) setActiveStep(newValue);
    };

    return (
        <TabContext value={activeStep.toString()}>
            <Grid
                sx={{
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: '2px 2px 10.15px 0px #1E277533',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <Grid sx={{ marginTop: '5px', justifyContent: 'space-between', width: '92%' }}>
                    <TabList onChange={handleTabChange} variant="standard" sx={{ borderBottom: '1px solid #E0E0E0' }}>
                        {steps.map(({ label }, index) => (
                            <Tab
                                key={label}
                                iconPosition="start"
                                label={<Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{label}</Box>}
                                value={index.toString()}
                                wrapped
                                sx={{
                                    color: activeStep === index ? theme.palette.primary.main : isDisabled ? ' #9B9DB6' : '#787C9E',
                                    fontWeight: activeStep === index ? '600' : '400',
                                    minHeight: '44px',
                                    fontSize: '14px',
                                    width: '50%',
                                }}
                            />
                        ))}
                    </TabList>
                </Grid>

                <Grid sx={{ width: '100%', padding: '30px' }}>
                    {steps.map(({ label }, index) => (
                        <TabPanel key={label} value={index.toString()} sx={{ padding: 0 }}>
                            {steps[index].component(formikProps)}
                        </TabPanel>
                    ))}
                </Grid>
            </Grid>
        </TabContext>
    );
};

export default DashboardItemDetailsSideBar;
