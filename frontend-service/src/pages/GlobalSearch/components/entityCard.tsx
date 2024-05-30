import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Card, CardContent, CardHeader, Dialog, Divider, Grid, IconButton, Typography, styled } from '@mui/material';
import i18next from 'i18next';
import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { BlueTitle } from '../../../common/BlueTitle';
import { CustomIcon } from '../../../common/CustomIcon';
import { EntityProperties } from '../../../common/EntityProperties';
import OpenPreview from '../../../common/FilePreview/OpenPreview';
import OpenSmallPreview from '../../../common/FilePreview/OpenSmallPreview';
import IconButtonWithPopover from '../../../common/IconButtonWithPopover';
import { MeltaTooltip } from '../../../common/MeltaTooltip';
import { CreateOrEditEntityDetails } from '../../../common/dialogs/entity/CreateOrEditEntityDialog';
import { environment } from '../../../globals';
import { IEntity } from '../../../interfaces/entities';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { FileExtensions, IFile } from '../../../interfaces/preview';
import { getEntityTemplateColor } from '../../../utils/colors';
import { getFileName } from '../../../utils/getFileName';
import { getPreviewContentType } from '../../../utils/getFileType';
import { EntityDates } from '../../Entity/components/EntityDates';
import { EntityDisableCheckbox } from '../../Entity/components/EntityDisableCheckbox';
import { IPermissionsOfUser } from '../../../services/permissionsService';
import { ImageWithDisable } from '../../../common/ImageWithDisable';
import { checkUserInstanceOfCategoryPermission } from '../../../utils/permissions/instancePermissions';

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
    entityTemplate: IMongoEntityTemplatePopulated;
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
}) => {
    const [open, setOpen] = useState<boolean>(expandCard);
    const [externalErrors, setExternalErrors] = useState({ files: false, unique: {} });
    const [previewImageIndex, setPreviewImageIndex] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();
    const { instancesPermissions } = queryClient.getQueryData<IPermissionsOfUser>('getMyPermissions')!;
    const userHasWritePermissions = checkUserInstanceOfCategoryPermission(instancesPermissions, entityTemplate.category, 'Write');

    const shouldDisplayFilePreview = useMemo(() => {
        return entityTemplate.propertiesOrder.some((propertyName) => {
            const property = entityTemplate.properties.properties[propertyName];
            return (property.format === 'fileId' || (property.items && property.items.format === 'fileId')) && entity.properties[propertyName];
        });
    }, [entityTemplate, entity]);

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

    const [editDialog, setEditDialog] = useState<{ isOpen: boolean; entity?: IEntity }>({ isOpen: false });
    const navigate = useNavigate();
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);
    const first5PropsKeys: string[] = [
        ...entityTemplate.propertiesPreview,
        ...entityTemplate.propertiesOrder
            .filter(
                (property) =>
                    !entityTemplate.propertiesPreview.includes(property) &&
                    entityTemplate.properties.properties[property].format !== 'fileId' &&
                    entityTemplate.properties.properties[property].items?.format !== 'fileId',
            )
            .slice(0, Math.max(5 - entityTemplate.propertiesPreview.length, 0)),
    ];

    return (
        <Card
            raised
            variant={variant}
            ref={cardRef}
            sx={{
                margin: '0.6rem',
                width: open ? 0.987 : '547px',
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
                        <Grid item minWidth="fit-content" sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
                            {entityTemplate.iconFileId ? (
                                <CustomIcon
                                    color={entityTemplateColor}
                                    iconUrl={entityTemplate.iconFileId}
                                    height={environment.iconSize.height}
                                    width={environment.iconSize.width}
                                />
                            ) : (
                                <AppRegistrationIcon sx={{ fontSize: environment.mainFontSizes.headlineTitleFontSize, color: entityTemplateColor }} />
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
                                    navigate(`/entity/${entity.properties._id}`);
                                },
                                popoverText: i18next.t('wizard.entity.readMore'),
                            },
                            enableEdit && {
                                icon: '/icons/edit-icon.svg',
                                action: () => {
                                    if (!userHasWritePermissions) return;
                                    setEditDialog({ isOpen: true, entity });
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
                            { icon: open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />, action: onOpen },
                        ].map(
                            (item) =>
                                item && (
                                    <Grid item key={item.popoverText}>
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
                    <Grid item xs={8} container paddingLeft="4px" paddingBottom="14px" height="fit-content" minHeight="37px" alignItems="center">
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
                        />
                    </Grid>
                    {shouldDisplayFilePreview && (
                        <Grid item xs={3.8}>
                            <Grid
                                item
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
                                    <Grid item xs={9}>
                                        <MeltaTooltip title={files[previewImageIndex]?.name || ''}>
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
                                                {files[previewImageIndex]?.name || ''}
                                            </Typography>
                                        </MeltaTooltip>
                                    </Grid>
                                    <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        {files[previewImageIndex] && (
                                            <OpenPreview
                                                fileId={files[previewImageIndex].id}
                                                img={<img src="/icons/expand-preview-file.svg" style={{ height: '11px' }} />}
                                                showText={false}
                                            />
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    )}

                    {hasSomeFileIdPropertyTemplate && files.length === 0 && (
                        <Grid item sx={{ display: 'flex', flexDirection: 'row' }}>
                            <img
                                src="/icons/no-file.svg"
                                style={{
                                    height: '167px',
                                    zIndex: 2,
                                }}
                            />
                        </Grid>
                    )}
                </Grid>
            )}
            <Grid container sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Grid item xs={10.5}>
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
                <Grid item xs={1.3}>
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
                                    <Grid item xs={9}>
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
                                    <Grid item xs={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <OpenPreview
                                            fileId={files[previewImageIndex].id}
                                            img={<img src="/icons/expand-preview-file.svg" style={{ height: '11px' }} />}
                                            showText={false}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            hasSomeFileIdPropertyTemplate && files.length === 0 && <img src="/icons/no-file.svg" />
                        ))}
                </Grid>
            </Grid>
            <Dialog open={editDialog.isOpen} maxWidth="md">
                <CreateOrEditEntityDetails
                    isEditMode
                    entityTemplate={entityTemplate}
                    entity={entity}
                    onSuccessUpdate={() => {
                        setEditDialog((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                        refetchQuery?.();
                    }}
                    onCancelUpdate={() => {
                        setEditDialog((prev) => ({ ...prev, isOpen: false }));
                        setExternalErrors({ files: false, unique: {} });
                    }}
                    onError={(currEntity) => {
                        setEditDialog({
                            isOpen: true,
                            entity: currEntity as IEntity,
                        });
                    }}
                    externalErrors={externalErrors}
                    setExternalErrors={setExternalErrors}
                />
            </Dialog>
        </Card>
    );
};

export default EntityCard;
