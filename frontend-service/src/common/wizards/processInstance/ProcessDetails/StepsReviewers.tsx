import React from 'react';
import _debounce from 'lodash.debounce';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IDetailsStepProp } from '.';
import { ReviewerSelector } from './ReviewerSelector';
import { Card, Grid, CardHeader, CardContent, Typography, Box, Fab } from '@mui/material';
import { ScatterPlotOutlined as HiveIcon } from '@mui/icons-material';
import { CustomIcon } from '../../../CustomIcon';
import { IUser } from '../../../../services/kartoffelService';
import i18next from 'i18next';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { getStepInstanceByStepTemplateId } from '../../../../utils/processWizard/steps';

const ReviewCard = ({ stepTemplate, index, values, setFieldValue, isEditMode, processInstance }) => {
    return (
        <Grid item xs={2} sm={2} md={3} key={index} minWidth={'300px'}>
            <Card sx={{ height: '250px' }}>
                <CardHeader
                    avatar={
                        stepTemplate.iconFileId ? (
                            <CustomIcon iconUrl={stepTemplate.iconFileId} width="30px" height="30px" />
                        ) : (
                            <HiveIcon fontSize="large" />
                        )
                    }
                    title={<Typography variant="h5">{stepTemplate.displayName}</Typography>}
                    // action={<IconButton>{processInstance && !isEditMode ? <PeopleAltIcon /> : <PersonAddIcon />}</IconButton>}
                />
                <CardContent onClick={(e) => e.stopPropagation()}>
                    <ReviewerSelector
                        reviewers={
                            processInstance
                                ? values.steps[getStepInstanceByStepTemplateId(stepTemplate._id, processInstance)!._id]
                                : values.steps[stepTemplate._id]
                        }
                        forcedReviewers={stepTemplate.reviewers}
                        onAdd={(newReviewer, reviewers) => {
                            if (isEditMode && processInstance) {
                                const stepInstance = getStepInstanceByStepTemplateId(stepTemplate._id, processInstance)!;
                                const newStepsValue = { ...values.steps, [stepInstance._id]: [...reviewers, newReviewer] };
                                setFieldValue('steps', newStepsValue);
                            } else {
                                const newStepsValue = { ...values.steps, [stepTemplate._id]: [...reviewers, newReviewer] };
                                setFieldValue('steps', newStepsValue);
                            }
                        }}
                        onRemove={(removedReviewer, reviewers) => {
                            if (isEditMode && processInstance) {
                                const stepInstance = getStepInstanceByStepTemplateId(stepTemplate._id, processInstance)!;
                                const newReviewers = reviewers.filter((reviewer: IUser) => reviewer.id !== removedReviewer.id);
                                const newStepsValue = { ...values.steps, [stepInstance._id]: newReviewers };
                                setFieldValue('steps', newStepsValue);
                            } else {
                                const newReviewers = reviewers.filter((reviewer: IUser) => reviewer.id !== removedReviewer.id);
                                const newStepsValue = { ...values.steps, [stepTemplate._id]: newReviewers };
                                setFieldValue('steps', newStepsValue);
                            }
                        }}
                        isViewMode={processInstance && !isEditMode}
                    />
                </CardContent>
            </Card>
        </Grid>
    );
};
const StepsReviewers: React.FC<IDetailsStepProp> = ({ detailsFormikData, isEditMode, processInstance, onBack }) => {
    const { values, setFieldValue, submitForm } = detailsFormikData;

    return (
        <Grid container height={'60vh'} direction={'column'} spacing={1} paddingLeft={4} justifyContent={'space-between'}>
            <Grid item>
                <Grid container rowSpacing={3}>
                    {values.template?.steps.map((stepTemplate: IMongoStepTemplatePopulated, index: number) => (
                        <Grid item xs={4}>
                            <ReviewCard
                                key={index}
                                stepTemplate={stepTemplate}
                                index={index}
                                values={values}
                                setFieldValue={setFieldValue}
                                isEditMode={isEditMode}
                                processInstance={processInstance}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Grid>
            <Grid item>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                    <Box>
                        <Fab onClick={onBack} color="primary" variant="extended">
                            <NavigateNextIcon />
                            {i18next.t('wizard.processInstance.backTo')}
                        </Fab>
                    </Box>
                    {!Boolean(processInstance) && (
                        <Box>
                            <Fab
                                onClick={() => {
                                    submitForm();
                                }}
                                variant="extended"
                                color="primary"
                            >
                                {i18next.t('wizard.processInstance.createProcess')}
                                <NavigateBeforeIcon />
                            </Fab>
                        </Box>
                    )}
                </Box>
            </Grid>
        </Grid>
    );
};

export default StepsReviewers;
