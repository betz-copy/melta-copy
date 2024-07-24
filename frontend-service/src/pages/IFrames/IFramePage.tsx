import React from 'react';
import Iframe from 'react-iframe';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { CircularProgress, Grid } from '@mui/material';
import { IMongoIFrame } from '../../interfaces/iFrames';
import { getIFrameById } from '../../services/iFramesService';

interface IFramePageProps {
    iFrame?: IMongoIFrame;
}

const IFramePage: React.FC<IFramePageProps> = ({ iFrame }) => {
    const { iFrameId } = useParams();
    const id = iFrame?._id || iFrameId;
    const navigate = useNavigate();

    const { data: iFrameData, isLoading } = useQuery(['getIFrame', id], async () => getIFrameById(id!), {
        initialData: iFrame,
        retry: false,
        onError: (err) => {
            console.log(err);
            navigate('/404');
        },
    });

    if (isLoading) {
        return (
            <Grid container justifyContent="center">
                <CircularProgress />
            </Grid>
        );
    }

    return (
        <Grid
            dir="rtl"
            style={{
                position: 'absolute',
                left: 1,
                right: 80,
                bottom: 47,
                top: 0,
            }}
            height="100%"
        >
            <Iframe url={iFrameData!.url} title={iFrameData!.name} width="100%" height="100%" />
        </Grid>
    );
};
export default IFramePage;
