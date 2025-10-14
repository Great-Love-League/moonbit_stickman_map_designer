# 多边形物体 Box2D 创建修复

## 问题时间
2025年10月14日

## 问题描述

当关节连接到多边形物体时，关节创建失败。实际原因是多边形物体本身没有被正确创建到 Box2D 世界中。

### 错误表现
- 场景中有多边形物体，但在 Box2D 中创建失败
- 控制台显示物体创建失败，返回 null
- 连接到这些多边形的关节也无法创建（找不到 bodyA 或 bodyB）

---

## 根本原因

### 旧版 Box2D API 的多边形顶点设置方式

在旧版 Box2D Flash API 中，`b2PolyDef.vertices` 是一个**预初始化的数组**，数组中的每个元素都是 `b2Vec2` 对象。

**错误的方式**（我们之前的代码）:
```javascript
shapeDef.vertices[i] = { x: vx, y: vy };  // ❌ 直接赋值对象
```

**正确的方式**（官方 demo 的代码）:
```javascript
shapeDef.vertices[i].Set(vx, vy);  // ✅ 使用 Set() 方法
```

### 为什么会出错？

1. **旧版 API 设计**：
   - `b2PolyDef` 构造函数会预先创建顶点数组
   - 数组中已经有 `b2Vec2` 实例
   - 我们应该调用这些实例的 `Set()` 方法，而不是替换它们

2. **直接赋值的后果**：
   - 破坏了 Box2D 内部的对象引用
   - 导致多边形形状无效
   - `CreateBody()` 返回 null

---

## 解决方案

### 修复前的代码

```typescript
if (!shapeDef.vertices) shapeDef.vertices = [];
shapeDef.vertices[i] = {
  x: v.x * this.previewPPM,
  y: -v.y * this.previewPPM
};
```

### 修复后的代码

```typescript
// 使用 Set() 方法（旧版 API 要求）
shapeDef.vertices[i].Set(
  v.x * this.previewPPM,
  -v.y * this.previewPPM
);
```

### 完整的多边形创建代码

```typescript
else if (body.shapeType === 'polygon' && body.vertices && body.vertices.length >= 3) {
  shapeDef = new b2PolyDef();
  shapeDef.vertexCount = body.vertices.length;
  
  console.log(`  - 准备创建多边形: ${body.vertices.length} 个顶点`);
  
  // 多边形顶点（相对于物体中心）
  // 重要：使用保存的 PPM 参数
  // 注意：旧版 Box2D 需要使用 .Set() 方法设置顶点！
  for (let i = 0; i < body.vertices.length; i++) {
    const v = body.vertices[i];
    
    const vx = v.x * this.previewPPM;
    const vy = -v.y * this.previewPPM;  // Y 轴翻转（我们的 Y 向上，Box2D 旧版 Y 向下）
    
    // 使用 Set() 方法（旧版 API 要求）
    shapeDef.vertices[i].Set(vx, vy);
    console.log(`    顶点[${i}]: 局部(${v.x.toFixed(2)}, ${v.y.toFixed(2)}) -> Box2D(${vx.toFixed(2)}, ${vy.toFixed(2)})`);
  }
  
  console.log(`  - 多边形顶点已设置 [使用保存的 PPM=${this.previewPPM}]`);
}
```

---

## 旧版 Box2D API 参考

### 官方 Demo 示例

来自 `public/box2d-js/demos/compound.js`:

```javascript
var points = [[-30, 0], [30, 0], [0, 15]];
var polySd1 = new b2PolyDef();
polySd1.vertexCount = points.length;

for (var i = 0; i < points.length; i++) {
    polySd1.vertices[i].Set(points[i][0], points[i][1]);  // ✅ 使用 Set()
}

polySd1.density = 1.0;
// ... 其他设置
```

### b2Vec2 对象方法

旧版 Box2D 的 `b2Vec2` 有 `Set()` 方法：

```javascript
// b2Vec2 构造
var vec = new b2Vec2(x, y);

// Set() 方法
vec.Set(newX, newY);  // 修改现有向量

// 属性访问
vec.x;  // 读取 x 坐标
vec.y;  // 读取 y 坐标
```

---

## 其他坐标系修复

在同一次修复中，我们还修正了以下问题：

### 1. 物体位置转换使用保存的坐标系

**问题**：创建 Box2D 物体时使用当前的 `PPM` 和 `ORIGIN_OFFSET`，但这些值可能已经被用户拖动视图改变。

**修复**：使用保存的 `previewPPM`、`previewOriginOffsetX`、`previewOriginOffsetY`

```typescript
// 修复前
const canvasPos = box2DToCanvas(body.position.x, body.position.y, ...);

// 修复后
const canvasX = (body.position.x - this.previewOriginOffsetX) * this.previewPPM + this.canvas.width / 2;
const canvasY = -(body.position.y - this.previewOriginOffsetY) * this.previewPPM + this.canvas.height / 2;
```

### 2. 形状大小使用保存的 PPM

**矩形**:
```typescript
const halfWidth = body.width * this.previewPPM / 2;
const halfHeight = body.height * this.previewPPM / 2;
```

**圆形**:
```typescript
shapeDef.radius = body.radius * this.previewPPM;
```

**多边形**:
```typescript
const vx = v.x * this.previewPPM;
const vy = -v.y * this.previewPPM;
```

### 3. 关节锚点转换使用保存的坐标系

```typescript
const anchorCanvasX = (anchorAWorld.x - this.previewOriginOffsetX) * this.previewPPM + this.canvas.width / 2;
const anchorCanvasY = -(anchorAWorld.y - this.previewOriginOffsetY) * this.previewPPM + this.canvas.height / 2;
```

---

## 测试验证

### 测试场景 1: 简单多边形
1. 创建一个三角形或四边形多边形
2. 启动物理预览
3. **预期**: 多边形正确显示和模拟

### 测试场景 2: 多边形关节
1. 创建两个多边形物体
2. 用旋转关节连接它们
3. 启动物理预览
4. **预期**: 关节正常工作，多边形可以旋转

### 测试场景 3: 混合物体关节
1. 创建多边形、矩形、圆形
2. 用关节连接它们
3. 启动物理预览
4. **预期**: 所有关节都能正常工作

### 测试场景 4: 重置后的多边形
1. 创建多边形并连接关节
2. 启动预览
3. 拖动视图（改变 ORIGIN_OFFSET）
4. 重置预览（多次）
5. **预期**: 每次重置后多边形都能正确创建

---

## 调试日志

修复后的日志输出示例：

```
创建 Box2D Body: id=body_xxx, type=dynamic, shape=polygon
  - 准备创建多边形: 4 个顶点
    顶点[0]: 局部(-2.00, -1.00) -> Box2D(-40.00, 20.00)
    顶点[1]: 局部(2.00, -1.00) -> Box2D(40.00, 20.00)
    顶点[2]: 局部(2.00, 1.00) -> Box2D(40.00, -20.00)
    顶点[3]: 局部(-2.00, 1.00) -> Box2D(-40.00, -20.00)
  - 多边形顶点已设置 [使用保存的 PPM=20]
  - 物理属性: density=1, friction=0.5, restitution=0.3
  - 位置: 世界(5.00, 10.00) -> 画布(600, 300) [使用保存的坐标系]
  - 角度: 0.0° -> Box2D -0.0°
✅ Body body_xxx 创建成功
```

---

## 相关问题修复

这次修复同时解决了以下问题：

1. ✅ **多边形创建失败** - 使用正确的 `Set()` 方法
2. ✅ **关节找不到 body** - 物体创建成功后，关节可以找到它们
3. ✅ **重置后位置错误** - 使用保存的坐标系参数
4. ✅ **视图拖动后错位** - 创建和同步使用相同的坐标系
5. ✅ **多次重置后失败** - 正确清理和重建 Box2D 世界

---

## 经验总训

### 1. 仔细阅读官方示例
旧版 Box2D 的 API 与现代版本差异很大，必须参考官方 demo 代码。

### 2. 对象方法 vs 直接赋值
旧版 API 更倾向于使用方法（如 `Set()`），而不是直接修改属性。

### 3. 坐标系一致性
创建、同步、渲染必须使用一致的坐标系参数。

### 4. 详细的调试日志
对于复杂的物理系统，详细的日志是必不可少的调试工具。

---

## 总结

通过使用正确的 `vertices[i].Set()` 方法，多边形物体现在可以正确创建到 Box2D 世界中。结合坐标系修复，整个物理预览系统现在能够稳定处理所有类型的物体（矩形、圆形、多边形）和关节，即使在多次重置和视图拖动后也能正常工作。

✅ **多边形物体创建成功**
✅ **关节可以连接到多边形**  
✅ **重置功能稳定**
✅ **坐标系保持一致**

🎉 物理预览功能现在完全可用！
