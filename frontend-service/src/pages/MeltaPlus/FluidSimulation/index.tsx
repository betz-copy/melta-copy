import React, { useEffect } from 'react';
import { webGLFluidSimulation } from './webGLFluidSimulation';

const FluidSimulation: React.FC<{ setTitle: React.Dispatch<React.SetStateAction<string>> }> = ({ setTitle }) => {
    useEffect(() => setTitle(''), [setTitle]);

    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    const setEventListeners = (eventListeners: { type: string; event: string; listener: (event) => void }[], value: boolean) => {
        eventListeners.forEach((eventListener) => {
            const element = eventListener.type === 'canvas' ? canvasRef.current : window;

            if (!element) return;

            if (value) {
                element.addEventListener(eventListener.event, eventListener.listener);
            } else {
                element.removeEventListener(eventListener.event, eventListener.listener);
            }
        });
    };

    useEffect(() => {
        if (!canvasRef.current) return;

        const eventListeners = webGLFluidSimulation(canvasRef.current);

        setEventListeners(eventListeners, true);

        return () => setEventListeners(eventListeners, false);
    }, [canvasRef]);

    return <canvas ref={canvasRef} style={{ position: 'absolute' }} />;
};

export default FluidSimulation;
