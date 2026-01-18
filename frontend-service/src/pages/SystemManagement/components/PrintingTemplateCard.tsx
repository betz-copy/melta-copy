import { ChevronLeft, ExpandMore } from '@mui/icons-material';
import { Button, Divider, Grid, Typography, useTheme } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useQueryClient } from 'react-query';
import { ICategoryMap } from '../../../interfaces/categories';
import { IEntityTemplateMap } from '../../../interfaces/entityTemplates';
import { IMongoPrintingTemplate } from '../../../interfaces/printingTemplates';
import { useDarkModeStore } from '../../../stores/darkMode';
import { useWorkspaceStore } from '../../../stores/workspace';
import { ViewingCard } from './Card';
import { CardMenu } from './CardMenu';
import { IDeleteDialogState, IWizardDialogState } from './PrintingTemplatesRow';
import { showProperty } from './RulesRow';

interface PrintingTemplateCardProps {
    printingTemplate: IMongoPrintingTemplate;
    setWizardDialog: (value: React.SetStateAction<IWizardDialogState>) => void;
    setDeleteDialog: (value: React.SetStateAction<IDeleteDialogState>) => void;
}

export const PrintingTemplateCard: React.FC<PrintingTemplateCardProps> = ({ printingTemplate, setWizardDialog, setDeleteDialog }) => {
    const theme = useTheme();
    const darkMode = useDarkModeStore((state) => state.darkMode);

    const [isHoverOnCard, setIsHoverOnCard] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
    const queryClient = useQueryClient();
    const categoriesMap = queryClient.getQueryData<ICategoryMap>('getCategories');
    const entityTemplatesMap = queryClient.getQueryData<IEntityTemplateMap>('getEntityTemplates');

    const workspace = useWorkspaceStore((state) => state.workspace);

    const groupedSections = printingTemplate.sections.reduce<Record<string, typeof printingTemplate.sections>>((acc, section) => {
        if (!acc[section.categoryId]) acc[section.categoryId] = [];
        acc[section.categoryId].push(section);
        return acc;
    }, {});

    const onClick = (e: React.MouseEvent, toggleId: string, type: 'category' | 'entity' = 'category') => {
        e.stopPropagation();
        const updated = (prev: string[]) => (prev.includes(toggleId) ? prev.filter((id) => toggleId !== id) : [...prev, toggleId]);
        type === 'category' ? setExpandedCategories(updated) : setExpandedEntities(updated);
    };

    const getPropValue = (key: string) => i18next.t(`booleanOptions.${printingTemplate[key] ? 'yes' : 'no'}`);

    return (
        <ViewingCard
            width={300}
            title={
                <Grid direction="column" container gap="10px">
                    <Grid
                        container
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        paddingLeft="20px"
                        flexWrap="nowrap"
                        height="20px"
                    >
                        <Grid container alignItems="center" gap="10px" flexBasis="90%">
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
                        <Grid container flexBasis="10%">
                            {isHoverOnCard && (
                                <CardMenu
                                    onOptionsIconClose={() => setIsHoverOnCard(false)}
                                    onEditClick={() => {
                                        setWizardDialog({ isOpen: true, printingTemplate });
                                    }}
                                    onDeleteClick={() => {
                                        setDeleteDialog({ isOpen: true, printingTemplateId: printingTemplate._id });
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
                                    onClick={(e) => onClick(e, categoryId)}
                                    style={{
                                        justifyContent: 'flex-start',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: workspace?.metadata?.mainFontSizes?.headlineSubTitleFontSize,
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
                                                        onClick={(e) => onClick(e, entityId, 'entity')}
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
                        {['addEntityCheckbox', 'appendSignatureField'].map((key) =>
                            showProperty(i18next.t(`wizard.printingTemplate.${key}`), getPropValue(key), darkMode),
                        )}
                        {showProperty(i18next.t('entityPage.updatedAt'), new Date(printingTemplate.updatedAt).toLocaleDateString('en-GB'), darkMode)}
                    </Grid>
                </Grid>
            }
            onHover={setIsHoverOnCard}
        />
    );
};
