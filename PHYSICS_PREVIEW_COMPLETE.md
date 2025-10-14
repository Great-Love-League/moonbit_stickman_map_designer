# 物理预览功能完整实现

## 完成时间
2025年10月14日

## 功能概述

物理预览功能允许用户使用 Box2D 物理引擎实时预览场景中物体的物理行为，包括重力、碰撞、旋转关节、角度限制和马达控制。

---

## 🎯 核心功能

### 1. 基础预览控制
- ✅ **开始预览**: 空格键 或 点击"预览"按钮
- ✅ **暂停/继续**: 点击预览控制栏中的按钮
- ✅ **重置预览**: 恢复所有物体到初始状态并重新开始
- ✅ **退出预览**: ESC 键 或 点击"退出预览"按钮

### 2. 物理引擎集成
- ✅ 使用旧版 Box2D Flash API（box2d-js）
- ✅ 支持所有形状类型（矩形、圆形、多边形）
- ✅ 支持动态、静态、运动学三种物体类型
- ✅ 完整的物理属性（密度、摩擦力、弹性、阻尼等）

### 3. 关节系统
- ✅ **旋转关节**（Revolute Joint）
- ✅ **角度限制**：可设置上下限角度
- ✅ **马达控制**：支持马达速度和最大扭矩
- ✅ **碰撞连接**：可选择是否允许连接物体碰撞

### 4. 用户体验优化
- ✅ **状态保存/恢复**：预览结束后恢复原始状态
- ✅ **工具栏禁用**：预览期间禁用所有编辑操作
- ✅ **视觉反馈**：关节创建时高亮显示选中物体
- ✅ **错误检查**：防止同一物体连接自己
- ✅ **详细日志**：控制台输出调试信息

---

## 🔧 技术实现

### Box2D 坐标转换

#### 1. 物体位置转换
```typescript
// 我们的坐标系（米）→ 画布坐标（像素）
const canvasPos = box2DToCanvas(body.position.x, body.position.y, canvas.width, canvas.height);
bodyDef.position.Set(canvasPos.x, canvasPos.y);
```

#### 2. 角度转换
```typescript
// Y 轴翻转导致角度反向
bodyDef.rotation = -body.angle;
```

#### 3. 关节锚点转换（修复后）
```typescript
// 步骤1: 局部坐标 → 世界坐标（我们的坐标系，米）
const anchorWorld = localToWorld(
  joint.anchorALocal.x,
  joint.anchorALocal.y,
  bodyA.position.x,
  bodyA.position.y,
  bodyA.angle
);

// 步骤2: 世界坐标 → 画布坐标（像素）
const anchorCanvas = box2DToCanvas(
  anchorWorld.x,
  anchorWorld.y,
  canvas.width,
  canvas.height
);

// 步骤3: 设置关节锚点
jointDef.anchorPoint.Set(anchorCanvas.x, anchorCanvas.y);
```

### 旧版 Box2D API 适配

#### 世界创建
```typescript
const worldAABB = new b2AABB();
worldAABB.minVertex.Set(-1000, -1000);
worldAABB.maxVertex.Set(1000, 1000);

const gravity = new b2Vec2(0, 300); // Y向下为正，300 pixels/s²
const world = new b2World(worldAABB, gravity, true);
```

#### 形状定义
```typescript
// 矩形
const boxDef = new b2BoxDef();
boxDef.extents.Set(width * PPM / 2, height * PPM / 2);
boxDef.density = bodyType === 'static' ? 0 : density;

// 圆形
const circleDef = new b2CircleDef();
circleDef.radius = radius * PPM;
circleDef.density = bodyType === 'static' ? 0 : density;

// 多边形
const polyDef = new b2PolyDef();
polyDef.vertexCount = vertices.length;
polyDef.vertices = vertices.map(v => ({
  x: v.x * PPM,
  y: -v.y * PPM  // Y 轴翻转
}));
```

#### 物体创建
```typescript
const bodyDef = new b2BodyDef();
bodyDef.AddShape(shapeDef);  // 先添加形状
bodyDef.position.Set(x, y);
bodyDef.rotation = angle;
const body = world.CreateBody(bodyDef);  // 再创建物体
```

#### 关节创建
```typescript
const jointDef = new b2RevoluteJointDef();
jointDef.body1 = bodyA;
jointDef.body2 = bodyB;
jointDef.anchorPoint.Set(x, y);  // 世界坐标

// 角度限制
jointDef.enableLimit = true;
jointDef.lowerAngle = -Math.PI / 2;
jointDef.upperAngle = Math.PI / 2;

// 马达
jointDef.enableMotor = true;
jointDef.motorSpeed = 1.0;  // rad/s
jointDef.motorTorque = 1000;  // 最大扭矩

const joint = world.CreateJoint(jointDef);
```

#### 物理模拟步进
```typescript
world.Step(1 / 60, 10);  // timeStep, iterations
```

#### 获取物体状态
```typescript
const pos = body.m_position;    // 直接访问属性
const angle = body.m_rotation;  // 不是方法调用
```

---

## 🐛 已修复的问题

### 1. 预览按钮状态问题
**问题**: 
- 开始预览时按钮状态未初始化
- 退出/重置后按钮状态残留

**修复**:
- `startPreview()`: 设置初始状态（显示"暂停"按钮）
- `resetPreview()`: 重置为播放中状态
- `exitPreview()`: 隐藏所有预览控制按钮

### 2. 物体状态未恢复
**问题**: 
- 重置/退出预览后，物体保持在最后的模拟位置

**修复**:
- 添加 `previewOriginalState` 保存初始状态
- `startPreview()`: 保存所有物体的位置和角度
- `resetPreview()` / `exitPreview()`: 恢复原始状态

### 3. 预览期间可编辑
**问题**: 
- 预览模式下仍可移动、编辑物体

**修复**:
- `onMouseDown()`: 预览模式下禁用所有鼠标操作（除中键平移）
- `onMouseMove()`: 预览模式下只更新状态栏
- `onMouseUp()`: 预览模式下忽略所有操作
- `onDoubleClick()`: 预览模式下禁用
- 键盘事件: 预览模式下只允许 ESC 退出
- 工具栏: 预览期间禁用所有按钮

### 4. 关节创建问题
**问题 A**: 
- 可以选择同一个物体两次，创建自连接关节

**修复**:
```typescript
if (this.jointBodyA.id === bodyB.id) {
  this.updateStatus('关节工具', '', '❌ 不能连接同一个物体！');
  return;
}
```

**问题 B**: 
- 关节锚点坐标转换错误
- 混淆了局部坐标、世界坐标和画布坐标

**修复**:
1. 先将局部坐标转换为世界坐标（使用 `localToWorld`）
2. 再将世界坐标转换为画布坐标（使用 `box2DToCanvas`）
3. 使用画布坐标设置关节锚点

### 5. 关节工具缺少视觉反馈
**问题**: 
- 选择第一个物体后，不清楚已选择

**修复**:
- 高亮显示第一个选中的物体（橙色虚线边框）
- 绘制锚点位置（橙色圆点）
- 从锚点到鼠标位置画虚线预览

---

## 📦 数据结构

### Joint 接口（已扩展）
```typescript
interface Joint {
  id: string;
  type: 'joint';
  jointType: JointType;
  bodyAId: string;
  bodyBId: string;
  anchorALocal: Vector2;   // Body A 局部坐标（米）
  anchorBLocal: Vector2;   // Body B 局部坐标（米）
  
  // 角度限制
  enableLimit?: boolean;
  lowerAngle?: number;     // 弧度
  upperAngle?: number;     // 弧度
  
  // 马达控制
  enableMotor?: boolean;
  motorSpeed?: number;     // rad/s
  maxMotorTorque?: number; // 最大扭矩
  
  // 其他
  collideConnected?: boolean;
}
```

### 预览状态变量
```typescript
private isPreviewMode = false;
private box2dWorld: any = null;
private box2dBodies: Map<string, any> = new Map();
private box2dJoints: Map<string, any> = new Map();
private previewAnimationId: number | null = null;
private previewPaused = false;
private previewOriginalState: Array<{
  id: string, 
  position: Vector2, 
  angle: number
}> = [];
```

---

## 🎨 用户界面

### 预览控制栏（HTML）
```html
<div id="preview-controls" class="preview-controls" style="display: none;">
  <button id="btn-preview-play" class="btn btn-small">▶ 播放</button>
  <button id="btn-preview-pause" class="btn btn-small" style="display: none;">⏸ 暂停</button>
  <button id="btn-preview-reset" class="btn btn-small">🔄 重置</button>
  <button id="btn-preview-exit" class="btn btn-small btn-danger">✕ 退出预览</button>
</div>
```

### 关节属性面板（动态生成）
```html
<!-- 角度限制 -->
<input type="checkbox" id="prop-enableLimit">
<input type="number" id="prop-lowerAngle" step="5">  <!-- 度 -->
<input type="number" id="prop-upperAngle" step="5">  <!-- 度 -->

<!-- 马达控制 -->
<input type="checkbox" id="prop-enableMotor">
<input type="number" id="prop-motorSpeed" step="0.1">    <!-- rad/s -->
<input type="number" id="prop-maxMotorTorque" step="100"> <!-- 扭矩 -->

<!-- 其他 -->
<input type="checkbox" id="prop-collideConnected">
```

### CSS 样式（禁用状态）
```css
.tool-btn:disabled,
.tool-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## 🎮 使用流程

### 创建关节
1. 点击"关节"工具按钮
2. 点击第一个物体（选择锚点位置）
3. 看到橙色高亮和虚线预览
4. 点击第二个物体（选择第二个锚点）
5. 关节创建成功

### 配置关节
1. 选择关节（点击关节图标）
2. 在属性面板中：
   - ✅ 启用角度限制 → 设置上下限（-90° 到 90°）
   - ✅ 启用马达 → 设置速度（如 1.0 rad/s）和扭矩（如 1000）
   - ✅ 允许碰撞 → 勾选"允许连接物体碰撞"

### 物理预览
1. 按 **空格键** 或点击"预览"按钮
2. 观察物体受重力影响和关节运动
3. 使用控制栏：
   - **暂停**: 冻结模拟
   - **播放**: 继续模拟
   - **重置**: 恢复初始状态并重新开始
   - **退出**: 退出预览模式
4. 按 **ESC** 键快速退出

---

## 🔍 调试信息

### 控制台输出
```
开始物理预览...
Box2D 版本: Flash 移植版
关节 joint_xxx 锚点: 局部(0.50, 0.00) -> 世界(3.00, 2.00) -> 画布(560, 420)
关节 joint_xxx 角度限制: -90° 到 90°
关节 joint_xxx 马达: 速度=1.00 rad/s, 扭矩=1000
Box2D 世界已创建: 3 个物体, 1 个关节
```

### 状态栏提示
```
关节工具 | 已选择物体 body_abc..., 请选择第二个刚体
关节工具 | ❌ 不能连接同一个物体！请选择另一个刚体
关节工具 | ✓ 关节已创建！
物理预览模式 | 物体数: 3 | 按 ESC 或点击退出
```

---

## 📊 性能考虑

### 优化措施
1. **状态保存**: 只保存位置和角度，不保存整个对象
2. **按需渲染**: 暂停时停止渲染循环
3. **中键平移**: 预览期间仍可调整视图
4. **坐标缓存**: 避免重复计算坐标转换

### 已知限制
1. **大型场景**: 100+ 物体可能有性能影响
2. **复杂多边形**: 顶点过多会增加计算量
3. **高频马达**: 极高转速可能导致不稳定

---

## 📚 相关文档

- `BOX2D_OLD_API_FIX.md` - 旧版 API 完整对比
- `BOX2D_OLD_API_CONVERSION_COMPLETE.md` - API 转换记录
- `PREVIEW_BUTTONS_FIX.md` - 按钮问题修复
- `COORDINATE_SYSTEM_REFERENCE.md` - 坐标系统参考
- `PHYSICS_PREVIEW_GUIDE.md` - 物理预览指南

---

## ✅ 测试检查清单

### 基础功能
- [x] 空格键开始预览
- [x] ESC 键退出预览
- [x] 暂停/继续按钮工作正常
- [x] 重置恢复初始状态
- [x] 退出恢复初始状态

### 物体类型
- [x] 矩形正确显示和碰撞
- [x] 圆形正确显示和碰撞
- [x] 多边形正确显示和碰撞
- [x] 静态物体不受重力影响
- [x] 动态物体正常下落

### 关节功能
- [x] 关节连接两个物体
- [x] 关节围绕锚点旋转
- [x] 角度限制生效
- [x] 马达驱动旋转
- [x] 防止同一物体自连接

### 编辑保护
- [x] 预览期间无法选择物体
- [x] 预览期间无法移动物体
- [x] 预览期间无法创建新物体
- [x] 预览期间无法删除物体
- [x] 预览期间工具栏按钮禁用
- [x] 预览期间中键平移仍可用

### 视觉反馈
- [x] 关节选择时高亮物体
- [x] 关节创建时显示虚线预览
- [x] 预览按钮状态正确显示
- [x] 状态栏提示清晰明确

---

## 🎉 总结

物理预览功能现已完整实现！包括：

1. ✅ 完整的 Box2D 物理引擎集成（旧版 API）
2. ✅ 支持所有形状和物体类型
3. ✅ 完整的关节系统（角度限制 + 马达控制）
4. ✅ 状态保存和恢复
5. ✅ 编辑保护和用户体验优化
6. ✅ 详细的错误检查和提示
7. ✅ 关节创建视觉反馈

用户现在可以：
- 创建复杂的物理场景（刚体 + 关节）
- 实时预览物理行为
- 调整关节属性（角度限制、马达速度）
- 随时暂停、重置或退出预览
- 在预览中使用中键平移视图

所有功能经过测试，坐标转换正确，物理模拟稳定可靠！🚀
