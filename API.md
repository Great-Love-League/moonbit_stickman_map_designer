# Box2D 地图设计器 - API 文档

## 目录

1. [Box2D 导出格式规范](#box2d-导出格式规范)
2. [数据类型定义](#数据类型定义)
3. [单位转换](#单位转换)
4. [坐标系统](#坐标系统)
5. [Box2D 集成指南](#box2d-集成指南)

---

## Box2D 导出格式规范

### 顶层结构

```typescript
interface Box2DExportData {
  world_settings: WorldSettings;
  bodies: Box2DBody[];
  joints: Box2DJoint[];
}
```

### 世界设置 (WorldSettings)

```typescript
interface WorldSettings {
  gravity: [number, number];        // 重力向量 [x, y]，米/秒²
  allow_sleeping?: boolean;         // 是否允许刚体休眠，默认 true
  auto_clear_forces?: boolean;      // 每步后是否清除力，默认 true
}
```

**示例**：
```json
{
  "gravity": [0, -10],
  "allow_sleeping": true,
  "auto_clear_forces": true
}
```

### 刚体 (Box2DBody)

```typescript
interface Box2DBody {
  id: string;                       // 唯一标识符
  body_def: BodyDef;               // 刚体定义
  fixtures: Fixture[];             // 夹具数组（碰撞形状）
  visual_properties?: object;      // 视觉属性（预留）
  user_data?: object;              // 用户数据（预留）
}
```

#### BodyDef - 刚体定义

```typescript
interface BodyDef {
  type: 'static' | 'dynamic' | 'kinematic';  // 刚体类型
  position: [number, number];                 // 位置 [x, y]，米
  angle: number;                              // 角度，弧度
  linear_velocity?: [number, number];         // 线速度，米/秒
  angular_velocity?: number;                  // 角速度，弧度/秒
  linear_damping?: number;                    // 线性阻尼，≥0
  angular_damping?: number;                   // 角阻尼，≥0
  allow_sleep?: boolean;                      // 允许休眠
  awake?: boolean;                            // 是否醒着
  fixed_rotation?: boolean;                   // 固定旋转
  bullet?: boolean;                           // 子弹模式（CCD）
  gravity_scale?: number;                     // 重力缩放
}
```

**字段说明**：

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `type` | string | 刚体类型：<br>- `static`: 静态（不动）<br>- `dynamic`: 动态（受力）<br>- `kinematic`: 运动学（程序控制） | - |
| `position` | [number, number] | 世界坐标系中的位置，米单位 | [0, 0] |
| `angle` | number | 旋转角度，弧度，0=水平向右 | 0 |
| `linear_velocity` | [number, number] | 初始线速度，米/秒 | [0, 0] |
| `angular_velocity` | number | 初始角速度，弧度/秒 | 0 |
| `linear_damping` | number | 线性阻尼系数，越大速度衰减越快 | 0 |
| `angular_damping` | number | 角阻尼系数 | 0 |
| `allow_sleep` | boolean | 静止时是否休眠以优化性能 | true |
| `awake` | boolean | 创建时是否处于激活状态 | true |
| `fixed_rotation` | boolean | 是否禁止旋转 | false |
| `bullet` | boolean | 是否启用连续碰撞检测（高速物体） | false |
| `gravity_scale` | number | 重力影响倍数，0=无重力 | 1 |

#### Fixture - 夹具（碰撞形状）

```typescript
interface Fixture {
  shape: Shape;                    // 形状定义
  fixture_def: FixtureDef;        // 夹具定义
}

interface Shape {
  type: 'box' | 'circle' | 'polygon';
  params: ShapeParams;
}

interface ShapeParams {
  // 矩形
  width?: number;                  // 宽度，米
  height?: number;                 // 高度，米
  
  // 圆形
  radius?: number;                 // 半径，米
  
  // 多边形
  vertices?: [number, number][];   // 顶点数组，局部坐标，米
}

interface FixtureDef {
  density: number;                 // 密度，kg/m²
  friction: number;                // 摩擦系数，0-1
  restitution: number;             // 弹性系数，0-1
  is_sensor?: boolean;             // 是否为传感器（只检测不碰撞）
  filter_category_bits?: number;   // 碰撞类别位
  filter_mask_bits?: number;       // 碰撞掩码位
  filter_group_index?: number;     // 碰撞组索引
}
```

**字段说明**：

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `density` | number | 质量密度，实际质量 = 密度 × 面积 | 1.0 |
| `friction` | number | 摩擦系数，0=无摩擦，1=高摩擦 | 0.3 |
| `restitution` | number | 弹性/反弹系数，0=不反弹，1=完全反弹 | 0.5 |
| `is_sensor` | boolean | 传感器只触发碰撞事件但不产生物理碰撞 | false |
| `filter_category_bits` | number | 该夹具属于哪些类别（位掩码） | 1 |
| `filter_mask_bits` | number | 该夹具可以与哪些类别碰撞（位掩码） | 65535 |
| `filter_group_index` | number | 同组为负数时不碰撞，为正数时总碰撞 | 0 |

**形状类型示例**：

```json
// 矩形
{
  "shape": {
    "type": "box",
    "params": {
      "width": 2.0,
      "height": 1.5
    }
  }
}

// 圆形
{
  "shape": {
    "type": "circle",
    "params": {
      "radius": 0.5
    }
  }
}

// 多边形
{
  "shape": {
    "type": "polygon",
    "params": {
      "vertices": [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0]
      ]
    }
  }
}
```

### 关节 (Box2DJoint)

```typescript
interface Box2DJoint {
  id: string;                      // 唯一标识符
  joint_type: 'distance' | 'revolute';  // 关节类型
  body_a: string;                  // 刚体A的ID
  body_b: string | null;           // 刚体B的ID，null表示连接到世界
  joint_def: JointDef;            // 关节定义
  visual_properties?: object;      // 视觉属性（预留）
  user_data?: object;              // 用户数据（预留）
}
```

#### DistanceJointDef - 距离关节定义

```typescript
interface DistanceJointDef {
  local_anchor_a: [number, number];    // 锚点A，bodyA局部坐标，米
  local_anchor_b: [number, number];    // 锚点B，bodyB局部坐标，米
  length: number;                      // 理想长度，米
  frequency_hz: number;                // 弹簧频率，Hz
  damping_ratio: number;               // 阻尼比，0-1
  collide_connected: boolean;          // 连接的刚体是否碰撞
}
```

**字段说明**：

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `local_anchor_a` | [number, number] | 锚点在刚体A局部坐标系中的位置 | - |
| `local_anchor_b` | [number, number] | 锚点在刚体B局部坐标系中的位置 | - |
| `length` | number | 两锚点间的理想距离，米 | - |
| `frequency_hz` | number | 弹簧振动频率，0=刚性，>0=柔性 | 4.0 |
| `damping_ratio` | number | 阻尼比，0=无阻尼，1=临界阻尼 | 0.5 |
| `collide_connected` | boolean | 连接的两个刚体是否相互碰撞 | false |

**弹簧效果调节**：
- 增加 `frequency_hz`：弹簧更硬
- 减少 `frequency_hz`：弹簧更软
- `damping_ratio = 0`：持续振动
- `damping_ratio = 1`：快速停止振动

#### RevoluteJointDef - 旋转关节定义

```typescript
interface RevoluteJointDef {
  local_anchor_a: [number, number];    // 枢轴点A，bodyA局部坐标，米
  local_anchor_b: [number, number];    // 枢轴点B，bodyB局部坐标，米
  reference_angle: number;             // 参考角度，弧度
  enable_limit: boolean;               // 是否启用角度限制
  lower_angle: number;                 // 下限角度，弧度
  upper_angle: number;                 // 上限角度，弧度
  enable_motor: boolean;               // 是否启用马达
  motor_speed: number;                 // 马达速度，弧度/秒
  max_motor_torque: number;            // 最大马达扭矩，N·m
  collide_connected: boolean;          // 连接的刚体是否碰撞
}
```

**字段说明**：

| 字段 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| `local_anchor_a` | [number, number] | 枢轴点在刚体A局部坐标系中的位置 | - |
| `local_anchor_b` | [number, number] | 枢轴点在刚体B局部坐标系中的位置 | - |
| `reference_angle` | number | 刚体B相对A的初始角度偏移 | 0 |
| `enable_limit` | boolean | 是否限制旋转角度范围 | false |
| `lower_angle` | number | 最小旋转角度（相对参考角度） | -π/2 |
| `upper_angle` | number | 最大旋转角度（相对参考角度） | π/2 |
| `enable_motor` | boolean | 是否启用马达驱动旋转 | false |
| `motor_speed` | number | 马达目标角速度 | 0 |
| `max_motor_torque` | number | 马达能产生的最大扭矩 | 0 |
| `collide_connected` | boolean | 连接的两个刚体是否相互碰撞 | false |

---

## 数据类型定义

### TypeScript类型定义文件

完整的类型定义可在项目源码 `src/core/types.ts` 中找到。

---

## 单位转换

### 转换规则

设计器使用**像素**作为编辑单位，Box2D使用**米**作为物理单位。

**转换常量**：
```typescript
const PIXEL_TO_METER = 20;  // 20像素 = 1米
```

### 转换函数

```typescript
// 像素转米
function pixelToMeter(pixel: number): number {
  return pixel / 20;
}

// 米转像素
function meterToPixel(meter: number): number {
  return meter * 20;
}
```

### 需要转换的属性

| 属性类别 | 转换方法 |
|---------|---------|
| 位置 (position) | 像素 ÷ 20 |
| 尺寸 (width, height, radius) | 像素 ÷ 20 |
| 速度 (velocity) | 像素/秒 ÷ 20 |
| 长度 (length) | 像素 ÷ 20 |
| 角度 (angle) | 弧度（无需转换） |
| 角速度 (angular velocity) | 弧度/秒（无需转换） |
| 密度 (density) | kg/m²（无需转换） |
| 力 (force) | 需要考虑质量单位 |

---

## 坐标系统

### 设计器坐标系

- **原点**：画布左上角
- **X轴**：向右为正
- **Y轴**：向下为正

### Box2D 坐标系

- **原点**：世界中心（可配置）
- **X轴**：向右为正
- **Y轴**：向上为正

### Y轴处理

**方案1**：导出时翻转Y坐标
```typescript
exportedY = -pixelY / 20;
```

**方案2**：渲染时翻转（推荐）
```typescript
ctx.scale(1, -1);  // 在Canvas中翻转Y轴
```

**本项目采用**：方案2，保持数据一致性，在渲染层处理Y轴方向。

### 局部坐标系

每个刚体有自己的局部坐标系：
- **原点**：刚体的中心
- **旋转**：跟随刚体旋转

**世界坐标转局部坐标**：
```typescript
function worldToLocal(
  worldX: number, 
  worldY: number, 
  bodyX: number, 
  bodyY: number, 
  bodyAngle: number
): Vector2 {
  const dx = worldX - bodyX;
  const dy = worldY - bodyY;
  const cos = Math.cos(-bodyAngle);
  const sin = Math.sin(-bodyAngle);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  };
}
```

---

## Box2D 集成指南

### 1. 使用 box2d-js

#### 加载库

```html
<script src="box2d-js/lib/box2d.js"></script>
```

#### 初始化世界

```javascript
const b2World = Box2D.Dynamics.b2World;
const b2Vec2 = Box2D.Common.Math.b2Vec2;
const b2BodyDef = Box2D.Dynamics.b2BodyDef;
const b2Body = Box2D.Dynamics.b2Body;
const b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
const b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
const b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

// 创建世界
const gravity = new b2Vec2(0, -10);
const world = new b2World(gravity, true);
```

#### 创建刚体

```javascript
function createBodyFromData(bodyData) {
  // 创建刚体定义
  const bodyDef = new b2BodyDef();
  
  // 设置类型
  if (bodyData.body_def.type === 'static') {
    bodyDef.type = b2Body.b2_staticBody;
  } else if (bodyData.body_def.type === 'dynamic') {
    bodyDef.type = b2Body.b2_dynamicBody;
  } else {
    bodyDef.type = b2Body.b2_kinematicBody;
  }
  
  // 设置位置和角度
  bodyDef.position.Set(
    bodyData.body_def.position[0],
    bodyData.body_def.position[1]
  );
  bodyDef.angle = bodyData.body_def.angle;
  
  // 其他属性
  bodyDef.linearDamping = bodyData.body_def.linear_damping || 0;
  bodyDef.angularDamping = bodyData.body_def.angular_damping || 0;
  bodyDef.fixedRotation = bodyData.body_def.fixed_rotation || false;
  bodyDef.bullet = bodyData.body_def.bullet || false;
  
  // 创建刚体
  const body = world.CreateBody(bodyDef);
  
  // 添加夹具
  bodyData.fixtures.forEach(fixtureData => {
    const fixtureDef = new b2FixtureDef();
    fixtureDef.density = fixtureData.fixture_def.density;
    fixtureDef.friction = fixtureData.fixture_def.friction;
    fixtureDef.restitution = fixtureData.fixture_def.restitution;
    
    // 创建形状
    const shape = fixtureData.shape;
    if (shape.type === 'box') {
      fixtureDef.shape = new b2PolygonShape();
      fixtureDef.shape.SetAsBox(
        shape.params.width / 2,
        shape.params.height / 2
      );
    } else if (shape.type === 'circle') {
      fixtureDef.shape = new b2CircleShape(shape.params.radius);
    } else if (shape.type === 'polygon') {
      fixtureDef.shape = new b2PolygonShape();
      const vertices = shape.params.vertices.map(v => 
        new b2Vec2(v[0], v[1])
      );
      fixtureDef.shape.SetAsArray(vertices, vertices.length);
    }
    
    body.CreateFixture(fixtureDef);
  });
  
  return body;
}
```

#### 创建距离关节

```javascript
const b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef;

function createDistanceJoint(jointData, bodyMap) {
  const bodyA = bodyMap[jointData.body_a];
  const bodyB = bodyMap[jointData.body_b];
  
  const jointDef = new b2DistanceJointDef();
  jointDef.bodyA = bodyA;
  jointDef.bodyB = bodyB;
  
  const def = jointData.joint_def;
  jointDef.localAnchorA.Set(def.local_anchor_a[0], def.local_anchor_a[1]);
  jointDef.localAnchorB.Set(def.local_anchor_b[0], def.local_anchor_b[1]);
  jointDef.length = def.length;
  jointDef.frequencyHz = def.frequency_hz;
  jointDef.dampingRatio = def.damping_ratio;
  jointDef.collideConnected = def.collide_connected;
  
  return world.CreateJoint(jointDef);
}
```

#### 创建旋转关节

```javascript
const b2RevoluteJointDef = Box2D.Dynamics.Joints.b2RevoluteJointDef;

function createRevoluteJoint(jointData, bodyMap) {
  const bodyA = bodyMap[jointData.body_a];
  const bodyB = bodyMap[jointData.body_b];
  
  const jointDef = new b2RevoluteJointDef();
  jointDef.bodyA = bodyA;
  jointDef.bodyB = bodyB;
  
  const def = jointData.joint_def;
  jointDef.localAnchorA.Set(def.local_anchor_a[0], def.local_anchor_a[1]);
  jointDef.localAnchorB.Set(def.local_anchor_b[0], def.local_anchor_b[1]);
  jointDef.referenceAngle = def.reference_angle;
  jointDef.enableLimit = def.enable_limit;
  jointDef.lowerAngle = def.lower_angle;
  jointDef.upperAngle = def.upper_angle;
  jointDef.enableMotor = def.enable_motor;
  jointDef.motorSpeed = def.motor_speed;
  jointDef.maxMotorTorque = def.max_motor_torque;
  jointDef.collideConnected = def.collide_connected;
  
  return world.CreateJoint(jointDef);
}
```

#### 完整加载流程

```javascript
async function loadBox2DScene(jsonPath) {
  // 1. 加载JSON
  const response = await fetch(jsonPath);
  const data = await response.json();
  
  // 2. 创建世界
  const gravity = new b2Vec2(
    data.world_settings.gravity[0],
    data.world_settings.gravity[1]
  );
  const world = new b2World(gravity, data.world_settings.allow_sleeping);
  
  // 3. 创建所有刚体
  const bodyMap = {};
  data.bodies.forEach(bodyData => {
    const body = createBodyFromData(bodyData);
    bodyMap[bodyData.id] = body;
  });
  
  // 4. 创建所有关节
  data.joints.forEach(jointData => {
    if (jointData.joint_type === 'distance') {
      createDistanceJoint(jointData, bodyMap);
    } else if (jointData.joint_type === 'revolute') {
      createRevoluteJoint(jointData, bodyMap);
    }
  });
  
  return { world, bodyMap };
}
```

#### 运行模拟

```javascript
function simulate(world) {
  const timeStep = 1 / 60;
  const velocityIterations = 8;
  const positionIterations = 3;
  
  function step() {
    world.Step(timeStep, velocityIterations, positionIterations);
    world.ClearForces();
    
    // 渲染...
    render(world);
    
    requestAnimationFrame(step);
  }
  
  step();
}
```

### 2. 渲染

```javascript
function render(world, ctx, scale = 20) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 翻转Y轴以匹配Box2D坐标系
  ctx.save();
  ctx.translate(0, canvas.height);
  ctx.scale(1, -1);
  
  // 遍历所有刚体
  for (let body = world.GetBodyList(); body; body = body.GetNext()) {
    const pos = body.GetPosition();
    const angle = body.GetAngle();
    
    ctx.save();
    ctx.translate(pos.x * scale, pos.y * scale);
    ctx.rotate(angle);
    
    // 遍历所有夹具
    for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.GetNext()) {
      const shape = fixture.GetShape();
      
      ctx.fillStyle = body.GetType() === b2Body.b2_staticBody ? '#999' : '#3498db';
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = 2;
      
      if (shape instanceof b2PolygonShape) {
        // 绘制多边形
        const vertices = shape.GetVertices();
        ctx.beginPath();
        ctx.moveTo(vertices[0].x * scale, vertices[0].y * scale);
        for (let i = 1; i < vertices.length; i++) {
          ctx.lineTo(vertices[i].x * scale, vertices[i].y * scale);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shape instanceof b2CircleShape) {
        // 绘制圆形
        const radius = shape.GetRadius();
        ctx.beginPath();
        ctx.arc(0, 0, radius * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
    
    ctx.restore();
  }
  
  ctx.restore();
}
```

---

## 示例代码

完整的示例代码请参考项目源码中的 `src/main.ts` 和 `box2d-js/demos/` 目录。

---

## 技术支持

有关API的问题，请参阅：
- Box2D 官方文档：https://box2d.org/documentation/
- box2d-js GitHub：https://github.com/kripken/box2d.js/

---

**文档版本**：1.0.0  
**最后更新**：2025年10月14日
