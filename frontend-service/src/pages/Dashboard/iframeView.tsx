import { Grid } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import Iframe from 'react-iframe';
import { BlueTitle } from '../../common/BlueTitle';
import { IFrame } from '../../interfaces/iFrames';
import { useWorkspaceStore } from '../../stores/workspace';

const IframeView: React.FC<{ metaData: IFrame }> = ({ metaData }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const { metadata: agGridMetaData } = useWorkspaceStore((state) => state.workspace);
    const { headlineTitleFontSize } = agGridMetaData.mainFontSizes;

    // useEffect(() => {
    //     window.addEventListener('resize', resizeChart);
    //     return () => window.removeEventListener('resize', resizeChart);
    // }, []);

    // useEffect(() => {
    //     const observer = new ResizeObserver(resizeChart);
    //     if (containerRef.current) observer.observe(containerRef.current);
    //     return () => observer.disconnect();
    // }, []);

    return (
        <Grid ref={containerRef} sx={{ width: '100%', height: '100%', gap: 2 }} container direction="column">
            <Grid item>
                <BlueTitle
                    title={metaData.name || ''}
                    component="h4"
                    variant="h4"
                    style={{
                        fontSize: headlineTitleFontSize,
                        justifySelf: 'center',
                        padding: '20px',
                    }}
                />
            </Grid>

            <Grid item xs style={{ overflow: 'hidden', flexGrow: 1 }}>
                <Iframe url={metaData.url} title={metaData.name} width="100%" height="100%" frameBorder={0} />
            </Grid>
        </Grid>
    );
};

export { IframeView };
