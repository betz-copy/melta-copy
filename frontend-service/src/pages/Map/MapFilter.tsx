import React from 'react';
import { Label } from '@mui/icons-material';

const MapFilter = () => {
    return (
        <div
            style={{
                position: 'absolute',
                top: '10px',
                right: '100px',
                zIndex: 1000, // Ensure it's above the map
                background: 'white',
                padding: '10px',
                borderRadius: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            }}
        >
            <h3>Filters</h3>
            {/* Your filter controls go here */}
            <Label>
                <input type="checkbox" />
                Show Markers
            </Label>
            <br />
            <Label>
                <input type="checkbox" />
                Show Polygons
            </Label>
            {/* Add more filters as needed */}
        </div>
    );
};

export default MapFilter;
