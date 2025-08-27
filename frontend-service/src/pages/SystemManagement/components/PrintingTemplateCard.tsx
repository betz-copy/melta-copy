import React, { useState } from 'react';
import { Divider, Grid, Typography, useTheme, Button } from '@mui/material';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { IMongoPrintingTemplate } from '../../../interfaces/printingTemplates';
import i18next from 'i18next';
import { useQueryClient } from 'react-query';
import { ExpandMore, ChevronLeft } from '@mui/icons-material';
import { useWorkspaceStore } from '../../../stores/workspace';

interface PrintingTemplateCardProps {
    printingTemplate: IMongoPrintingTemplate;
    setPrintingTemplateWizardDialogState: (
        value: React.SetStateAction<{
            isWizardOpen: boolean;
            printingTemplate: IMongoPrintingTemplate | null;
        }>,
    ) => void;
    setDeletePrintingTemplateDialogState: (
        value: React.SetStateAction<{
            isDialogOpen: boolean;
            printingTemplateId: string | null;
        }>,
    ) => void;
}

export const PrintingTemplateCard: React.FC<PrintingTemplateCardProps> = ({
    printingTemplate,
    setPrintingTemplateWizardDialogState,
    setDeletePrintingTemplateDialogState,
}) => {
    const theme = useTheme();
    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
    const queryClient = useQueryClient();
    const categoriesMap = queryClient.getQueryData<Map<string, any>>('getCategories');
    const entityTemplatesMap = queryClient.getQueryData<Map<string, any>>('getEntityTemplates');

    const workspace = useWorkspaceStore((state) => state.workspace);

    const groupedSections = printingTemplate.sections.reduce<Record<string, typeof printingTemplate.sections>>((acc, section) => {
        if (!acc[section.categoryId]) acc[section.categoryId] = [];
        acc[section.categoryId].push(section);
        return acc;
    }, {});

    const toggleCategory = (e: React.MouseEvent, categoryId: string) => {
        e.stopPropagation();
        setExpandedCategories((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]));
    };
    const toggleEntity = (e: React.MouseEvent, entityId: string) => {
        e.stopPropagation();
        setExpandedEntities((prev) => (prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]));
    };

    return (
        <ViewingCard
            width={300}
            title={
                <Grid direction="column" container gap="10px">
                    <Grid
                        item
                        container
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        paddingLeft="20px"
                        flexWrap="nowrap"
                        height="20px"
                    >
                        <Grid item container alignItems="center" gap="10px" flexBasis="90%">
                            <Typography
                                style={{
                                    fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                    color: theme.palette.primary.main,
                                    fontWeight: '400',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    maxWidth: '250px',
                                }}
                            >
                                {printingTemplate.name}
                            </Typography>
                        </Grid>
                        <Grid item container flexBasis="10%">
                            {isHoverOnCard && (
                                <CardMenu
                                    onOptionsIconClose={() => setIsHoverOnCard(false)}
                                    onEditClick={() => {
                                        setPrintingTemplateWizardDialogState({ isWizardOpen: true, printingTemplate });
                                    }}
                                    onDeleteClick={() => {
                                        setDeletePrintingTemplateDialogState({ isDialogOpen: true, printingTemplateId: printingTemplate._id });
                                    }}
                                />
                            )}
                        </Grid>
                    </Grid>
                </Grid>
            }
            expendedCard={
                <Grid container direction="column" m="10px" gap="10px">
                    <Divider style={{ width: '100%' }} />
                    {Object.entries(groupedSections).map(([categoryId, sections]) => {
                        const isCatOpen = expandedCategories.includes(categoryId);
                        const category = categoriesMap?.get(categoryId);
                        return (
                            <Grid key={categoryId} container direction="column">
                                <Button
                                    onClick={(e) => toggleCategory(e, categoryId)}
                                    style={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: workspace?.metadata?.mainFontSizes?.headlineSubTitleFontSize || 16,
                                        color: theme.palette.primary.main,
                                        paddingLeft: 0,
                                    }}
                                    startIcon={isCatOpen ? <ExpandMore fontSize="small" /> : <ChevronLeft fontSize="small" />}
                                >
                                    <Typography sx={{ fontWeight: 600 }}>{category?.displayName}</Typography>
                                </Button>
                                {isCatOpen && (
                                    <Grid container direction="column" sx={{ pl: 3 }}>
                                        {sections.map((section) => {
                                            const entityId = section.entityTemplateId;
                                            const isEntOpen = expandedEntities.includes(entityId);
                                            const entity = entityTemplatesMap?.get(entityId);
                                            return (
                                                <Grid key={entityId} container direction="column">
                                                    <Button
                                                        onClick={(e) => toggleEntity(e, entityId)}
                                                        style={{
                                                            justifyContent: 'flex-start',
                                                            textTransform: 'none',
                                                            fontWeight: 400,
                                                            fontSize: workspace?.metadata?.mainFontSizes?.headlineSubTitleFontSize || 15,
                                                            color: theme.palette.primary.main,
                                                            paddingLeft: 0,
                                                        }}
                                                        startIcon={isEntOpen ? <ExpandMore fontSize="small" /> : <ChevronLeft fontSize="small" />}
                                                    >
                                                        <Typography>{entity?.displayName}</Typography>
                                                    </Button>
                                                    {isEntOpen && (
                                                        <Grid container direction="column" sx={{ pl: 3 }}>
                                                            {section.selectedColumns.map((col) => {
                                                                const colDisplayName = entity?.properties?.properties?.[col]?.title;
                                                                return (
                                                                    <Typography
                                                                        key={col}
                                                                        color="textSecondary"
                                                                        style={{
                                                                            fontSize: workspace?.metadata?.mainFontSizes?.headlineSubTitleFontSize,
                                                                            marginBottom: 2,
                                                                        }}
                                                                    >
                                                                        {colDisplayName}
                                                                    </Typography>
                                                                );
                                                            })}
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                )}
                            </Grid>
                        );
                    })}
                    <Divider style={{ width: '100%' }} />
                    <Grid container direction="column" gap="10px" color="textSecondary">
                        <Typography fontSize="14px">
                            {i18next.t('wizard.printingTemplate.compactView')}:
                            {printingTemplate.compactView ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no')}
                        </Typography>
                        <Typography fontSize="14px">
                            {i18next.t('wizard.printingTemplate.addEntityCheckbox')}:
                            {printingTemplate.addEntityCheckbox ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no')}
                        </Typography>
                        <Typography fontSize="14px">
                            {i18next.t('wizard.printingTemplate.appendSignatureField')}:
                            {printingTemplate.appendSignatureField ? i18next.t('booleanOptions.yes') : i18next.t('booleanOptions.no')}
                        </Typography>
                        <Typography fontSize="14px">
                            {i18next.t('entityPage.updatedAt')}: {new Date(printingTemplate.updatedAt).toLocaleDateString()}
                        </Typography>
                    </Grid>
                </Grid>
            }
            onHover={setIsHoverOnCard}
        />
    );
};
