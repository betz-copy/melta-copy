import React from 'react';
import { DashboardItem } from '../../../interfaces/dashboard';

interface DashboardItemsProps {
    dashboardItems: DashboardItem[];
}

const DashboardItems: React.FC<DashboardItemsProps> = ({ dashboardItems }) => {
    return (
        <div>
            {dashboardItems.map((dashboardItem) => (
                <div key={dashboardItem._id}>{dashboardItem.metaData.name}</div>
            ))}
        </div>
    );
};

export { DashboardItems };
