import React, { useEffect } from 'react';
import Iframe from 'react-iframe';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { CircularProgress, Grid } from '@mui/material';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { getIFrameById } from '../../services/iFramesService';
import IFrameHeadline from './Headline';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
    isIFramePage?: boolean;
    setIFramesOrder?: (value) => void;
    setTitle?: React.Dispatch<React.SetStateAction<string>>;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame, isIFramePage = true, setIFramesOrder, setTitle }) => {
    const { iFrameId } = useParams();
    const id = iFrame?._id || iFrameId;
    const navigate = useNavigate();
    const { data: iFrameData, isLoading } = useQuery(['getIFrame', id], async () => getIFrameById(id!), {
        initialData: iFrame,
        retry: false,
        onError: (err) => {
            console.log(err);
            if (iFrameId) navigate('/404');
        },
    });
    useEffect(() => setTitle && setTitle(iFrameData?.name ?? ''), [setTitle, iFrameData]);

    if (isLoading) {
        return (
            <Grid container justifyContent="center">
                <CircularProgress />
            </Grid>
        );
    }

    return isIFramePage ? (
        <Grid
            style={{
                height: 'calc(100vh - 58px)',
                width: '100%',
                overflow: 'hidden',
            }}
        >
            <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" frameBorder={0} />
        </Grid>
    ) : (
        <Grid container width="100%" height="100%" flexDirection="column" flexWrap="nowrap">
            <Grid item>
                <IFrameHeadline iFrame={iFrameData!} setIFramesOrder={setIFramesOrder} />
            </Grid>
            <Grid item width="100%" height="100%">
                <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" frameBorder={0} />
            </Grid>
        </Grid>
    );
};
export default IFramePage;
