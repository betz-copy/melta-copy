import React, { useEffect, useRef, useState } from 'react';
import _debounce from 'lodash.debounce';
import { Card, Grid, CardHeader, CardContent, Typography, Fab } from '@mui/material';
import { ScatterPlotOutlined as HiveIcon } from '@mui/icons-material';
import i18next from 'i18next';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IDetailsStepProp } from '.';
import { ReviewerSelector } from './ReviewerSelector';
import { CustomIcon } from '../../../CustomIcon';
import { getStepInstanceByStepTemplateId } from '../../../../utils/processWizard/steps';
import { MeltaTooltip } from '../../../MeltaTooltip';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { IUser } from '../../../../interfaces/users';

const ReviewCard = ({ stepTemplate, values, setFieldValue, isEditMode, processInstance }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [cardWidth, setCardWidth] = useState<number | null>(null);

    const updateCardWidth = () => {
        if (cardRef.current) {
            setCardWidth(cardRef.current.offsetWidth);
        }
    };

    useEffect(() => {
        updateCardWidth();
        window.addEventListener('resize', updateCardWidth);
        return () => {
            window.removeEventListener('resize', updateCardWidth);
        };
    }, []);
    return (
        <Grid item xs={10} marginBottom={1}>
            <Card
                ref={cardRef}
                sx={{
                    height: isEditMode || !processInstance ? '250px' : '25vh',
                    // minHeight: '150px',
                    backgroundColor: darkMode ? '#303030' : '#f7f9fc',
                    boxShadow: 'none',
                    borderRadius: '20px',
                }}
            >
                <CardHeader
                    avatar={
                        stepTemplate.iconFileId ? (
                            <CustomIcon iconUrl={stepTemplate.iconFileId} width="30px" height="30px" color="#1E2775" />
                        ) : (
                            <HiveIcon fontSize="large" />
                        )
                    }
                    title={
                        <MeltaTooltip title={stepTemplate.displayName} arrow>
                            <Typography
                                style={{
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: cardWidth ? `${cardWidth - 75}px` : '200px',
                                    fontSize: '16px',
                                    color: '#1E2775',
                                    fontWeight: '600',
                                }}
                            >
                                {stepTemplate.displayName}
                            </Typography>
                        </MeltaTooltip>
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
                                const newReviewers = reviewers.filter((reviewer: IUser) => reviewer._id !== removedReviewer._id);
                                const newStepsValue = { ...values.steps, [stepInstance._id]: newReviewers };
                                setFieldValue('steps', newStepsValue);
                            } else {
                                const newReviewers = reviewers.filter((reviewer: IUser) => reviewer._id !== removedReviewer._id);
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
        <Card sx={{ border: 'none', boxShadow: 'none', background: 'transparent', height: '100%', justifyContent: 'space-between', padding: '20px' }}>
            <Grid container item flexDirection="column" height="100%" sx={{ justifyContent: 'space-between' }}>
                <Grid item height="90%">
                    <CardContent
                        sx={{
                            // height: '56vh',
                            // overflowY: 'auto',
                            height: '100%',
                            '&::-webkit-scrollbar': {
                                width: '5px',
                            },
                        }}
                    >
                        <Grid container rowSpacing={3} flexWrap="wrap" sx={{ overflowY: 'auto' }} height="100%">
                            {values.template?.steps.map((stepTemplate: IMongoStepTemplatePopulated) => (
                                <Grid item key={stepTemplate._id} xs={12} sm={6} md={4}>
                                    <ReviewCard
                                        stepTemplate={stepTemplate}
                                        values={values}
                                        setFieldValue={setFieldValue}
                                        isEditMode={isEditMode}
                                        processInstance={processInstance}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Grid>

                <Grid item container sx={{ justifyContent: 'space-between', alignItems: 'flex-start', padding: 1 }}>
                    <Grid item>
                        <Fab size="small" onClick={onBack} color="primary" variant="extended">
                            <NavigateNextIcon />
                            {i18next.t('wizard.processInstance.backTo')}
                        </Fab>
                    </Grid>
                    {!processInstance && (
                        <Grid item>
                            <Fab
                                size="small"
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
            </Grid>
        </Card>
    );
};

export default StepsReviewers;
