import { IProcessSingleProperty } from '@microservices/shared';
import { ChevronLeft, ExpandMore } from '@mui/icons-material';
import { Button, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import React, { useState } from 'react';
import { useWorkspaceStore } from '../../../../stores/workspace';

interface ProcessPropertiesProps {
    properties: Record<string, IProcessSingleProperty>;
}

export const ProcessProperties: React.FC<ProcessPropertiesProps> = ({ properties }) => {
    const workspace = useWorkspaceStore((state) => state.workspace);

    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid>
            <Grid>
                <Button
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? <ExpandMore fontSize="small" /> : <ChevronLeft fontSize="small" />}

                    <Typography>{i18next.t('wizard.processTemplate.properties')}</Typography>
                </Button>
            </Grid>
            {isOpen && (
                <Grid container direction="column" marginLeft="20px">
                    {Object.entries(properties).map(([key, value]) => (
                        <Grid container key={key} direction="row" wrap="nowrap" alignItems="center">
                            <Typography
                                style={{
                                    fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    width: '170px',
                                }}
                            >
                                {value.title}
                            </Typography>
                            <Typography
                                style={{
                                    fontSize: workspace.metadata.mainFontSizes.headlineSubTitleFontSize,
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    width: '70px',
                                }}
                            >
                                {i18next.t(`propertyTypes.${value.type}`)}
                            </Typography>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Grid>
    );
};
