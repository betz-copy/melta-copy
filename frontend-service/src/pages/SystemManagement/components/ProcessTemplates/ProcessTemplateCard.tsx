import { IMongoProcessTemplateReviewerPopulated, IMongoStepTemplatePopulated } from '@microservices/shared';
import { ScatterPlotOutlined as HiveIcon } from '@mui/icons-material';
import { Divider, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { CustomIcon } from '../../../../common/CustomIcon';
import MeltaTooltip from '../../../../common/MeltaDesigns/MeltaTooltip';
import { useWorkspaceStore } from '../../../../stores/workspace';
import { ViewingCard } from '../Card';
import { CardMenu } from '../CardMenu';
import { ProcessProperties } from './ProcessProperties';
import { ProcessStep } from './ProcessStep';

const defaultProcessTemplate: IMongoProcessTemplateReviewerPopulated = {
    _id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    details: {
        properties: {
            properties: {},
            required: [],
            type: 'object',
        },
        propertiesOrder: [],
    },
    displayName: '',
    name: '',
    steps: [],
};

const defaultStepTemplate: IMongoStepTemplatePopulated = {
    _id: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    displayName: '',
    iconFileId: '',
    name: '',
    properties: {
        properties: {},
        required: [],
        type: 'object',
    },
    propertiesOrder: [],
    reviewers: [],
};

interface ProcessTemplateCardProps {
    processTemplate: IMongoProcessTemplateReviewerPopulated;
    setProcessTemplateWizardDialogState: (
        value: React.SetStateAction<{
            isWizardOpen: boolean;
            processTemplate: IMongoProcessTemplateReviewerPopulated | null;
        }>,
    ) => void;
    setDeleteProcessTemplateDialogState: (
        value: React.SetStateAction<{
            isDialogOpen: boolean;
            processTemplateId: string | null;
        }>,
    ) => void;
    setDuplicateProcessTemplateDialogState: (
        value: React.SetStateAction<{
            isWizardOpen: boolean;
            processTemplate: IMongoProcessTemplateReviewerPopulated | null;
        }>,
    ) => void;
}

export const ProcessTemplateCard: React.FC<ProcessTemplateCardProps> = ({
    processTemplate,
    setProcessTemplateWizardDialogState,
    setDeleteProcessTemplateDialogState,
    setDuplicateProcessTemplateDialogState,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const theme = useTheme();
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);

    return (
        <ViewingCard
            width={400}
            title={
                <Grid direction="column" container gap="10px">
                    <Grid
                        container
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        paddingLeft="20px"
                        flexWrap="nowrap"
                        height="20px"
                    >
                        <Grid container alignItems="center" gap="10px" flexBasis="90%">
                            <MeltaTooltip title={processTemplate.displayName}>
                                <Typography
                                    style={{
                                        fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                        color: theme.palette.primary.main,
                                        fontWeight: '400',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        maxWidth: '250px',
                                    }}
                                >
                                    {processTemplate.displayName}
                                </Typography>
                            </MeltaTooltip>
                        </Grid>
                        <Grid container flexBasis="10%">
                            {isHoverOnCard && (
                                <CardMenu
                                    onOptionsIconClose={() => setIsHoverOnCard(false)}
                                    onEditClick={() => {
                                        setProcessTemplateWizardDialogState({ isWizardOpen: true, processTemplate });
                                    }}
                                    onDeleteClick={() => {
                                        setDeleteProcessTemplateDialogState({ isDialogOpen: true, processTemplateId: processTemplate._id });
                                    }}
                                    onDuplicateClick={() => {
                                        setDuplicateProcessTemplateDialogState({
                                            isWizardOpen: true,
                                            processTemplate: {
                                                ...defaultProcessTemplate,
                                                details: processTemplate.details,
                                                steps: processTemplate.steps.map((step) => ({
                                                    ...defaultStepTemplate,
                                                    displayName: step.displayName,
                                                    name: step.name,
                                                    properties: step.properties,
                                                    propertiesOrder: step.propertiesOrder,
                                                    reviewers: step.reviewers,
                                                    disableAddingReviewers: step.disableAddingReviewers,
                                                })),
                                            },
                                        });
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                    <Grid container flexDirection="row" gap="20px">
                        {processTemplate.steps.map((step) => (
                            <Grid key={step._id} container alignItems="center" gap="10px" width="fit-content">
                                {step.iconFileId ? (
                                    <CustomIcon iconUrl={step.iconFileId} height="24px" width="24px" color={theme.palette.primary.main} />
                                ) : (
                                    <HiveIcon sx={{ color: theme.palette.primary.main }} height="24px" width="24px" />
                                )}
                                <MeltaTooltip title={step.displayName}>
                                    <Typography
                                        style={{
                                            fontSize: '12px',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            width: '75px',
                                        }}
                                    >
                                        {step.displayName}
                                    </Typography>
                                </MeltaTooltip>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container direction="column">
                    <Divider style={{ width: '100%' }} />
                    <ProcessProperties properties={processTemplate.details.properties.properties} />
                    <Typography>{i18next.t('wizard.processTemplate.levels')}</Typography>
                    {processTemplate.steps.map((step) => {
                        return <ProcessStep key={step._id} step={step} />;
                    })}
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
        />
    );
};
