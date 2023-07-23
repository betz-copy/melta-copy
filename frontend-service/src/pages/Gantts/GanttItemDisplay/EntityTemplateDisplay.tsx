import React from 'react';
import { CSSProperties } from '@material-ui/core/styles/withStyles';
import { Grid, Typography } from '@mui/material';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { CustomIcon } from '../../../common/CustomIcon';
import { FieldsDisplay } from './FieldsDisplay';

interface EntityTemplateDisplayProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    fieldsToShow: string[];
    color: CSSProperties['color'];
    expanded?: boolean;
    relationshipName?: string;
    main?: boolean;
}

export const EntityTemplateDisplay: React.FC<EntityTemplateDisplayProps> = ({
    entityTemplate,
    fieldsToShow,
    color,
    expanded = true,
    relationshipName,
    main,
}) => {
    const iconSize = main ? '35px' : '28px';

    return (
        <Grid item container direction="column" alignItems="center" spacing={0.2}>
            <Grid item container alignItems="center" flexWrap="nowrap">
                {entityTemplate.iconFileId ? (
                    <CustomIcon iconUrl={entityTemplate.iconFileId} height={iconSize} width={iconSize} color={color} />
                ) : (
                    <DefaultEntityTemplateIcon sx={{ color, height: iconSize, width: iconSize }} />
                )}

                {expanded && (
                    <>
                        <Typography fontWeight="bold" fontSize={main ? 20 : 16} color={color} display="inline" marginX="0.3rem">
                            {entityTemplate.displayName}
                        </Typography>

                        {relationshipName && (
                            <Typography fontSize={10} color="grey" noWrap>
                                {`(${relationshipName})`}
                            </Typography>
                        )}
                    </>
                )}
            </Grid>

            {expanded && (
                <Grid item>
                    <FieldsDisplay entityTemplate={entityTemplate} fieldsToShow={fieldsToShow} color={color} fontSize={main ? 14 : 12} />
                </Grid>
            )}
        </Grid>
    );
};
