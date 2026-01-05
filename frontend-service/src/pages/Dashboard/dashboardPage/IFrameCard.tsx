import { Grid } from '@mui/material';
import { IMongoIframe } from '@packages/iframe';
import React, { useRef } from 'react';
import Iframe from 'react-iframe';
import { CardTitle } from './TableCard';

const IFrameCard: React.FC<{ metaData: IMongoIframe }> = ({ metaData }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <Grid ref={containerRef} sx={{ width: '100%', height: '100%', gap: 2 }} container direction="column">
            <Grid>
                <CardTitle title={metaData.name} />
            </Grid>

            <Grid size="grow" style={{ overflow: 'hidden', flexGrow: 1 }}>
                <Iframe url={metaData.url} title={metaData.name} width="100%" height="100%" frameBorder={0} />
            </Grid>
        </Grid>
    );
};

export default IFrameCard;
