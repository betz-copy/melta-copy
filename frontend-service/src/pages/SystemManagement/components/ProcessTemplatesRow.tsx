import React, { useState } from 'react';
import { Button, Divider, Grid, IconButton, Tooltip, Typography, tooltipClasses, useTheme } from '@mui/material';
import { AddCircle as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import i18next from 'i18next';
import { AxiosError } from 'axios';
import { ProcessTemplateWizard } from '../../../common/wizards/processTemplate';
import { deleteProcessTemplateRequest, processTemplateObjectToProcessTemplateForm } from '../../../services/templates/processTemplatesService';
import { AreYouSureDialog } from '../../../common/dialogs/AreYouSureDialog';
import { ErrorToast } from '../../../common/ErrorToast';
import { ViewingCard } from './Card';
import SearchInput from '../../../common/inputs/SearchInput';
import { IMongoProcessTemplatePopulated, IProcessSingleProperty, IProcessTemplateMap } from '../../../interfaces/processes/processTemplate';
import { CardMenu } from './CardMenu';
import { CustomIcon } from '../../../common/CustomIcon';
import { IUser } from '../../../services/kartoffelService';
import { IMongoStepTemplatePopulated } from '../../../interfaces/processes/stepTemplate';
import { mainFontSizes } from '../../../theme';
import { MeltaTooltip } from '../../../common/MeltaTooltip';

interface StepReviewersProps {
    reviewers: IUser[];
}

const StepReviewers: React.FC<StepReviewersProps> = ({ reviewers }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid container>
            <Grid item>
                <Button
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? (
                        <img style={{ marginLeft: '10px' }} src="/icons/Close-Arrow.svg" />
                    ) : (
                        <img style={{ marginLeft: '10px' }} src="/icons/Open-Arrow.svg" />
                    )}
                    <Typography color="#9398C2">{i18next.t('wizard.processTemplate.approvers')}</Typography>
                </Button>
            </Grid>
            {isOpen &&
                reviewers.map((reviewer) => (
                    <Grid item key={reviewer.id}>
                        <Typography
                            style={{
                                fontSize: mainFontSizes.headlineSubTitleFontSize,
                                color: '#53566E',
                                fontWeight: '400',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                width: '270px',
                            }}
                        >
                            {reviewer.displayName}
                        </Typography>
                    </Grid>
                ))}
        </Grid>
    );
};
interface ProcessPropertiesProps {
    properties: Record<string, IProcessSingleProperty>;
}

const ProcessProperties: React.FC<ProcessPropertiesProps> = ({ properties }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid>
            <Grid item>
                <Button
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? (
                        <img style={{ marginLeft: '10px' }} src="/icons/Close-Arrow.svg" />
                    ) : (
                        <img style={{ marginLeft: '10px' }} src="/icons/Open-Arrow.svg" />
                    )}
                    <Typography color="#9398C2">{i18next.t('wizard.processTemplate.properties')}</Typography>
                </Button>
            </Grid>
            {isOpen && (
                <Grid item container direction="column" marginLeft="20px">
                    {Object.entries(properties).map(([key, value]) => (
                        <Grid item container key={key} direction="row" wrap="nowrap" alignItems="center">
                            <Typography
                                style={{
                                    fontSize: mainFontSizes.headlineSubTitleFontSize,
                                    color: '#53566E',
                                    fontWeight: '400',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    width: '170px',
                                }}
                            >
                                {value.title}
                            </Typography>
                            <Typography
                                style={{
                                    fontSize: mainFontSizes.headlineSubTitleFontSize,
                                    color: '#53566E',
                                    fontWeight: '400',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    width: '70px',
                                }}
                            >
                                {i18next.t(`propertyTypes.${value.type}`)}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Grid>
    );
};

interface StepProps {
    step: IMongoStepTemplatePopulated;
}

const Step: React.FC<StepProps> = ({ step }) => {
    const theme = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid item container direction="row" marginLeft="20px">
            <Grid item container direction="row" alignItems="center" gap="10px">
                <Button
                    style={{ maxWidth: '250px' }}
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? (
                        <img style={{ marginLeft: '10px' }} src="/icons/Close-Arrow.svg" />
                    ) : (
                        <img style={{ marginLeft: '10px' }} src="/icons/Open-Arrow.svg" />
                    )}
                    {step.iconFileId && <CustomIcon iconUrl={step.iconFileId} height="24px" width="24px" color={theme.palette.primary.main} />}
                    <MeltaTooltip title={step.displayName}>
                        <Typography
                            style={{
                                color: '#9398C2',
                                fontWeight: '400',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                maxWidth: '250px',
                                textAlign: 'right',
                                marginRight: '5px',
                            }}
                        >
                            {step.displayName}
                        </Typography>
                    </MeltaTooltip>
                </Button>
            </Grid>
            {isOpen && (
                <Grid item container direction="column" marginLeft="20px">
                    <ProcessProperties properties={step.properties.properties} />
                    <StepReviewers reviewers={step.reviewers} />
                </Grid>
            )}
        </Grid>
    );
};

interface ProcessTemplateCardProps {
    processTemplate: IMongoProcessTemplatePopulated;
    setProcessTemplateWizardDialogState: (
        value: React.SetStateAction<{
            isWizardOpen: boolean;
            processTemplate: IMongoProcessTemplatePopulated | null;
        }>,
    ) => void;
    setDeleteProcessTemplateDialogState: (
        value: React.SetStateAction<{
            isDialogOpen: boolean;
            processTemplateId: string | null;
        }>,
    ) => void;
}

const ProcessTemplateCard: React.FC<ProcessTemplateCardProps> = ({
    processTemplate,
    setProcessTemplateWizardDialogState,
    setDeleteProcessTemplateDialogState,
}) => {
    const theme = useTheme();
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);

    return (
        <ViewingCard
            width={400}
            title={
                <Grid direction="column" container gap="10px">
                    <Grid
                        item
                        container
                        direction="row"
                        justifyContent="space-between"
                        minWidth="300px"
                        alignItems="center"
                        paddingLeft="20px"
                        flexWrap="nowrap"
                        height="20px"
                    >
                        <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                            <MeltaTooltip title={processTemplate.displayName}>
                                <Typography
                                    style={{
                                        fontSize: mainFontSizes.headlineSubTitleFontSize,
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
                        <Grid item container flexBasis="10%">
                            {isHoverOnCard && (
                                <CardMenu
                                    onEditClick={() => setProcessTemplateWizardDialogState({ isWizardOpen: true, processTemplate })}
                                    onDeleteClick={() =>
                                        setDeleteProcessTemplateDialogState({ isDialogOpen: true, processTemplateId: processTemplate._id })
                                    }
                                />
                            )}
                        </Grid>
                    </Grid>
                    <Grid item container flexDirection="row" gap="20px">
                        {processTemplate.steps.map((step) => (
                            <Grid key={step._id} item container alignItems="center" gap="10px" width="fit-content">
                                {step.iconFileId && (
                                    <CustomIcon iconUrl={step.iconFileId} height="24px" width="24px" color={theme.palette.primary.main} />
                                )}
                                <MeltaTooltip title={step.displayName}>
                                    <Typography
                                        style={{
                                            fontSize: '12px',
                                            color: '#9398C2',
                                            fontWeight: '400',
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
                    <Typography color="#9398C2">{i18next.t('wizard.processTemplate.levels')}</Typography>
                    {processTemplate.steps.map((step) => {
                        return <Step key={step._id} step={step} />;
                    })}
                </Grid>
            }
            onHover={(isHover: boolean) => setIsHoverOnCard(isHover)}
        />
    );
};

const ProcessTemplatesRow: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchText, setSearchText] = useState('');

    const processTemplates = queryClient.getQueryData<IMongoProcessTemplatePopulated[]>('getProcessTemplates')!;
    const [deleteProcessTemplateDialogState, setDeleteProcessTemplateDialogState] = useState<{
        isDialogOpen: boolean;
        processTemplateId: string | null;
    }>({
        isDialogOpen: false,
        processTemplateId: null,
    });

    const [processTemplateWizardDialogState, setProcessTemplateWizardDialogState] = useState<{
        isWizardOpen: boolean;
        processTemplate: IMongoProcessTemplatePopulated | null;
    }>({
        isWizardOpen: false,
        processTemplate: null,
    });

    const { isLoading: deleteTemplateIsLoading, mutateAsync: deleteTemplateMutateAsync } = useMutation(
        (id: string) => deleteProcessTemplateRequest(id),
        {
            onSuccess: (_data, id) => {
                queryClient.setQueryData<IProcessTemplateMap>('getProcessTemplates', (processTemplateMap) => {
                    processTemplateMap!.delete(id);
                    return processTemplateMap!;
                });
                setDeleteProcessTemplateDialogState({ isDialogOpen: false, processTemplateId: null });
                toast.success(i18next.t('wizard.processTemplate.deletedSuccessfully'));
            },
            onError: (error: AxiosError) => {
                toast.error(<ErrorToast axiosError={error} defaultErrorMessage={i18next.t('wizard.processTemplate.failedToDelete')} />);
            },
        },
    );

    return (
        <Grid item container marginBottom="30px" gap="30px">
            <Grid container spacing={1} alignItems="center">
                <Grid item>
                    <SearchInput
                        onChange={setSearchText}
                        borderRadius="7px"
                        placeholder={i18next.t('globalSearch.searchProcesses')}
                        endAdornmentChildren={<SearchIcon />}
                    />
                </Grid>
                <Grid item>
                    <IconButton
                        style={{ borderRadius: '5px' }}
                        onClick={() => setProcessTemplateWizardDialogState({ isWizardOpen: true, processTemplate: null })}
                    >
                        <img src="icons/Add-New-Process.svg" />
                    </IconButton>
                </Grid>
            </Grid>
            {Array.from(processTemplates.values())
                .filter((processTemplate) => searchText === '' || processTemplate.displayName.includes(searchText))
                .map((processTemplate) => (
                    <ProcessTemplateCard
                        key={processTemplate._id}
                        processTemplate={processTemplate}
                        setDeleteProcessTemplateDialogState={setDeleteProcessTemplateDialogState}
                        setProcessTemplateWizardDialogState={setProcessTemplateWizardDialogState}
                    />
                ))}
            <ProcessTemplateWizard
                open={processTemplateWizardDialogState.isWizardOpen}
                handleClose={() => setProcessTemplateWizardDialogState({ isWizardOpen: false, processTemplate: null })}
                initialValues={processTemplateObjectToProcessTemplateForm(processTemplateWizardDialogState.processTemplate)}
                isEditMode={Boolean(processTemplateWizardDialogState.processTemplate)}
            />
            <AreYouSureDialog
                open={deleteProcessTemplateDialogState.isDialogOpen}
                handleClose={() => setDeleteProcessTemplateDialogState({ isDialogOpen: false, processTemplateId: null })}
                onYes={() => deleteTemplateMutateAsync(deleteProcessTemplateDialogState.processTemplateId!)}
                isLoading={deleteTemplateIsLoading}
            />
        </Grid>
    );
};

export { ProcessTemplatesRow };
