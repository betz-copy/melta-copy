import React, { useEffect, useRef } from 'react';
import { waterSimulation } from './waterSimulation';

type WaterSimulationInstance = ReturnType<typeof waterSimulation>;

export const Waves: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const cleanup = (simulation: WaterSimulationInstance) => {
        simulation.destroy();
    };

    // biome-ignore lint/correctness/useExhaustiveDependencies: i trust Nadav
    useEffect(() => {
        const simulation = waterSimulation();

        if (!canvasRef.current) return () => cleanup(simulation);

        simulation.init(canvasRef.current);

        return () => cleanup(simulation);
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh' }} />;
};
