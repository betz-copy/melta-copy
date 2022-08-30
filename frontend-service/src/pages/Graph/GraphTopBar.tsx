import React from 'react';
import { Box, Typography } from '@mui/material';
import { useQueryClient, useQuery } from 'react-query';
import { RestartAltOutlined as ResetIcon, LinkOutlined as CopyUrlIcon } from '@mui/icons-material';
import i18next from 'i18next';
import { toast } from 'react-toastify';
import { IMongoEntityTemplatePopulated } from '../../interfaces/entityTemplates';
import { getExpandedEntityByIdRequest } from '../../services/entitiesService';
import IconButtonWithPopoverText from '../../common/IconButtonWithPopover';
import TemplatesSelectCheckbox from '../../common/templatesSelectCheckbox';
import { IMongoCategory } from '../../interfaces/categories';

const GraphTopBar: React.FC<{
    onReset: React.MouseEventHandler<HTMLButtonElement>;
    entityId: string;
    filteredEntityTemplates: IMongoEntityTemplatePopulated[];
    setFilteredEntityTemplates: React.Dispatch<React.SetStateAction<IMongoEntityTemplatePopulated[]>>;
}> = ({ onReset, entityId, filteredEntityTemplates, setFilteredEntityTemplates }) => {
    const queryClient = useQueryClient();
    const entityTemplates = queryClient.getQueryData<IMongoEntityTemplatePopulated[]>('getEntityTemplates')!;
    const categories = queryClient.getQueryData<IMongoCategory[]>('getCategories')!;
    const templateIds = entityTemplates.map((entityTemplate) => entityTemplate._id);

    const { data: expandedEntity } = useQuery(['getExpandedEntity', entityId, { templateIds, numberOfConnections: 1 }], () =>
        getExpandedEntityByIdRequest(entityId!, { templateIds, numberOfConnections: 1 }),
    );

    const entityTemplate: IMongoEntityTemplatePopulated = entityTemplates.find(
        (currTemplate) => currTemplate._id === expandedEntity?.entity.templateId,
    )!;

    const handleCopy = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success(i18next.t('entityPage.graph.copiedSuccessfully'));
    };
    return (
        <Box
            bgcolor="#fcfeff"
            paddingRight="2.5rem"
            paddingTop="0.5rem"
            paddingLeft="2.5rem"
            paddingBottom="0.4rem"
            boxShadow="0px 4px 4px #0000000D"
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                    style={{
                        color: '#225AA7',
                        fontWeight: '800',
                    }}
                    component="h4"
                    variant="h4"
                >
                    {entityTemplate?.category.displayName}
                </Typography>
                <Typography variant="h4" fontSize="30px" color="#d3d8df" marginLeft="5px" marginRight="5px">
                    /
                </Typography>
                <Typography style={{ paddingBottom: '2px' }} variant="h4" fontSize="28px" color="#225AA7">
                    {entityTemplate?.displayName}
                </Typography>
                <Box marginLeft="10px">
                    <TemplatesSelectCheckbox
                        title={i18next.t('entityPage.graph.filterTemplates')}
                        templates={entityTemplates}
                        selectedTemplates={filteredEntityTemplates}
                        setSelectedTemplates={setFilteredEntityTemplates}
                        size="small"
                        categories={categories}
                    />
                </Box>
            </Box>

            <Box>
                <IconButtonWithPopoverText
                    popoverText={i18next.t('entityPage.graph.copy')}
                    iconButtonProps={{
                        onClick: handleCopy,
                    }}
                >
                    <CopyUrlIcon color="primary" fontSize="inherit" />
                </IconButtonWithPopoverText>
                <IconButtonWithPopoverText popoverText={i18next.t('entityPage.graph.reset')} iconButtonProps={{ onClick: onReset }}>
                    <ResetIcon color="primary" fontSize="inherit" />
                </IconButtonWithPopoverText>
            </Box>
        </Box>
    );
};

export { GraphTopBar };
