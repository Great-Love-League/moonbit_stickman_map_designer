/**
 * 地图对象基类
 */

import type { MapObjectData, VisualProperties, UserData } from '@core/types';

export abstract class MapObject {
  id: string;
  type: 'body' | 'joint';
  visual_properties: VisualProperties;
  user_data: UserData;

  constructor(id: string, type: 'body' | 'joint') {
    this.id = id;
    this.type = type;
    this.visual_properties = {};
    this.user_data = {};
  }

  abstract toJSON(): MapObjectData;
  abstract fromJSON(data: MapObjectData): void;
  abstract containsPoint(worldX: number, worldY: number): boolean;
}
