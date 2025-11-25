import { Cartesian3 } from 'cesium';
import { IEntity } from './entities';

export type LatLng = {
    latitude: number;
    longitude: number;
};

export enum MapItemType {
    Polygon = 'polygon',
    Coordinate = 'coordinate',
}

export type CoordinatesResult = {
    type: MapItemType;
    value: Cartesian3 | Cartesian3[];
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
