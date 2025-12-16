import { SxProps, Typography } from '@mui/material';
import { IMongoRelationshipTemplatePopulated } from '../../../../interfaces/relationshipTemplates';
import { Box } from '@mui/system';

interface RelationshipPrintTitleProps {
    relationshipTemplate: IMongoRelationshipTemplatePopulated;
    isExpandedEntityRelationshipSource: boolean;
    fontSize?: string;
    index?: number;
    sxOverride?: SxProps;
}

export const RelationshipPrintTitle: React.FC<RelationshipPrintTitleProps> = ({
    relationshipTemplate,
    isExpandedEntityRelationshipSource,
    fontSize,
    index,
    sxOverride,
}) => {
    const { destinationEntity, sourceEntity, displayName } = relationshipTemplate;

    return (
        <Box display="flex" alignItems="center" sx={{ ...sxOverride, gap: '7px' }}>
            {index && (
                <Typography variant="h6" fontSize={fontSize ?? '26px'} color="gray">
                    {`${index}.`}
                </Typography>
            )}
            <Typography variant="h6" fontSize={fontSize ?? '26px'} color="gray" fontWeight={isExpandedEntityRelationshipSource ? '900' : undefined}>
                {sourceEntity.displayName}
            </Typography>

            <Typography fontWeight="800" color="primary" component="h5" variant="h6" fontSize={fontSize ?? '26px'}>
                {displayName}
            </Typography>

            <Typography variant="h6" fontSize={fontSize ?? '26px'} color="gray" fontWeight={isExpandedEntityRelationshipSource ? undefined : '900'}>
                {destinationEntity.displayName}
            </Typography>
        </Box>
    );
};