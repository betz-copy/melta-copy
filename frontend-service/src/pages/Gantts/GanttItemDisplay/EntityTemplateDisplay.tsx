import { AppRegistration as DefaultEntityTemplateIcon } from '@mui/icons-material';
import { Grid, Typography } from '@mui/material';
import { CSSProperties } from '@mui/styles';
import { IMongoEntityTemplateWithConstraintsPopulated } from '@packages/entity-template';
import React, { useMemo } from 'react';
import { CustomIcon } from '../../../common/CustomIcon';
import { useDarkModeStore } from '../../../stores/darkMode';
import { getEntityTemplateColor } from '../../../utils/colors';
import { FieldsDisplay } from './FieldsDisplay';

interface IEntityTemplateDisplayProps {
    entityTemplate: IMongoEntityTemplateWithConstraintsPopulated;
    fieldsToShow: string[];
    color?: CSSProperties['color'];
    subTitle?: string;
    topNote?: string;
    sideNote?: string;
    expanded?: boolean;
    main?: boolean;
}

export const EntityTemplateDisplay: React.FC<IEntityTemplateDisplayProps> = ({
    entityTemplate,
    fieldsToShow,
    color,
    expanded,
    subTitle,
    topNote,
    sideNote,
    main,
}) => {
    const darkMode = useDarkModeStore((state) => state.darkMode);
    const iconSize = main ? '35px' : '29px';

    const noteColor = darkMode ? 'lightgrey' : 'grey';
    const noteFontSize = main ? 12 : 10;

    const displayColor = useMemo(() => color || getEntityTemplateColor(entityTemplate), [entityTemplate, color]);

    return (
        <Grid container direction="column" alignItems="center" spacing={0.2}>
            {expanded && topNote && (
                <Typography fontSize={noteFontSize} fontWeight="bold" color={noteColor} noWrap>
                    {topNote}
                </Typography>
            )}

            <Grid
                container
                alignItems="center"
                justifyContent="center"
                flexWrap="nowrap"
                sx={{ display: 'flex', justifyContent: 'center', alignContent: 'center' }}
            >
                {entityTemplate.iconFileId ? (
                    <CustomIcon iconUrl={entityTemplate.iconFileId} height={iconSize} width={iconSize} color={displayColor} />
                ) : (
                    <DefaultEntityTemplateIcon sx={{ color: displayColor, height: iconSize, width: iconSize }} />
                )}

                {expanded && (
                    <>
                        <Typography fontWeight="bold" fontSize={main ? 20 : 16} color={displayColor} display="inline" marginX="0.3rem" noWrap>
                            {entityTemplate.displayName}
                        </Typography>

                        {sideNote && (
                            <Typography fontSize={noteFontSize} color={noteColor} noWrap>
                                {sideNote}
                            </Typography>
                        )}
                    </>
                )}
            </Grid>

            {expanded && (
                <>
                    {subTitle && (
                        <Grid>
                            <Typography fontSize={14} fontWeight={650} color={displayColor} noWrap>
                                {subTitle}
                            </Typography>
                        </Grid>
                    )}

                    <Grid>
                        <FieldsDisplay entityTemplate={entityTemplate} fieldsToShow={fieldsToShow} color={displayColor} fontSize={main ? 14 : 12} />
                    </Grid>
                </>
            )}
        </Grid>
    );
};
