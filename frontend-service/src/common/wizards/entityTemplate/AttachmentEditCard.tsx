import { Delete as DeleteIcon, DeleteForever as DeleteOff, DragHandle as DragHandleIcon } from '@mui/icons-material';
import { Box, Card, CardContent, FormControlLabel, Grid, IconButton, MenuItem, TextField } from '@mui/material';
import { PermissionScope } from '@packages/permission';
import { FormikErrors, FormikTouched } from 'formik';
import i18next from 'i18next';
import { isEqual } from 'lodash';
import React, { memo } from 'react';
import { useUserStore } from '../../../stores/user';
import MeltaSwitch from '../../MeltaDesigns/MeltaSwitch';
import MeltaTooltip from '../../MeltaDesigns/MeltaTooltip';
import { CommonFormInputProperties } from './commonInterfaces';

interface AttachmentEditCardProps {
    value: CommonFormInputProperties;
    index: number;
    isEditMode?: boolean;
    initialValue: CommonFormInputProperties | undefined;
    areThereAnyInstances?: boolean;
    touched?: FormikTouched<CommonFormInputProperties>;
    errors?: FormikErrors<CommonFormInputProperties>;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    remove: (index: number, isNewProperty: boolean) => void;
    supportChangeToRequiredWithInstances: boolean;
    supportDeleteForExistingInstances: boolean;
    hasActions?: boolean;
    supportConvertingToMultipleFields?: boolean;
    dragRef?: React.RefObject<null>;
}

export const AttachmentEditCard: React.FC<AttachmentEditCardProps> = ({
    value,
    index,
    isEditMode,
    initialValue,
    areThereAnyInstances,
    touched,
    errors,
    onChange,
    remove,
    supportChangeToRequiredWithInstances,
    supportDeleteForExistingInstances,
    hasActions,
    supportConvertingToMultipleFields = true,
    dragRef,
}) => {
    const currentUser = useUserStore((state) => state.user);

    const name = `attachmentProperties[${index}].name`;
    const touchedName = touched?.name;
    const errorName = errors?.name;

    const title = `attachmentProperties[${index}].title`;
    const touchedTitle = touched?.title;
    const errorTitle = errors?.title;
    const type = `properties[${index}].type`;

    const validPropertyTypes = ['fileId', 'multipleFiles'];
    const required = `attachmentProperties[${index}].required`;

    const isNewProperty = !initialValue;

    const isDisabled = Boolean(isEditMode && !isNewProperty && areThereAnyInstances);

    return (
        <Grid ref={dragRef} alignSelf="stretch" marginBottom="1rem">
            <Card
                elevation={3}
                sx={{
                    padding: '0.5rem',
                    ...(value.deleted && {
                        backgroundColor: 'rgb(224, 225, 237,0.4)',
                    }),
                }}
            >
                <CardContent sx={{ '&:last-child': { padding: 0 } }}>
                    <Grid container gap={2} wrap="nowrap" alignItems="center">
                        <Box>
                            <DragHandleIcon fontSize="large" />
                        </Box>

                        <Grid container direction="column" width="100%">
                            <Grid container wrap="nowrap">
                                <TextField
                                    label={i18next.t('wizard.entityTemplate.attachmentName')}
                                    id={name}
                                    name={name}
                                    value={value.name}
                                    onChange={onChange}
                                    error={touchedName && Boolean(errorName)}
                                    helperText={touchedName && errorName}
                                    disabled={isDisabled || value.deleted}
                                    sx={{ width: '70%', marginRight: '5px' }}
                                />
                                <TextField
                                    label={i18next.t('wizard.entityTemplate.attachmentDisplayName')}
                                    id={title}
                                    name={title}
                                    value={value.title}
                                    onChange={onChange}
                                    error={touchedTitle && Boolean(errorTitle)}
                                    helperText={touchedTitle && errorTitle}
                                    disabled={value.deleted}
                                    sx={{ width: '70%', marginRight: '5px' }}
                                />
                                <TextField
                                    select
                                    type="text"
                                    label={i18next.t('wizard.entityTemplate.propertyType')}
                                    id={type}
                                    name={type}
                                    value={value.type}
                                    onChange={onChange}
                                    error={touchedTitle && Boolean(errorTitle)}
                                    helperText={touchedTitle && errorTitle}
                                    disabled={isDisabled && (initialValue?.type !== 'fileId' || !supportConvertingToMultipleFields)}
                                    sx={{ marginRight: '5px' }}
                                    fullWidth
                                >
                                    {validPropertyTypes.map((validType) => {
                                        return (
                                            <MenuItem key={validType} value={validType}>
                                                {i18next.t(`propertyTypes.${validType}`)}
                                            </MenuItem>
                                        );
                                    })}
                                </TextField>
                            </Grid>
                            <Grid container justifyContent="space-between">
                                <Box>
                                    {value.required !== undefined && (
                                        <FormControlLabel
                                            control={
                                                <MeltaSwitch
                                                    id={required}
                                                    name={required}
                                                    onChange={onChange}
                                                    checked={value.required}
                                                    disabled={
                                                        (supportChangeToRequiredWithInstances
                                                            ? false
                                                            : isEditMode &&
                                                              areThereAnyInstances &&
                                                              (isNewProperty || (!isNewProperty && !initialValue?.required))) || value.deleted
                                                    }
                                                />
                                            }
                                            label={i18next.t('validation.required')}
                                        />
                                    )}
                                </Box>

                                <MeltaTooltip
                                    disableHoverListener={!initialValue?.required}
                                    title={i18next.t('wizard.entityTemplate.cantDeleteUniqueOrRequiredFields')}
                                >
                                    <Grid>
                                        <IconButton
                                            onClick={() => remove(index, isNewProperty)}
                                            disabled={
                                                !supportDeleteForExistingInstances ||
                                                initialValue?.required ||
                                                currentUser.currentWorkspacePermissions.admin?.scope !== PermissionScope.write ||
                                                hasActions
                                            }
                                        >
                                            {value.deleted ? <DeleteOff /> : <DeleteIcon />}
                                        </IconButton>
                                    </Grid>
                                </MeltaTooltip>
                            </Grid>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
        </Grid>
    );
};

export const MemoAttachmentEditCard = memo(
    AttachmentEditCard,
    (prev, next) =>
        prev.index === next.index &&
        prev.areThereAnyInstances === next.areThereAnyInstances &&
        isEqual(prev.value, next.value) &&
        isEqual(prev.touched, next.touched) &&
        isEqual(prev.errors, next.errors),
);
