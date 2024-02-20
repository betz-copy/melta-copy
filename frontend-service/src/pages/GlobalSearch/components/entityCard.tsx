import { AppRegistration as AppRegistrationIcon } from '@mui/icons-material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Card, CardContent, CardHeader, Dialog, Divider, Grid, IconButton, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface EntityCardProps {
    entity: IEntity;
    entityTemplate: IMongoEntityTemplatePopulated;
    expandCard?: boolean;
    onExpand?: (entityId: string) => void;
    customActionButton?: {
        icon: React.ReactNode;
        onClick: (event) => void;
        popoverText?: string;
    };
    userHavePermission?: boolean;
    customCardStyle?: React.CSSProperties;
    variant?: 'outlined' | 'elevation';
}

const EntityCard: React.FC<EntityCardProps> = ({
    entity,
    expandCard = false,
    onExpand,
    customActionButton,
    entityTemplate,
    userHavePermission = true,
    customCardStyle,
    variant = 'outlined',
}) => {
    const [open, setOpen] = useState<boolean>(expandCard);
    const [shouldDisplayFilePreview, setShouldDisplayFilePreview] = useState(false);
    const [files, setFiles] = useState<IFile[]>([]);
    const [previewImageIndex, setPreviewImageIndex] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const filePropertyNames = entityTemplate.propertiesOrder.filter((propertyName) => {
            if (entityTemplate.properties.properties[propertyName].format === 'fileId') {
                if (!shouldDisplayFilePreview) {
                    setShouldDisplayFilePreview(true);
                }

                return entity.properties[propertyName];
            }
        });

        if (filePropertyNames.length) {
            setFiles(
                filePropertyNames.map((filePropertyName) => {
                    const fileId = entity.properties[filePropertyName];
                    const contentType = getPreviewContentType(fileId);

                    return {
                        id: fileId,
                        name: getFileName(fileId),
                        contentType,
                        targetExtension: contentType === 'video' || contentType === 'audio' ? undefined : FileExtensions.png,
                    } as IFile;
                }),
            );
        }
    }, [entityTemplate, entity]);

    const onOpen = () => {
        if (onExpand) onExpand(entity.properties._id);
        if (!open) cardRef.current?.scrollIntoView({ behavior: 'smooth' });
        setOpen(!open);
    };

    const increaseIndex = () => setPreviewImageIndex(previewImageIndex + 1);
    const decreaseIndex = () => setPreviewImageIndex(previewImageIndex - 1);

    const [editDialog, setEditDialog] = useState<{ isOpen: boolean; entity?: IEntity }>({ isOpen: false });
    const navigate = useNavigate();
    const entityTemplateColor = getEntityTemplateColor(entityTemplate);
    const first5PropsKeys: string[] = [
        ...entityTemplate.propertiesPreview.slice(0, 5),
        ...entityTemplate.propertiesOrder
            .filter(
                (property) =>
                    !entityTemplate.propertiesPreview.includes(property) && entityTemplate.properties.properties[property].format !== 'fileId',
            )
            .slice(0, 5 - entityTemplate.propertiesPreview.length),
    ];

    return (
        <Card
            raised
            variant={variant}
            ref={cardRef}
            sx={{ borderRadius: '15px', overflow: 'hidden', minHeight: '18rem', ...customCardStyle }}
        >
            <CardHeader
                style={{ height: '36px', padding: '0px 27px 0px 0px', marginTop: '7px' }}
                title={
                    <Grid container alignItems="center" flexDirection="row" gap="20px">
                        <Grid container alignItems="center" justifyContent="center" width="42px" height="42px">
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
                        <BlueTitle style={{ width: 'fit-content' }} title={entityTemplate.displayName} component="h6" variant="h6" />
                    </Grid>
                }
                action={
                    <Grid container alignContent="center" alignItems="center">
                        <Grid container item alignContent="center" alignItems="center">
                            <Grid
                                item
                                onClick={(e) => {
                                    if (!userHavePermission) e.preventDefault();
                                    navigate(`/entity/${entity.properties._id}`);
                                }}
                            >
                                <IconButtonWithPopover popoverText={i18next.t('wizard.entity.readMore')}>
                                    <img src="/icons/read-more-icon.svg" />
                                </IconButtonWithPopover>
                            </Grid>
                            <Grid
                                item
                                onClick={() => {
                                    setEditDialog({
                                        isOpen: true,
                                        entity,
                                    });
                                }}
                            >
                                <IconButtonWithPopover popoverText={i18next.t('actions.edit')}>
                                    <img src="/icons/edit-icon.svg" />
                                </IconButtonWithPopover>
                            </Grid>
                            <Grid
                                item
                                onClick={() => {
                                    navigate(`/entity/${entity.properties._id}/graph`);
                                }}
                            >
                                <IconButtonWithPopover popoverText={i18next.t('actions.graph')}>
                                    <img src="/icons/graph-icon.svg" />
                                </IconButtonWithPopover>
                            </Grid>
                            <IconButton size="large" onClick={onOpen}>
                                {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                        </Grid>

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
                sx={{ '& .MuiCardHeader-action': { marginRight: '0px' } }} // default is -8px
            />

            <Divider style={{ border: '1px solid #EBEFFA', margin: '8px' }} />

            {!open && (
                <Grid container>
                    <Grid
                        item
                        xs={shouldDisplayFilePreview ? 8 : 12}
                        container
                        paddingLeft="4px"
                        height="fit-content"
                        minHeight="37px"
                        alignItems="center"
                    >
                        <EntityProperties
                            entityTemplate={entityTemplate}
                            properties={entity.properties}
                            overridePropertiesToShow={first5PropsKeys}
                            mode="normal"
                            style={{
                                display: 'flex',
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                rowGap: '10px',
                                marginRight: '1rem',
                                paddingTop: '10px',
                                alignItems: 'center',
                                width: '100%',
                            }}
                        />
                    </Grid>
                    {shouldDisplayFilePreview && (
                        <Grid item xs={4}>
                            {files.length ? (
                                <Box sx={{ height: '20vh', marginBottom: '14px', marginLeft: '1rem', marginRight: '1rem', zIndex: 2 }}>
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
                                            bottom: '30px',
                                            backgroundColor: '#101440',
                                            height: '30px',
                                            width: '100%',
                                            borderBottomLeftRadius: '1rem',
                                            borderBottomRightRadius: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Grid item xs={9}>
                                            <MeltaTooltip title={files[previewImageIndex].name}>
                                                <Typography
                                                    sx={{
                                                        marginLeft: '6px',
                                                        fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
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
                                                img={<img src="/icons/expand-preview-file.svg" style={{ height: '14px' }} />}
                                                showText={false}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            ) : (
                                <img src="/icons/no-file.svg" style={{ height: '20vh', width: '8.2vw', marginBottom: '2px' }} />
                            )}
                        </Grid>
                    )}
                </Grid>
            )}
            <Grid container>
                <Grid item xs={10.5}>
                    {open && (
                        <CardContent
                            style={{
                                padding: '40px 90px 20px 50px',
                            }}
                        >
                            <EntityProperties
                                entityTemplate={entityTemplate}
                                properties={entity.properties}
                                textWrap
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
                            <Grid container marginTop="20px">
                                <EntityDisableCheckbox isEntityDisabled={entity.properties.disabled} />
                            </Grid>
                            <Grid marginTop="20px">
                                <EntityDates createdAt={entity.properties.createdAt} updatedAt={entity.properties.updatedAt} />
                            </Grid>
                        </CardContent>
                    )}
                </Grid>
                <Grid item xs={1.5}>
                    {open &&
                        (files.length ? (
                            <Box sx={{ marginBottom: '14px', marginRight: '1rem' }}>
                                <OpenSmallPreview
                                    files={files}
                                    currentIndex={previewImageIndex}
                                    increaseIndex={increaseIndex}
                                    decreaseIndex={decreaseIndex}
                                    maxHeight="24vh"
                                />
                                <Grid
                                    container
                                    sx={{
                                        position: 'relative',
                                        bottom: '34px',
                                        backgroundColor: '#101440',
                                        height: '34px',
                                        width: '100%',
                                        borderBottomLeftRadius: '1rem',
                                        borderBottomRightRadius: '1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Grid item xs={9}>
                                        <MeltaTooltip title={files[previewImageIndex].name}>
                                            <Typography
                                                sx={{
                                                    marginLeft: '6px',
                                                    fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
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
                                            img={<img src="/icons/expand-preview-file.svg" style={{ height: '18px' }} />}
                                            showText={false}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ) : (
                            <img src="/icons/no-file.svg" style={{ height: '24vh', width: '10vw', marginBottom: '2px' }} />
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
                        // One way to update the entity:
                        // entity = 
                        window.location.reload();
                    }}
                    onCancelUpdate={() => setEditDialog((prev) => ({ ...prev, isOpen: false }))}
                />
            </Dialog>
        </Card>
    );
};

export default EntityCard;
