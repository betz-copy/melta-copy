import { Grid } from '@mui/material';
import i18next from 'i18next';
import React from 'react';
import { IEntity } from '../../../interfaces/entities';
import { IEntityTemplateMap, IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { PermissionScope } from '../../../interfaces/permissions';
import { useUserStore } from '../../../stores/user';
import { checkUserTemplatePermission } from '../../../utils/permissions/instancePermissions';
import { AddIconWithText } from '../../AddIconWithText';
import { AddEntityButton } from '../../EntitiesPage/Buttons/AddEntity';
import IconButtonWithPopover from '../../IconButtonWithPopover';
import { useQueryClient } from 'react-query';
import { IChildTemplateMap } from '../../../interfaces/childTemplates';
import { IChooseTemplateMode } from '../../dialogs/entity/ChooseTemplate';

const DashedSelectBox: React.FC<{
    text: string;
    checkUsersPermissions: PermissionScope;
    onClick: React.MouseEventHandler<HTMLDivElement>;
    error?: boolean;
    entityTemplate?: IMongoEntityTemplatePopulated;
    minHeight: React.CSSProperties['minHeight'];
    onSuccessCreate: (entity: IEntity) => void;
    addNewEntityLabel?: string;
}> = ({ text, checkUsersPermissions, onClick, error, minHeight, entityTemplate, onSuccessCreate, addNewEntityLabel }) => {
    const disabledReasonAnchorRef = React.useRef<HTMLParagraphElement>(null);
    const borderColorTheme = error ? 'error' : 'primary';

    const queryClient = useQueryClient();

    const currentUser = useUserStore((state) => state.user);

    const entityTemplates = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates')!;
    const childTemplates = queryClient.getQueryData<IChildTemplateMap>('getChildTemplates')!;

    const isChildTemplate = entityTemplate ? !entityTemplates.get(entityTemplate._id) : false;
    const childTemplatesOfParent = childTemplates.values().filter(({ parentTemplate: { _id } }) => entityTemplate?._id === _id);

    const userHasPermissions = !entityTemplate
        ? undefined
        : isChildTemplate
          ? childTemplatesOfParent.some(({ _id }) =>
                checkUserTemplatePermission(currentUser.currentWorkspacePermissions, entityTemplate.category._id, _id, checkUsersPermissions),
            )
          : checkUserTemplatePermission(
                currentUser.currentWorkspacePermissions,
                entityTemplate.category._id,
                entityTemplate._id,
                checkUsersPermissions,
            );

    const disabled = !entityTemplate || userHasPermissions === false;

    const popoverText = i18next.t(
        !entityTemplate
            ? 'templateTableSelect.disabledReasonMustChooseTemplate'
            : !userHasPermissions
              ? 'permissions.dontHaveWritePermissions'
              : 'entitiesTableOfTemplate.selectEntity',
    );

    return (
        <div>
            <Grid
                container
                justifyContent="center"
                alignItems="center"
                sx={{
                    border: 'dashed',
                    ':hover': { borderColor: `${borderColorTheme}.main` },
                    borderColor: `${borderColorTheme}.light`,
                    cursor: 'pointer',
                    minHeight,
                }}
            >
                <Grid container justifyContent="center" alignItems="center" spacing={2}>
                    <Grid size={{ xs: 12 }} container display="flex" justifyContent="center">
                        <IconButtonWithPopover popoverText={popoverText} disabled={disabled} style={{ borderRadius: '5px' }}>
                            <AddIconWithText
                                textStyle={{ display: 'flex', alignItems: 'center', fontSize: '19px', fontVariant: 'h4' }}
                                text={text}
                                disabled={disabled}
                                ref={disabledReasonAnchorRef}
                                onClick={onClick}
                            />
                        </IconButtonWithPopover>
                    </Grid>

                    {addNewEntityLabel && (
                        <Grid size={{ xs: 12 }} container display="flex" justifyContent="center">
                            <AddEntityButton
                                initialStep={1}
                                disabled={disabled}
                                popoverText={popoverText}
                                initialValues={
                                    !isChildTemplate && entityTemplate
                                        ? { template: entityTemplate, properties: { disabled: false }, attachmentsProperties: {} }
                                        : undefined
                                }
                                style={{ borderRadius: '5px' }}
                                onSuccessCreate={onSuccessCreate}
                                parentId={isChildTemplate ? entityTemplate?._id : undefined}
                                chooseMode={isChildTemplate ? IChooseTemplateMode.OnlyChildren : undefined}
                            >
                                <AddIconWithText
                                    textStyle={{ display: 'flex', alignItems: 'center', fontSize: '19px', fontVariant: 'h4' }}
                                    text={addNewEntityLabel}
                                    disabled={disabled}
                                />
                            </AddEntityButton>
                        </Grid>
                    )}
                </Grid>
            </Grid>
        </div>
    );
};

export default DashedSelectBox;
