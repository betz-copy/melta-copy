import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Grid, Tab, useTheme } from '@mui/material';
import { FormikProps } from 'formik';
import React from 'react';
import { StepType } from '../../../common/wizards';
import { DashboardItemData } from '../../../interfaces/dashboard';

interface DashboardItemSideBarProps<T extends DashboardItemData> {
    activeStep: number;
    setActiveStep: React.Dispatch<React.SetStateAction<number>>;
    steps: StepType<T>[];
    formikProps: FormikProps<T>;
}

const DashboardItemSideBar = <T extends DashboardItemData>({
    activeStep,
    setActiveStep,
    steps,
    formikProps,
}: DashboardItemSideBarProps<T>): React.ReactElement => {
    const theme = useTheme();

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        // to do: add validation
        setActiveStep(Number(newValue));
    };

    return (
        <TabContext value={activeStep.toString()}>
            <Grid
                item
                sx={{
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: '2px 2px 10.15px 0px #1E277533',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                }}
            >
                <Grid item sx={{ marginTop: '5px', justifyContent: 'space-between', width: '92%' }}>
                    <TabList onChange={handleTabChange} variant="standard" sx={{ borderBottom: '1px solid #E0E0E0' }}>
                        {steps.map(({ label }, index) => (
                            <Tab
                                key={label}
                                iconPosition="start"
                                label={<Box sx={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{label}</Box>}
                                value={index.toString()}
                                wrapped
                                sx={{
                                    color: activeStep === index ? theme.palette.primary.main : '#787C9E',
                                    fontWeight: activeStep === index ? '600' : '400',
                                    minHeight: '44px',
                                    fontSize: '14px',
                                    width: '50%',
                                }}
                            />
                        ))}
                    </TabList>
                </Grid>

                <Grid item sx={{ width: '100%', padding: '30px' }}>
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

export { DashboardItemSideBar };
