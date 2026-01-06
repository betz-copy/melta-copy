import { AppRegistration as AppRegistrationIcon, AutoAwesome, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { Box, Card, CardContent, CardHeader, Dialog, Divider, Grid, IconButton, styled, Typography } from '@mui/material';
import { IEntity } from '@packages/entity';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import { PermissionScope } from '@packages/permission';
import { ActionTypes } from '@packages/rule-breach';
import i18next from 'i18next';
import React, { useMemo, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useLocation } from 'wouter';
import { CustomIcon } from '../../../common/CustomIcon';
import { EntityWizardValues } from '../../../common/dialogs/entity';
import { CreateOrEditEntityDetails } from '../../../common/dialogs/entity/CreateOrEditEntityDialog';
import { EntityProperties } from '../../../common/EntityProperties';
import OpenPreview from '../../../common/FilePreview/OpenPreview';
import OpenSmallPreview from '../../../common/FilePreview/OpenSmallPreview';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { ImageWithDisable } from '../../../common/ImageWithDisable';
import BlueTitle from '../../../common/MeltaDesigns/BlueTitle';
import MeltaTooltip from '../../../common/MeltaDesigns/MeltaTooltip';
import { ICreateOrUpdateWithRuleBreachDialogState } from '../../../interfaces/CreateOrEditEntityDialog';
import { FileExtensions, IFile } from '../../../interfaces/preview';
import { useUserStore } from '../../../stores/user';
import { useWorkspaceStore } from '../../../stores/workspace';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getFileName } from '../../../utils/getFileName';
import { getFileNameWithoutExtension, getPreviewContentType } from '../../../utils/getFileType';
import { HighlightText } from '../../../utils/HighlightText';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { getFirstXPropsKeys, isChildTemplate } from '../../../utils/templates';
import { EntityDates } from '../../Entity/components/EntityDates';
import { EntityDisableCheckbox } from '../../Entity/components/EntityDisableCheckbox';
import { NoFile } from './NoFile';

export const StyledCard = styled(Card)(({ theme }) => ({
    background: theme.palette.mode === 'light' ? '#FFFFFF 0% 0% no-repeat padding-box' : undefined,
    boxShadow: '0px 3px 6px #00000029',
    border: theme.palette.mode === 'light' ? '1px solid #DBDBDB' : undefined,
    borderRadius: '8px',
    opacity: '1',
    ':hover': { transform: 'scale(1.02)' },
    cursor: 'pointer',
}));

interface EntityCardProps {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    expandCard?: boolean;
    enableEdit?: boolean;
    customActionButton?: {
        icon: React.ReactNode;
        onClick: (event) => void;
        popoverText?: string;
    };
    onExpand?: (entityId: string) => void;
    customCardStyle?: React.CSSProperties;
    variant?: 'outlined' | 'elevation';
    refetchQuery?: () => void;
    searchedText?: string;
    minioFileId?: string;
    matchedSentence?: string;
}

const EntityCard: React.FC<EntityCardProps> = ({
    entity,
    entityTemplate,
    expandCard = false,
    enableEdit = true,
    customActionButton,
    onExpand,
    customCardStyle,
    variant = 'outlined',
    refetchQuery,
    searchedText,
    minioFileId,
    matchedSentence,
}) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [open, setOpen] = useState<boolean>(expandCard);
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {}, action: '' });
    const [previewImageIndex, setPreviewImageIndex] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const currentUser = useUserStore((state) => state.user);

    const userHasWritePermissions = checkUserTemplatePermission(
        currentUser.currentWorkspacePermissions,
        entityTemplate.category._id,
        entityTemplate._id,
        PermissionScope.write,
    );

    const shouldDisplayFilePreview = useMemo(() => {
        return entityTemplate.propertiesOrder.some((propertyName) => {
            const property = entityTemplate.properties.properties[propertyName];
            return (property.format === 'fileId' || (property.items && property.items.format === 'fileId')) && entity.properties[propertyName];
        });
    }, [entityTemplate, entity]);
    const [createOrUpdateWithRuleBreachDialogState, setCreateOrUpdateWithRuleBreachDialogState] = useState<ICreateOrUpdateWithRuleBreachDialogState>({
        isOpen: false,
    });

    const hasSomeFileIdPropertyTemplate = entityTemplate.propertiesOrder.some((propertyName) => {
        const property = entityTemplate.properties.properties[propertyName];
        return property.format === 'fileId' || (property.items && property.items.format === 'fileId');
    });

    const files: IFile[] = useMemo(
        () =>
            entityTemplate.propertiesOrder.flatMap((propertyName) => {
                const property = entityTemplate.properties.properties[propertyName];
                if (property.format === 'fileId') {
                    const fileId = entity.properties[propertyName];
                    if (fileId) {
                        const contentType = getPreviewContentType(fileId);
                        return [
                            {
                                id: fileId,
                                name: getFileName(fileId),
                                contentType,
                                targetExtension: contentType === 'video' || contentType === 'audio' ? undefined : FileExtensions.png,
                            },
                        ];
                    }
                } else if (property.type === 'array' && property.items?.format === 'fileId') {
                    const fileIds = entity.properties[propertyName] || [];
                    return fileIds.map((fileId: string) => {
                        const contentType = getPreviewContentType(fileId);
                        return {
                            id: fileId,
                            name: getFileName(fileId),
                            contentType,
                            targetExtension: contentType === 'video' || contentType === 'audio' ? undefined : FileExtensions.png,
                        };
                    });
                }
                return [];
            }),
        [entityTemplate, entity],
    );

    const onOpen = () => {
        if (onExpand) onExpand(entity.properties._id);
        if (!open && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (open && cardRef.current) {
            cardRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        setOpen(!open);
    };

    const increaseIndex = () => setPreviewImageIndex(previewImageIndex + 1);
    const decreaseIndex = () => setPreviewImageIndex(previewImageIndex - 1);

    const [editDialog, setEditDialog] = useState<{ isOpen: boolean; entity?: IEntity; wizardValues?: EntityWizardValues }>({ isOpen: false });
    const [_, navigate] = useLocation();
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);
    const first5PropsKeys: string[] = getFirstXPropsKeys(5, entityTemplate);

    useMemo(() => {
        const fileIndex = files.findIndex(
            ({ id, name }) => id === minioFileId || (searchedText && getFileNameWithoutExtension(name).includes(searchedText)),
        );
        setPreviewImageIndex(fileIndex > 0 ? fileIndex : 0);
    }, [files, minioFileId, searchedText]);

    const fileName = files[previewImageIndex]?.name;

    const isFoundByAi = useMemo(() => {
        const isFileNameSearched = searchedText && !fileName?.toLowerCase()?.includes(searchedText?.toLowerCase());
        return isFileNameSearched && minioFileId;
    }, [fileName, minioFileId, searchedText]);

    return (
        <Card
            raised
            variant={variant}
            ref={cardRef}
            sx={{
                margin: '0.6rem',
                width: open ? 0.987 : '520px',
                borderRadius: '15px',
                overflow: 'hidden',
                paddingBottom: '10px',
                ...customCardStyle,
            }}
        >
            <CardHeader
                sx={{ padding: '6px 10px 0px 10px' }}
                title={
                    <Grid container alignItems="center" flexDirection="row" gap="15px">
                        <Grid minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {entityTemplate.iconFileId ? (
                                <CustomIcon
                                    color={entityTemplateColor}
                                    iconUrl={entityTemplate.iconFileId}
                                    height={workspace.metadata.iconSize.height}
                                    width={workspace.metadata.iconSize.width}
                                />
                            ) : (
                                <AppRegistrationIcon
                                    sx={{ fontSize: workspace.metadata.mainFontSizes.headlineTitleFontSize, color: entityTemplateColor }}
                                />
                            )}
                        </Grid>
                        <BlueTitle title={entityTemplate.displayName} component="h4" variant="h6" style={{ fontWeight: 400 }} />
                    </Grid>
                }
                action={
                    <Grid container alignContent="center" alignItems="center">
                        {[
                            {
                                icon: '/icons/read-more-icon.svg',
                                action: () => {
                                    navigate(
                                        `/entity/${entity.properties._id}${
                                            isChildTemplate(entityTemplate) ? `?childTemplateId=${entityTemplate._id}` : ''
                                        }`,
                                    );
                                },
                                popoverText: i18next.t('wizard.entity.readMore'),
                            },
                            enableEdit && {
                                icon: '/icons/edit-icon.svg',
                                action: () => {
                                    if (!userHasWritePermissions) return;
                                    setEditDialog({ isOpen: true, entity });
                                    setCreateOrUpdateWithRuleBreachDialogState({ isOpen: false });
                                    setExternalErrors({ files: false, unique: {}, action: '' });
                                    toast.dismiss();
                                },
                                popoverText: i18next.t(
                                    !userHasWritePermissions ? 'permissions.dontHaveWritePermissions' : 'entitiesTableOfTemplate.editEntity',
                                ),
                                disabled: !userHasWritePermissions,
                            },
                            {
                                icon: '/icons/graph-icon.svg',
                                action: () => {
                                    navigate(`/entity/${entity.properties._id}/graph`);
                                },
                                popoverText: i18next.t('actions.graph'),
                            },
                            { icon: open ? <KeyboardArrowUp /> : <KeyboardArrowDown />, action: onOpen },
                        ].map(
                            (item) =>
                                item && (
                                    <Grid key={item.popoverText}>
                                        <IconButtonWithPopover
                                            popoverText={(typeof item === 'object' && item.popoverText) || ''}
                                            iconButtonProps={{
                                                size: 'large',
                                                onClick: (event) => {
                                                    event.stopPropagation();
                                                    if (typeof item === 'object' && item.action) {
                                                        item.action();
                                                    }
                                                },
                                            }}
                                            disabled={(typeof item === 'object' && item.disabled) || false}
                                        >
                                            {typeof item === 'object' && typeof item.icon === 'string' ? (
                                                <ImageWithDisable
                                                    srcPath={item.icon}
                                                    disabled={(typeof item === 'object' && item.disabled) || false}
                                                />
                                            ) : (
                                                typeof item === 'object' && item.icon
                                            )}
                                        </IconButtonWithPopover>
                                    </Grid>
                                ),
                        )}
                        {customActionButton &&
                            (customActionButton.popoverText ? (
                                <IconButtonWithPopover
                                    popoverText={customActionButton.popoverText!}
                                    iconButtonProps={{
                                        size: 'large',
                                        onClick: (event) => {
                                            event.stopPropagation();
                                            customActionButton.onClick(event);
                                        },
                                    }}
                                >
                                    {customActionButton.icon}
                                </IconButtonWithPopover>
                            ) : (
                                <IconButton
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        customActionButton.onClick(event);
                                    }}
                                    size="large"
                                >
                                    {customActionButton.icon}
                                </IconButton>
                            ))}
                    </Grid>
                }
            />

            <Divider style={{ border: '1px solid #EBEFFA', margin: '0 1% 2% 1%' }} />

            {!open && (
                <Grid
                    container
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        overflowY: 'auto',
                        height: '206px',
                    }}
                >
                    <Grid size={{ xs: 8 }} container paddingLeft="4px" paddingBottom="14px" height="fit-content" minHeight="37px" alignItems="center">
                        <EntityProperties
                            entityTemplate={entityTemplate}
                            properties={entity.properties}
                            overridePropertiesToShow={first5PropsKeys}
                            mode="normal"
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                rowGap: '14px',
                                marginRight: '1rem',
                                paddingTop: '10px',
                                alignItems: 'center',
                                width: '100%',
                            }}
                            viewFirstLineOfLongText
                            searchedText={searchedText}
                            coloredFields={entity.coloredFields}
                        />
                    </Grid>
                    {shouldDisplayFilePreview && (
                        <Grid size={{ xs: 3.8 }}>
                            <Grid
                                sx={{
                                    height: '167px',
                                    margin: '0.3rem 1rem 1rem 1rem',
                                    zIndex: 2,
                                }}
                            >
                                <OpenSmallPreview
                                    files={files}
                                    currentIndex={previewImageIndex}
                                    increaseIndex={increaseIndex}
                                    decreaseIndex={decreaseIndex}
                                />
                                <Grid
                                    container
                                    sx={{
                                        position: 'relative',
                                        bottom: '22px',
                                        backgroundColor: '#101440',
                                        width: '100%',
                                        borderRadius: '0 0 1rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Grid size={{ xs: 9 }}>
                                        {matchedSentence ? (
                                            <MeltaTooltip
                                                title={
                                                    <Typography
                                                        sx={{
                                                            maxHeight: '250px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 10,
                                                            WebkitBoxOrient: 'vertical',
                                                        }}
                                                    >
                                                        {matchedSentence || ''}
                                                    </Typography>
                                                }
                                            >
                                                <Typography
                                                    sx={{
                                                        marginLeft: '7px',
                                                        fontSize: '0.8rem',
                                                        maxWidth: '100%',
                                                        color: 'white',
                                                    }}
                                                >
                                                    <HighlightText text={fileName || ''} searchedText={minioFileId ? fileName : searchedText} />
                                                </Typography>
                                            </MeltaTooltip>
                                        ) : (
                                            <Typography
                                                sx={{
                                                    marginLeft: '7px',
                                                    fontSize: '0.8rem',
                                                    maxWidth: '100%',
                                                    color: 'white',
                                                }}
                                            >
                                                <HighlightText text={fileName || ''} searchedText={minioFileId ? fileName : searchedText} />
                                            </Typography>
                                        )}
                                    </Grid>
                                    <Grid size={{ xs: 3 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        {files[previewImageIndex] && (
                                            <OpenPreview
                                                fileId={files[previewImageIndex].id}
                                                img={<img src="/icons/expand-preview-file.svg" style={{ height: '11px' }} />}
                                                showText={false}
                                            />
                                        )}
                                        {isFoundByAi && (
                                            <MeltaTooltip title={i18next.t('entitiesTableOfTemplate.semanticSearch')} arrow>
                                                <AutoAwesome style={{ height: '18px', color: 'white' }} />
                                            </MeltaTooltip>
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    )}

                    {hasSomeFileIdPropertyTemplate && files.length === 0 && (
                        <Grid sx={{ display: 'flex', flexDirection: 'row' }}>
                            <NoFile />
                        </Grid>
                    )}
                </Grid>
            )}
            <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Grid size={{ xs: 10.5 }}>
                    {open && (
                        <CardContent
                            style={{
                                padding: '13px 50px 8px 20px',
                            }}
                        >
                            <EntityProperties
                                entityTemplate={entityTemplate}
                                properties={entity.properties}
                                textWrap
                                removeFiles
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    flexWrap: 'wrap',
                                    rowGap: '20px',
                                    alignItems: 'center',
                                }}
                                innerStyle={{ flexBasis: '33.33%' }}
                                mode="normal"
                                coloredFields={entity.coloredFields}
                            />
                            <Grid container marginTop="40px">
                                <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
                            </Grid>
                            <Grid marginTop="30px" width="80%">
                                <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />
                            </Grid>
                        </CardContent>
                    )}
                </Grid>
                <Grid size={{ xs: 1.3 }}>
                    {open &&
                        (files.length ? (
                            <Box
                                sx={{
                                    height: '17vh',
                                    margin: '0.3rem 1rem 1.3rem 1rem',
                                    zIndex: 2,
                                }}
                            >
                                <OpenSmallPreview
                                    files={files}
                                    currentIndex={previewImageIndex}
                                    increaseIndex={increaseIndex}
                                    decreaseIndex={decreaseIndex}
                                />
                                <Grid
                                    container
                                    sx={{
                                        position: 'relative',
                                        bottom: '22px',
                                        backgroundColor: '#101440',
                                        width: '100%',
                                        borderRadius: '0 0 1rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Grid size={{ xs: 9 }}>
                                        <MeltaTooltip title={files[previewImageIndex].name}>
                                            <Typography
                                                sx={{
                                                    marginLeft: '7px',
                                                    fontSize: '0.8rem',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: '100%',
                                                    color: 'white',
                                                }}
                                            >
                                                {files[previewImageIndex].name}
                                            </Typography>
                                        </MeltaTooltip>
                                    </Grid>
                                    <Grid size={{ xs: 3 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <OpenPreview
                                            fileId={files[previewImageIndex].id}
                                            img={<img src="/icons/expand-preview-file.svg" style={{ height: '11px' }} />}
                                            showText={false}
                                            searchValue={searchedText}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            hasSomeFileIdPropertyTemplate && files.length === 0 && <NoFile />
                        ))}
                </Grid>
            </Grid>
            <Dialog
                open={editDialog.isOpen}
                maxWidth={
                    entityTemplate?.documentTemplatesIds?.length ? 'lg' : Object.keys(entityTemplate.properties.properties).length === 1 ? 'sm' : 'md'
                }
                fullWidth
            >
                <CreateOrEditEntityDetails
                    mutationProps={{
                        actionType: ActionTypes.UpdateEntity,
                        payload: entity,
                        onError: (currEntityValues) =>
                            setEditDialog({
                                isOpen: true,
                                wizardValues: currEntityValues,
                            }),
                        onSuccess: () => {
                            setEditDialog((prev) => ({ ...prev, isOpen: false }));
                            setExternalErrors({ files: false, unique: {}, action: '' });
                            refetchQuery?.();
                        },
                    }}
                    entityTemplate={entityTemplate}
                    initialCurrValues={editDialog.wizardValues}
                    handleClose={() => setEditDialog((prev) => ({ ...prev, isOpen: false }))}
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                    createOrUpdateWithRuleBreachDialogState={createOrUpdateWithRuleBreachDialogState}
                    setCreateOrUpdateWithRuleBreachDialogState={setCreateOrUpdateWithRuleBreachDialogState}
                />
            </Dialog>
        </Card>
    );
};

export default EntityCard;
