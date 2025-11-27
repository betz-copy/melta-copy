import { ScatterPlotOutlined as HiveIcon, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { Card, CardContent, CardHeader, Fab, Grid } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { IMongoStepTemplatePopulated } from '../../../../interfaces/processes/stepTemplate';
import { IUser } from '../../../../interfaces/users';
import { useDarkModeStore } from '../../../../stores/darkMode';
import { getStepInstanceByStepTemplateId } from '../../../../utils/processWizard/steps';
import { CustomIcon } from '../../../CustomIcon';
import BlueTitle from '../../../MeltaDesigns/BlueTitle';
import { IDetailsStepProp } from '.';
import { ReviewerSelector } from './ReviewerSelector';

const ReviewCard = ({ stepTemplate, values, setFieldValue, isEditMode, processInstance }) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [cardWidth, setCardWidth] = useState<number | null>(null);

    const updateCardWidth = () => {
        if (cardRef.current) {
            setCardWidth(cardRef.current.offsetWidth);
        }
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: lol
    useEffect(() => {
        updateCardWidth();
        window.addEventListener('resize', updateCardWidth);
        return () => {
            window.removeEventListener('resize', updateCardWidth);
        };
    }, []);

    return (
        <Grid size={{ xs: 10 }} marginBottom={1}>
            <Card
                ref={cardRef}
                sx={{
                    height: isEditMode || !processInstance ? '250px' : '25vh',
                    backgroundColor: darkMode ? '#3f3f3f6b' : '#f7f9fc',
                    boxShadow: 'none',
                    borderRadius: '20px',
                }}
            >
                <CardHeader
                    avatar={
                        stepTemplate.iconFileId ? (
                            <CustomIcon iconUrl={stepTemplate.iconFileId} width="30px" height="30px" color={darkMode ? '#9398c2' : '#1E2775'} />
                        ) : (
                            <HiveIcon fontSize="large" />
                        )
                    }
                    title={
                        <BlueTitle
                            component="h6"
                            variant="h4"
                            style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: cardWidth ? `${cardWidth - 75}px` : '200px',
                                fontSize: '16px',
                                fontWeight: '600',
                            }}
                            title={stepTemplate.displayName}
                        />
                    }
                />
                <CardContent onClick={(e) => e.stopPropagation()}>
                    <ReviewerSelector
                        reviewers={
                            processInstance
                                ? values.steps[getStepInstanceByStepTemplateId(stepTemplate._id, processInstance)!._id]
                                : values.steps[stepTemplate._id] || []
                        }
                        disableAddingReviewers={stepTemplate.disableAddingReviewers}
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
const StepsReviewers: React.FC<IDetailsStepProp> = ({ detailsFormikData, isEditMode, processInstance, onBack, viewMode = false }) => {
    const { values, setFieldValue, submitForm, dirty } = detailsFormikData;

    return (
        <Card sx={{ border: 'none', boxShadow: 'none', background: 'transparent', height: '100%', justifyContent: 'space-between', padding: '20px' }}>
            <Grid container flexDirection="column" height="100%" sx={{ justifyContent: 'space-between' }}>
                <Grid height="90%">
                    <CardContent
                        sx={{
                            height: '100%',
                            '&::-webkit-scrollbar': {
                                width: '5px',
                            },
                        }}
                    >
                        <Grid container rowSpacing={3} flexWrap="wrap" sx={{ overflowY: 'auto' }} height="100%">
                            {values.template?.steps.map((stepTemplate: IMongoStepTemplatePopulated) => (
                                <Grid key={stepTemplate._id} size={{ xs: 12, sm: 6, md: 4 }}>
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

                <Grid container sx={{ justifyContent: 'space-between', alignItems: 'flex-start', padding: 1 }}>
                    <Grid>
                        {!viewMode && (
                            <Fab
                                size="small"
                                onClick={onBack}
                                style={{
                                    borderRadius: '7px',
                                    padding: '10px',
                                }}
                                color="primary"
                                variant="extended"
                            >
                                <NavigateNext />
                                {i18next.t('wizard.processInstance.backTo')}
                            </Fab>
                        )}
                    </Grid>
                    {!processInstance && (
                        <Grid>
                            <Fab
                                size="small"
                                onClick={() => {
                                    submitForm();
                                }}
                                style={{
                                    borderRadius: '7px',
                                    padding: '10px',
                                }}
                                variant="extended"
                                color="primary"
                            >
                                {i18next.t('wizard.processInstance.createProcess')}
                                <NavigateBefore />
                            </Fab>
                        </Grid>
                    )}
                    {isEditMode && (
                        <Grid>
                            <Fab
                                size="small"
                                onClick={() => {
                                    submitForm();
                                }}
                                style={{
                                    borderRadius: '7px',
                                    padding: '10px',
                                }}
                                disabled={!dirty}
                                variant="extended"
                                color="primary"
                            >
                                {i18next.t('wizard.processInstance.saveBth')}
                                <NavigateBefore />
                            </Fab>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </Card>
    );
};

export default StepsReviewers;
