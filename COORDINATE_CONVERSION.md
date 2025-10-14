# Canvas ↔ Box2D 坐标系转换详解

## 问题描述

Canvas 和 Box2D 使用不同的坐标系统：

```
Canvas 坐标系（Y向下）:          Box2D 坐标系（Y向上）:
(0,0) ──────> X                      Y ↑
  │                                  │
  │                                  │
  ↓ Y                          ──────●──────> X
                                    (0,0)
```

## 坐标系差异

| 项目 | Canvas | Box2D | 需要转换 |
|------|--------|-------|---------|
| X轴方向 | 右→ | 右→ | ❌ 不需要 |
| Y轴方向 | 下↓ | 上↑ | ✅ **需要翻转** |
| 原点位置 | 左上角 | 可自定义 | ⚠️ 可选 |
| 角度方向 | 顺时针+ | 逆时针+ | ✅ **需要取反** |
| 单位 | 像素 | 米 | ✅ **需要缩放** |

## 当前实现的问题

### ❌ 错误的代码（当前）

```typescript
// bodyToBox2D 方法
position: [pixelToMeter(body.position.x), pixelToMeter(body.position.y)]
angle: body.angle

// jointToBox2D 方法
local_anchor_a: [pixelToMeter(joint.anchorALocal.x), pixelToMeter(joint.anchorALocal.y)]
```

**问题：**
1. Y 坐标没有翻转
2. 角度没有取反
3. 多边形顶点和锚点的局部坐标没有翻转

## 正确的转换方案

### 方案 A: 简单翻转（推荐）

只翻转 Y 轴，保持原点在左上角：

```typescript
const CANVAS_HEIGHT = 700;

// 1. Body 位置
position: [
  pixelToMeter(body.position.x),
  pixelToMeter(CANVAS_HEIGHT - body.position.y)  // Y 翻转
]

// 2. 角度
angle: -body.angle  // 角度取反

// 3. 多边形顶点（局部坐标）
vertices: body.vertices.map(v => [
  pixelToMeter(v.x),
  pixelToMeter(-v.y)  // 局部 Y 翻转
])

// 4. 关节锚点（局部坐标）
local_anchor_a: [
  pixelToMeter(joint.anchorALocal.x),
  pixelToMeter(-joint.anchorALocal.y)  // 局部 Y 翻转
]
```

### 方案 B: 原点居中

将原点移到 Canvas 中心：

```typescript
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;

// 1. Body 位置
position: [
  pixelToMeter(body.position.x - CANVAS_WIDTH / 2),   // X 原点移到中心
  pixelToMeter(CANVAS_HEIGHT / 2 - body.position.y)   // Y 翻转 + 原点移到中心
]

// 2-4. 其他转换同方案 A
```

## 转换示例

### 示例 1: Body 位置

```typescript
// Canvas 坐标
body.position = { x: 500, y: 100 }  // 屏幕上方中央
body.angle = Math.PI / 4  // 45度顺时针

// 方案 A: 简单翻转
Box2D_position = [
  500 / 20,           // 25.0 米
  (700 - 100) / 20    // 30.0 米
]
Box2D_angle = -Math.PI / 4  // -45度（逆时针）

// 方案 B: 原点居中
Box2D_position = [
  (500 - 500) / 20,   // 0.0 米（中心）
  (350 - 100) / 20    // 12.5 米（上方）
]
```

### 示例 2: 矩形形状

```typescript
// Canvas: 100x50 像素的矩形
body.width = 100
body.height = 50

// Box2D: 不需要翻转（宽高是标量）
shape.params = {
  width: 100 / 20,   // 5.0 米
  height: 50 / 20    // 2.5 米
}
```

### 示例 3: 多边形顶点

```typescript
// Canvas: 三角形（局部坐标）
body.vertices = [
  { x: 0, y: -30 },   // 顶部
  { x: 20, y: 10 },   // 右下
  { x: -20, y: 10 }   // 左下
]

// Box2D: Y 坐标翻转
shape.params.vertices = [
  [0 / 20, -(-30) / 20],    // [0, 1.5]
  [20 / 20, -(10) / 20],    // [1.0, -0.5]
  [-20 / 20, -(10) / 20]    // [-1.0, -0.5]
]
```

### 示例 4: 关节锚点

```typescript
// Canvas: 锚点在 Body 右侧 50 像素
joint.anchorALocal = { x: 50, y: 0 }

// Box2D: 局部 Y 翻转
joint_def.local_anchor_a = [
  50 / 20,    // 2.5 米
  -(0) / 20   // 0 米
]
```

## 重力方向

```typescript
// Canvas 坐标系中，向下是 +Y
// 所以重力向下应该是 [0, 10]
gravity: [0, 10]  // ❌ 错误！

// Box2D 坐标系中，向上是 +Y
// 所以重力向下应该是 [0, -10]
gravity: [0, -10]  // ✅ 正确！
```

**当前代码是正确的：**
```typescript
world_settings: {
  gravity: [0, -10]  // ✅ 向下的重力
}
```

## 完整转换函数

```typescript
const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 700;
const PIXEL_TO_METER = 20;

// Canvas → Box2D 位置（方案 A）
function canvasToBox2DPosition(x: number, y: number): [number, number] {
  return [
    x / PIXEL_TO_METER,
    (CANVAS_HEIGHT - y) / PIXEL_TO_METER
  ];
}

// Canvas → Box2D 角度
function canvasToBox2DAngle(angle: number): number {
  return -angle;
}

// Canvas → Box2D 局部坐标（顶点、锚点）
function canvasToBox2DLocal(x: number, y: number): [number, number] {
  return [
    x / PIXEL_TO_METER,
    -y / PIXEL_TO_METER
  ];
}

// Canvas → Box2D 标量（宽度、高度、半径）
function canvasToBox2DScalar(value: number): number {
  return value / PIXEL_TO_METER;
}
```

## 反向转换（Box2D → Canvas）

如果需要从 Box2D 导入回 Canvas：

```typescript
// Box2D → Canvas 位置
function box2DToCanvasPosition(x: number, y: number): Vector2 {
  return {
    x: x * PIXEL_TO_METER,
    y: CANVAS_HEIGHT - y * PIXEL_TO_METER
  };
}

// Box2D → Canvas 角度
function box2DToCanvasAngle(angle: number): number {
  return -angle;
}

// Box2D → Canvas 局部坐标
function box2DToCanvasLocal(x: number, y: number): Vector2 {
  return {
    x: x * PIXEL_TO_METER,
    y: -y * PIXEL_TO_METER
  };
}
```

## 验证方法

### 手动测试

1. 在 Canvas 顶部 (y=100) 创建一个圆形
2. 导出 Box2D 文件
3. 检查 position 的 Y 坐标应该很大（接近 30.0）

```typescript
// Canvas: y = 100（靠近顶部）
// Box2D: y = (700-100)/20 = 30.0（高位置，Y向上）
```

### 重力测试

1. 创建一个动态圆形
2. 导出的重力应该是 `[0, -10]`（Y向上为正，所以向下是负）
3. 在 Box2D 中加载，物体应该向下掉落

## 推荐实现

**推荐使用方案 A（简单翻转）**，因为：

✅ 转换简单，不易出错
✅ 保留了 Canvas 的坐标范围
✅ 调试时更容易对应
✅ 不需要考虑原点偏移

## 修复清单

需要修改的文件：`src/main.ts`

- [ ] `bodyToBox2D()` 方法
  - [ ] 位置 Y 坐标翻转
  - [ ] 角度取反
  - [ ] 多边形顶点 Y 坐标翻转
  
- [ ] `jointToBox2D()` 方法
  - [ ] 锚点 A 的 Y 坐标翻转
  - [ ] 锚点 B 的 Y 坐标翻转

- [ ] 添加辅助函数
  - [ ] `canvasToBox2DPosition()`
  - [ ] `canvasToBox2DAngle()`
  - [ ] `canvasToBox2DLocal()`
