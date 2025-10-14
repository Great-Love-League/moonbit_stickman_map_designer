/**
 * TypeScript 类型定义
 */

import { BodyType, ShapeType, JointType } from './constants';

// ========== 基础类型 ==========

export interface Vector2 {
  x: number;
  y: number;
}

export interface VisualProperties {
  color?: string;
  stroke_color?: string;
  stroke_width?: number;
  [key: string]: any;
}

export interface UserData {
  [key: string]: any;
}

// ========== 刚体相关类型 ==========

export interface BodyDef {
  type: BodyType;
  position: [number, number]; // 米单位，世界坐标
  angle: number; // 弧度
  linear_velocity?: [number, number];
  angular_velocity?: number;
  linear_damping?: number;
  angular_damping?: number;
  allow_sleep?: boolean;
  awake?: boolean;
  fixed_rotation?: boolean;
  bullet?: boolean;
  gravity_scale?: number;
}

export interface ShapeParams {
  // 矩形
  width?: number; // 米单位
  height?: number; // 米单位
  // 圆形
  radius?: number; // 米单位
  // 多边形
  vertices?: [number, number][]; // 米单位，局部坐标
}

export interface Shape {
  type: ShapeType;
  params: ShapeParams;
}

export interface FixtureDef {
  density: number;
  friction: number;
  restitution: number;
  is_sensor?: boolean;
  filter_category_bits?: number;
  filter_mask_bits?: number;
  filter_group_index?: number;
}

export interface Fixture {
  shape: Shape;
  fixture_def: FixtureDef;
}

export interface BodyData {
  id: string;
  type: 'body';
  shape_type: ShapeType;
  // 设计器使用的像素单位属性（用于编辑）
  position: Vector2; // 像素单位
  angle: number; // 弧度
  width?: number; // 像素单位（矩形）
  height?: number; // 像素单位（矩形）
  radius?: number; // 像素单位（圆形）
  vertices?: Vector2[]; // 像素单位（多边形，局部坐标）
  // Box2D 属性
  body_def: BodyDef;
  fixtures: Fixture[];
  visual_properties: VisualProperties;
  user_data: UserData;
}

// ========== 关节相关类型 ==========

export interface DistanceJointDef {
  local_anchor_a: [number, number]; // 米单位，bodyA局部坐标
  local_anchor_b: [number, number]; // 米单位，bodyB局部坐标
  length: number; // 米单位
  frequency_hz: number;
  damping_ratio: number;
  collide_connected: boolean;
}

export interface RevoluteJointDef {
  local_anchor_a: [number, number]; // 米单位，bodyA局部坐标
  local_anchor_b: [number, number]; // 米单位，bodyB局部坐标
  reference_angle: number; // 弧度
  enable_limit: boolean;
  lower_angle: number; // 弧度
  upper_angle: number; // 弧度
  enable_motor: boolean;
  motor_speed: number; // 弧度/秒
  max_motor_torque: number; // N·m
  collide_connected: boolean;
}

export type JointDef = DistanceJointDef | RevoluteJointDef;

export interface JointData {
  id: string;
  type: 'joint';
  joint_type: JointType;
  body_a_id: string;
  body_b_id: string | null; // null表示连接到世界
  joint_def: JointDef;
  visual_properties: VisualProperties;
  user_data: UserData;
}

// ========== 地图对象类型 ==========

export type MapObjectData = BodyData | JointData;

// ========== 导出格式类型 ==========

export interface WorldSettings {
  gravity: [number, number];
  allow_sleeping?: boolean;
  auto_clear_forces?: boolean;
}

export interface Box2DBodyExport {
  id: string;
  body_def: BodyDef;
  fixtures: Fixture[];
  visual_properties?: VisualProperties;
  user_data?: UserData;
}

export interface Box2DJointExport {
  id: string;
  joint_type: JointType;
  body_a: string;
  body_b: string | null;
  joint_def: JointDef;
  visual_properties?: VisualProperties;
  user_data?: UserData;
}

export interface Box2DExportData {
  world_settings: WorldSettings;
  bodies: Box2DBodyExport[];
  joints: Box2DJointExport[];
}

// ========== 事件类型 ==========

export interface CanvasMouseEvent {
  canvasX: number; // Canvas坐标
  canvasY: number;
  worldX: number; // 世界坐标
  worldY: number;
  button: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}
