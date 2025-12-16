import { IEntity } from '@microservices/shared';
import { Cartesian3 } from 'cesium';

export type LatLng = {
    latitude: number;
    longitude: number;
};

export enum ShapeType {
    Circle = 'circle',
    Polygon = 'polygon',
    Line = 'line',
}

export enum CameraFocusType {
    Circle = 'circle',
    Polygon = 'polygon',
    Search = 'search',
}

export interface ICoordinateSearchResult {
    key: string;
    name: string;
    node: IEntity;
    position: Cartesian3;
}

export interface IPolygonSearchResult extends Omit<ICoordinateSearchResult, 'position'> {
    position: Cartesian3[];
}
