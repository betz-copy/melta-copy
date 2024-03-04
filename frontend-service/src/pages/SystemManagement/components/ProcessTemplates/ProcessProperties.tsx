import React, { useState } from 'react';
import { Button, Grid, Typography } from '@mui/material';
import i18next from 'i18next';
import { IProcessSingleProperty } from '../../../../interfaces/processes/processTemplate';
import { environment } from '../../../../globals';

interface ProcessPropertiesProps {
    properties: Record<string, IProcessSingleProperty>;
}

export const ProcessProperties: React.FC<ProcessPropertiesProps> = ({ properties }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Grid>
            <Grid item>
                <Button
                    onClick={(event) => {
                        event.preventDefault();
                        setIsOpen(!isOpen);
                        event.stopPropagation();
                    }}
                >
                    {isOpen ? (
                        <img style={{ marginLeft: '10px' }} src="/icons/Close-Arrow.svg" />
                    ) : (
                        <img style={{ marginLeft: '10px' }} src="/icons/Open-Arrow.svg" />
                    )}

                    <Typography color="#9398C2">{i18next.t('wizard.processTemplate.properties')}</Typography>
                </Button>
            </Grid>
            {isOpen && (
                <Grid item container direction="column" marginLeft="20px">
                    {Object.entries(properties).map(([key, value]) => (
                        <Grid item container key={key} direction="row" wrap="nowrap" alignItems="center">
                            <Typography
                                style={{
                                    fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                    color: '#53566E',
                                    fontWeight: '400',
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
                                    fontSize: environment.mainFontSizes.headlineSubTitleFontSize,
                                    color: '#53566E',
                                    fontWeight: '400',
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
