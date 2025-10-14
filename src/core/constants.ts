/**
 * 常量定义
 */

// 单位转换：20像素 = 1米
export const PIXEL_TO_METER = 20;
export const METER_TO_PIXEL = 1 / PIXEL_TO_METER;

// 默认世界设置
export const DEFAULT_WORLD_GRAVITY: [number, number] = [0, -10];
export const DEFAULT_WORLD_ALLOW_SLEEPING = true;
export const DEFAULT_WORLD_AUTO_CLEAR_FORCES = true;

// 默认刚体属性
export const DEFAULT_BODY_DENSITY = 1.0;
export const DEFAULT_BODY_FRICTION = 0.3;
export const DEFAULT_BODY_RESTITUTION = 0.5;
export const DEFAULT_BODY_LINEAR_DAMPING = 0.0;
export const DEFAULT_BODY_ANGULAR_DAMPING = 0.0;
export const DEFAULT_BODY_GRAVITY_SCALE = 1.0;

// 默认关节属性
export const DEFAULT_DISTANCE_JOINT_FREQUENCY = 4.0;
export const DEFAULT_DISTANCE_JOINT_DAMPING = 0.5;
export const DEFAULT_REVOLUTE_JOINT_MOTOR_SPEED = 0.0;
export const DEFAULT_REVOLUTE_JOINT_MAX_TORQUE = 0.0;

// 渲染配置
export const GRID_SIZE = 20;
export const GRID_COLOR = '#e0e0e0';
export const SELECTION_COLOR = '#00ff00';
export const SELECTION_LINE_WIDTH = 2;
export const JOINT_ANCHOR_RADIUS = 6;
export const JOINT_LINE_WIDTH = 2;

// 刚体类型颜色
export const BODY_TYPE_COLORS = {
  static: '#95a5a6',
  dynamic: '#3498db',
  kinematic: '#9b59b6',
} as const;

// 刚体类型描边颜色
export const BODY_TYPE_STROKE_COLORS = {
  static: '#7f8c8d',
  dynamic: '#2c3e50',
  kinematic: '#8e44ad',
} as const;

// 关节类型颜色
export const JOINT_TYPE_COLORS = {
  distance: '#e67e22',
  revolute: '#e74c3c',
} as const;

// 工具类型
export enum Tool {
  SELECT = 'select',
  RECT = 'rect',
  CIRCLE = 'circle',
  POLYGON = 'polygon',
  DISTANCE_JOINT = 'distanceJoint',
  REVOLUTE_JOINT = 'revoluteJoint',
  DELETE = 'delete',
}

// 刚体类型
export enum BodyType {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
  KINEMATIC = 'kinematic',
}

// 形状类型
export enum ShapeType {
  BOX = 'box',
  CIRCLE = 'circle',
  POLYGON = 'polygon',
}

// 关节类型
export enum JointType {
  DISTANCE = 'distance',
  REVOLUTE = 'revolute',
}

// 交互状态
export enum InteractionState {
  IDLE = 'idle',
  DRAWING = 'drawing',
  DRAGGING = 'dragging',
  SELECTING_JOINT_BODY_A = 'selectingJointBodyA',
  SELECTING_JOINT_BODY_B = 'selectingJointBodyB',
}

// 最小尺寸限制
export const MIN_BODY_SIZE = 10; // 像素
export const MIN_CIRCLE_RADIUS = 5; // 像素
export const MIN_POLYGON_VERTICES = 3;

// 碰撞过滤默认值
export const DEFAULT_FILTER_CATEGORY_BITS = 1;
export const DEFAULT_FILTER_MASK_BITS = 65535;
export const DEFAULT_FILTER_GROUP_INDEX = 0;

// ID前缀
export const BODY_ID_PREFIX = 'body_';
export const JOINT_ID_PREFIX = 'joint_';

// 文件名
export const DEFAULT_MAP_FILENAME = 'map.json';
export const DEFAULT_BOX2D_FILENAME = 'box2d_export.json';
