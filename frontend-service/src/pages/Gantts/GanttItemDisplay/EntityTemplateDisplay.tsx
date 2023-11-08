import React from 'react';
import { Grid, Typography } from '@mui/material';
import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { CSSProperties } from '@mui/styles';
import { IMongoEntityTemplatePopulated } from '../../../interfaces/entityTemplates';
import { CustomIcon } from '../../../common/CustomIcon';
import { FieldsDisplay } from './FieldsDisplay';
import { RootState } from '../../../store';

interface IEntityTemplateDisplayProps {
    entityTemplate: IMongoEntityTemplatePopulated;
    fieldsToShow: string[];
    color: CSSProperties['color'];
    relationshipName?: string;
    expanded?: boolean;
    main?: boolean;
}

export const EntityTemplateDisplay: React.FC<IEntityTemplateDisplayProps> = ({
    entityTemplate,
    fieldsToShow,
    color,
    expanded,
    relationshipName,
    main,
}) => {
    const darkMode = useSelector((state: RootState) => state.darkMode);
    const iconSize = main ? '35px' : '29px';

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
                        <Typography fontWeight="bold" fontSize={main ? 20 : 16} color={color} display="inline" marginX="0.3rem" noWrap>
                            {entityTemplate.displayName}
                        </Typography>

                        {relationshipName && (
                            <Typography fontSize={10} color={darkMode ? 'lightgrey' : 'grey'} noWrap>
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
