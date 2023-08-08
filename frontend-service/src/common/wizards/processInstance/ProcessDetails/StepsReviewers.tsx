import React from 'react';
import _debounce from 'lodash.debounce';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IDetailsStepProp } from '.';
import { ReviewerSelector } from './ReviewerSelector';
import { Card, Grid, CardHeader, CardContent, Typography, Fab, Tooltip } from '@mui/material';
import { ScatterPlotOutlined as HiveIcon } from '@mui/icons-material';
import i18next from 'i18next';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { CustomIcon } from '../../../CustomIcon';
import { IUser } from '../../../../services/kartoffelService';
import { getStepInstanceByStepTemplateId } from '../../../../utils/processWizard/steps';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';

const ReviewCard = ({ stepTemplate, index, values, setFieldValue, isEditMode, processInstance }) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    return (
        <Grid item xs={10} key={index} marginBottom={1}>
            <Card sx={{ height: isEditMode || !processInstance ? '30vh' : '25vh', minHeight: '150px', backgroundColor: darkMode ? '#303030' : 'white' }}>
                <CardHeader
                    avatar={
                        stepTemplate.iconFileId ? (
                            <CustomIcon iconUrl={stepTemplate.iconFileId} width="30px" height="30px" />
                        ) : (
                            <HiveIcon fontSize="large" />
                        )
                    }
                    title={
                        <Tooltip title={stepTemplate.displayName} arrow>
                            <Typography
                                variant="h5"
                                style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '50%',
                                }}
                            >
                                {stepTemplate.displayName}
                            </Typography>
                        </Tooltip>
                    }
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
        <Card sx={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
            <CardContent
                sx={{
                    height: '56vh',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': {
                        width: '5px',
                    },
                }}
            >
                <Grid container rowSpacing={3}>
                    {values.template?.steps.map((stepTemplate: IMongoStepTemplatePopulated, index: number) => (
                        <Grid item xs={12} sm={6} md={4}>
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
            </CardContent>
            <Grid item container sx={{ justifyContent: 'space-between', alignItems: 'flex-start', padding: 1 }}>
                <Grid item>
                    <Fab onClick={onBack} color="primary" variant="extended">
                        <NavigateNextIcon />
                        {i18next.t('wizard.processInstance.backTo')}
                    </Fab>
                </Grid>
                {!Boolean(processInstance) && (
                    <Grid item>
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
                    </Grid>
                )}
            </Grid>
        </Card>
    );
};

export default StepsReviewers;
