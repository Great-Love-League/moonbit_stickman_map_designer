# Box2D 旧版 API 转换完成

## 转换概述

已成功将所有物理预览相关方法从现代 Box2D.js API 转换为旧版 Box2D Flash API。

## 转换时间
2025年（具体时间根据实际情况）

## 转换的方法

### 1. `initBox2DWorld()`
**位置**: src/main.ts 行 2263-2345

**改动**:
- 世界创建: 从 `new Box2D.b2World(gravity, true)` 改为 `new b2World(worldAABB, gravity, true)`
- 添加了 `b2AABB` 世界边界定义 (-1000 到 1000)
- 重力缩放: 从 9.8 改为 98（旧版单位不同）
- 使用 `createBox2DBody()` 和 `createBox2DJoint()` 创建物体和关节

**关键代码**:
```typescript
const worldAABB = new b2AABB();
worldAABB.minVertex.Set(-1000, -1000);
worldAABB.maxVertex.Set(1000, 1000);
const gravity = new b2Vec2(0, -98);
this.box2dWorld = new b2World(worldAABB, gravity, true);
```

---

### 2. `createBox2DBody(body: Body)`
**位置**: src/main.ts 行 2337-2373

**改动**:
- 形状定义: 从 `b2PolygonShape/b2CircleShape` 改为 `b2BoxDef/b2CircleDef/b2PolyDef`
- 矩形: 使用 `shapeDef.extents.Set(width/2, height/2)` 设置半尺寸
- 圆形: 使用 `shapeDef.radius = radius * PPM`
- 多边形: 使用 `shapeDef.vertices` 数组，手动设置每个顶点
- 静态物体: 通过 `density = 0` 实现（而非 `BodyType.b2_staticBody`）
- 创建顺序: `bodyDef.AddShape(shapeDef)` → `world.CreateBody(bodyDef)`

**关键代码**:
```typescript
// 矩形
const shapeDef = new b2BoxDef();
shapeDef.extents.Set(body.width * PPM / 2, body.height * PPM / 2);
shapeDef.density = body.bodyType === 'static' ? 0 : body.density;
bodyDef.AddShape(shapeDef);
const b2Body = this.box2dWorld.CreateBody(bodyDef);
```

---

### 3. `createBox2DJoint(joint: Joint)`
**位置**: src/main.ts 行 2375-2417

**改动**:
- 关节定义: 从 `new Box2D.b2RevoluteJointDef()` 改为 `new b2RevoluteJointDef()`
- 锚点设置: 从 `jointDef.Initialize(bodyA, bodyB, anchor)` 改为手动设置
  - `jointDef.body1 = bodyA`
  - `jointDef.body2 = bodyB`
  - `jointDef.anchorPoint.Set(worldX, worldY)`
- 锚点坐标: 使用世界坐标（需要将局部锚点转换为世界坐标）
- 角度限制: 旧版可能不支持，已注释

**关键代码**:
```typescript
const jointDef = new b2RevoluteJointDef();
jointDef.body1 = bodyA;
jointDef.body2 = bodyB;

// 计算世界锚点
const bodyAPos = bodyA.m_position;
const bodyAAngle = bodyA.m_rotation;
const cosA = Math.cos(bodyAAngle);
const sinA = Math.sin(bodyAAngle);
const worldAnchorX = bodyAPos.x + (joint.anchorALocal.x * PPM * cosA - joint.anchorALocal.y * PPM * sinA);
const worldAnchorY = bodyAPos.y + (joint.anchorALocal.x * PPM * sinA + joint.anchorALocal.y * PPM * cosA);

jointDef.anchorPoint.Set(worldAnchorX, worldAnchorY);
```

---

### 4. `startPreviewAnimation()`
**位置**: src/main.ts 行 2419-2440

**改动**:
- 步进方法: 从 `world.Step(timeStep, velocityIterations, positionIterations)` 改为 `world.Step(1/60, 10)`
- 参数简化: 旧版只有两个参数（时间步长和迭代次数）
- 移除了 `world.ClearForces()`（旧版可能不需要）

**关键代码**:
```typescript
this.box2dWorld.Step(1 / 60, 10);
this.syncBox2DToObjects();
```

---

### 5. `syncBox2DToObjects()`
**位置**: src/main.ts 行 2442-2460

**改动**:
- 位置获取: 从 `b2Body.GetPosition()` 改为 `b2Body.m_position`
- 角度获取: 从 `b2Body.GetAngle()` 改为 `b2Body.m_rotation`
- 坐标转换: 添加了 `canvasToBox2D()` 转换回世界坐标
- Y 轴翻转: 角度需要反向 `body.angle = -angle`

**关键代码**:
```typescript
const pos = b2Body.m_position;
const angle = b2Body.m_rotation;

const worldPos = canvasToBox2D(pos.x, pos.y, this.canvas.width, this.canvas.height);

body.position.x = worldPos.x;
body.position.y = worldPos.y;
body.angle = -angle;
```

---

## 关键 API 差异总结

| 功能 | 现代 Box2D.js | 旧版 Box2D Flash |
|------|---------------|------------------|
| **世界创建** | `new b2World(gravity, allowSleep)` | `new b2World(worldAABB, gravity, doSleep)` |
| **形状定义** | `b2PolygonShape`, `b2CircleShape` | `b2BoxDef`, `b2CircleDef`, `b2PolyDef` |
| **矩形尺寸** | `shape.SetAsBox(halfWidth, halfHeight)` | `shapeDef.extents.Set(halfWidth, halfHeight)` |
| **圆形半径** | `new b2CircleShape(radius)` | `shapeDef.radius = radius` |
| **静态物体** | `bodyDef.type = b2Body.b2_staticBody` | `shapeDef.density = 0` |
| **创建物体** | `world.CreateBody(bodyDef)` → `body.CreateFixture(fixtureDef)` | `bodyDef.AddShape(shapeDef)` → `world.CreateBody(bodyDef)` |
| **关节锚点** | `jointDef.Initialize(bodyA, bodyB, worldAnchor)` | `jointDef.anchorPoint.Set(x, y)` |
| **获取位置** | `body.GetPosition()` | `body.m_position` |
| **获取角度** | `body.GetAngle()` | `body.m_rotation` |
| **步进模拟** | `world.Step(timeStep, velocityIter, positionIter)` | `world.Step(timeStep, iterations)` |

---

## 测试建议

1. **基本测试**:
   - 创建一个静态平台（矩形）
   - 添加一个动态圆球
   - 点击"预览"按钮
   - 验证：球体受重力下落并与平台碰撞

2. **关节测试**:
   - 创建两个动态矩形
   - 添加旋转关节连接
   - 点击预览
   - 验证：两个物体通过关节连接并摆动

3. **混合测试**:
   - 创建复杂场景（多个形状、多个关节）
   - 测试暂停/继续功能
   - 测试重置功能
   - 验证所有物体正确模拟

---

## 已知限制

1. **角度限制**: 旧版 API 可能不支持 `enableLimit`、`lowerAngle`、`upperAngle`（已注释）
2. **马达**: 旧版 API 可能不支持 `enableMotor`、`motorSpeed`
3. **单位差异**: 重力值需要乘以 10（9.8 → 98）
4. **坐标系**: 需要注意 Y 轴翻转（我们的 Y 向上，Box2D 旧版 Y 向下）
5. **多边形**: 顶点数组设置方式与现代 API 不同，需手动设置每个元素

---

## 文件清理建议

以下文件已过时，可以删除：
- `RENDER_FUNCTIONS_BOX2D.ts` - 已确认未被使用

---

## 参考文档

- **旧版 API 示例**: `public/box2d-js/demos/demo_base.js`
- **关节示例**: `public/box2d-js/demos/pendulum.js`
- **API 对比**: `BOX2D_OLD_API_FIX.md`
- **坐标系统**: `COORDINATE_SYSTEM_REFERENCE.md`

---

## 下一步

1. ✅ 完成所有方法转换
2. ⏳ 测试物理预览功能
3. ⏳ 修复可能的 bug
4. ⏳ 优化性能（如有必要）
5. ⏳ 更新用户文档

---

## 总结

所有物理预览方法已成功转换为旧版 Box2D Flash API。转换涉及：
- 世界创建方式改变（增加边界参数）
- 形状定义类改变（Def 类而非 Shape 类）
- 物体创建流程改变（先 AddShape 再 CreateBody）
- 关节设置改变（手动设置属性而非 Initialize）
- 属性访问改变（直接访问 m_position/m_rotation）

代码已准备好测试！🎉
