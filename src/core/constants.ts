/**
 * 常量定义
 */

// ==================== 画布和视图设置 ====================
// 单位转换：20像素 = 1米
export const PIXEL_TO_METER = 20;
export const METER_TO_PIXEL = 1 / PIXEL_TO_METER;

// 画布默认尺寸
export const DEFAULT_CANVAS_WIDTH = 1000;
export const DEFAULT_CANVAS_HEIGHT = 600;

// 视图控制范围
export const MIN_CANVAS_WIDTH = 400;
export const MAX_CANVAS_WIDTH = 2000;
export const MIN_CANVAS_HEIGHT = 300;
export const MAX_CANVAS_HEIGHT = 1500;
export const MIN_PPM = 5;
export const MAX_PPM = 100;

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

// ==================== 形状尺寸限制 ====================
// 最小尺寸限制（米）
export const MIN_SHAPE_WIDTH = 0.5;
export const MIN_SHAPE_HEIGHT = 0.5;
export const MIN_SHAPE_RADIUS = 0.25;
export const MIN_SCALE_SIZE = 0.1; // 变换控制缩放时的最小尺寸

// 像素单位的最小尺寸（向后兼容）
export const MIN_BODY_SIZE = 10;
export const MIN_CIRCLE_RADIUS = 5;
export const MIN_POLYGON_VERTICES = 3;
export const MAX_POLYGON_VERTICES = 8; // Box2D 多边形最大顶点数

// ==================== 交互控制尺寸 ====================
// 顶点和手柄
export const VERTEX_RADIUS_NORMAL = 5;          // 普通顶点半径（像素）
export const VERTEX_RADIUS_HOVER = 8;           // 悬停顶点半径（像素）
export const VERTEX_SNAP_DISTANCE = 10;         // 顶点捕捉距离（像素）

// 变换控制手柄
export const TRANSFORM_HANDLE_SIZE = 8;                 // 缩放手柄大小（像素）
export const TRANSFORM_HANDLE_HALF_SIZE = TRANSFORM_HANDLE_SIZE / 2; // 缩放手柄半尺寸
export const TRANSFORM_ROTATE_HANDLE_RADIUS = 6;        // 旋转手柄半径（像素）
export const TRANSFORM_ROTATE_HANDLE_OFFSET = 30;       // 旋转手柄距包围框偏移（像素）
export const TRANSFORM_BBOX_LINE_DASH = [5, 5];         // 包围框虚线样式
export const TRANSFORM_HANDLE_COLOR = '#ffffff';        // 缩放手柄颜色（白色）
export const TRANSFORM_HANDLE_STROKE_COLOR = '#3498db'; // 缩放手柄边框颜色（蓝色）
export const TRANSFORM_ROTATE_HANDLE_COLOR = '#e74c3c'; // 旋转手柄颜色（红色）

// 关节锚点
export const ANCHOR_RADIUS_NORMAL = 5;          // 普通锚点半径（像素）
export const ANCHOR_RADIUS_SELECTED = 7;        // 选中锚点半径（像素）
export const VERTEX_CONTROL_RADIUS = 6;         // 顶点编辑控制点半径（像素）

// 删除工具
export const DELETE_HOVER_RADIUS = 4;           // 删除悬停圆圈半径（像素）

// ==================== 渲染颜色 ====================
// 基础颜色
export const COLOR_GRID = '#e0e0e0';
export const COLOR_GRID_TEXT = '#666';
export const COLOR_ORIGIN = '#ff0000';

// 选中和高亮
export const COLOR_SELECTED = '#3498db';        // 蓝色
export const COLOR_HIGHLIGHT = '#27ae60';       // 绿色
export const COLOR_VERTEX_EDITING = '#27ae60';

// 绘制状态
export const COLOR_DRAWING = '#999';
export const COLOR_DELETE_HOVER = '#e74c3c';    // 红色

// 文字
export const COLOR_TEXT = '#333';
export const COLOR_TEXT_DARK = '#2c3e50';

// 关节
export const COLOR_JOINT = '#f39c12';           // 橙色

// ==================== 渲染线宽 ====================
export const LINE_WIDTH_GRID = 1;
export const LINE_WIDTH_ORIGIN = 2;
export const LINE_WIDTH_SELECTED = 2;
export const LINE_WIDTH_VERTEX_HIGHLIGHT = 2;
export const LINE_WIDTH_VERTEX_EDITING = 3;
export const LINE_WIDTH_DRAWING = 1;
export const LINE_WIDTH_JOINT = 3;

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
