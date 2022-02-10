import { CircularProgress } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAxios } from '../../axios';
import { Graph } from '../../common/graph';
import { environment } from '../../globals';

const sizeByConnectons = (id: number, arr: { source: number; target: number }[]) => {
    let counter = 0;
    arr.forEach((curr) => {
        if (curr.target === id || curr.source === id) {
            counter++;
        }
    });

    if (counter > 6) {
        return 6;
    }

    if (counter > 3) {
        return 4;
    }

    return 2;
};

const Home = () => {
    const { instanceId } = useParams();
    const [{ data: entitiesData, loading }] = useAxios<{ nodes: any[]; links: any[] }>(
        instanceId ? `${environment.api.entities}/${instanceId}` : `${environment.api.entities}/all`,
    );
    const [data, setData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });

    useEffect(() => {
        if (entitiesData) {
            setData({
                nodes: entitiesData.nodes.map((item) => {
                    return {
                        data: { ...item },
                        id: item.id,
                        val: sizeByConnectons(item.id, entitiesData.links),
                    };
                }),
                links: entitiesData.links,
            });
        }
    }, [entitiesData]);

    if (loading) {
        return <CircularProgress size={80} />;
    }

    return <Graph data={data} centerOn={Number(instanceId)} />;
};

export { Home };
