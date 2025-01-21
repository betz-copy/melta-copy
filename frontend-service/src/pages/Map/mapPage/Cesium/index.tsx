/* eslint-disable import/first */
window.CESIUM_BASE_URL = '/static/Cesium/';

import { Ion } from 'cesium';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import React, { useEffect, useRef } from 'react';

const CesiumMap = () => {
    Ion.defaultAccessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJjZWI5M2EyNC1lODE3LTQwYTQtYTUxZi00NDlhODAyZDM0NTMiLCJpZCI6MjcwNDM5LCJpYXQiOjE3Mzc0NDk3MzN9.WLi4Zcm4D_PMstHcM3YNMJsw1xPhiNGuJyizwg_4nbg';

    const cesiumContainerRef = useRef(null);

    useEffect(() => {
        const viewer = new Cesium.Viewer(cesiumContainerRef.current!);

        return () => {
            if (viewer && !viewer.isDestroyed()) {
                viewer.destroy();
            }
        };
    }, []);

    return <div id="cesiumContainer" ref={cesiumContainerRef} style={{ height: '100vh', width: '100%' }} />;
};

export default CesiumMap;
