# 物理预览视图控制修复

## 修复时间
2025年10月14日

## 问题描述

用户反馈在物理预览模式下，视图拖动和缩放存在以下问题：

1. **视图拖动错位**：在预览时使用中键拖动视图，物体位置会出现偏移
2. **缩放导致错位**：在预览时使用滚轮缩放，物体会跳到错误的位置
3. **启动时重置视角**：用户希望启动预览时保持当前的视图位置和缩放

---

## 问题根源

### 坐标系不一致问题

物理预览系统涉及两个坐标系统：

1. **我们的坐标系统**（用于绘制和编辑）
   - 单位：米（m）
   - 原点：可配置（`ORIGIN_OFFSET_X`, `ORIGIN_OFFSET_Y`）
   - 缩放：可配置（`PPM` = 像素/米）
   - Y 轴：向上为正

2. **Box2D 的坐标系统**（物理模拟）
   - 单位：像素（px）
   - 原点：画布中心
   - 缩放：固定（创建物体时确定）
   - Y 轴：向下为正（旧版 Box2D）

### 问题分析

```
创建阶段（startPreview）:
  世界坐标 (米) --[使用 PPM₀, ORIGIN_OFFSET₀]--> 画布坐标 (像素) --> Box2D 创建物体

模拟阶段（每帧）:
  Box2D 物理计算 --> Box2D 位置 (像素)
  
同步阶段（syncBox2DToObjects）:
  Box2D 位置 (像素) --[使用 PPM₁, ORIGIN_OFFSET₁]--> 世界坐标 (米) --> 更新我们的 objects

渲染阶段（render）:
  objects 世界坐标 (米) --[使用 PPM₂, ORIGIN_OFFSET₂]--> 画布坐标 (像素) --> 绘制
```

**问题所在**：

- 如果 `PPM₀ ≠ PPM₁` 或 `ORIGIN_OFFSET₀ ≠ ORIGIN_OFFSET₁`，同步阶段的转换就会错误
- 如果用户在预览时拖动或缩放视图，就会改变 `PPM` 和 `ORIGIN_OFFSET`
- 结果：物体位置计算错误，导致视觉上的错位

---

## 解决方案

### 1. 保存坐标系快照

在启动预览时，保存当前的坐标系参数：

```typescript
// 在 startPreview() 中
this.previewPPM = PPM;
this.previewOriginOffsetX = ORIGIN_OFFSET_X;
this.previewOriginOffsetY = ORIGIN_OFFSET_Y;
```

### 2. 使用快照进行 Box2D 同步

在 `syncBox2DToObjects()` 中，使用保存的参数而不是当前参数：

```typescript
private syncBox2DToObjects(): void {
  for (const [id, b2Body] of this.box2dBodies.entries()) {
    const body = this.objects.find(o => o.id === id) as Body;
    if (body) {
      const pos = b2Body.m_position;
      const angle = b2Body.m_rotation;
      
      // 使用保存的坐标系参数进行转换（而不是当前的 PPM 和 ORIGIN_OFFSET）
      const worldX = (pos.x - this.canvas.width / 2) / this.previewPPM + this.previewOriginOffsetX;
      const worldY = -(pos.y - this.canvas.height / 2) / this.previewPPM + this.previewOriginOffsetY;
      
      body.position.x = worldX;
      body.position.y = worldY;
      body.angle = -angle;
    }
  }
}
```

### 3. 禁用预览时的缩放

在 `onMouseWheel()` 中，预览模式下直接返回：

```typescript
private onMouseWheel(e: WheelEvent): void {
  e.preventDefault();
  
  // 预览模式下禁用缩放（避免坐标系不一致）
  if (this.isPreviewMode) {
    return;
  }
  
  // ... 缩放逻辑
}
```

### 4. 允许预览时的拖动

中键拖动不需要禁用，因为：
- 拖动只改变 `ORIGIN_OFFSET`，不改变 `PPM`
- `syncBox2DToObjects()` 使用保存的参数，不受当前拖动影响
- 渲染时使用当前的 `ORIGIN_OFFSET`，正确显示拖动后的视图

---

## 修复后的行为

### ✅ 启动预览时

- **保持当前缩放级别**：不会重置 `PPM`
- **保持当前视图位置**：不会重置 `ORIGIN_OFFSET_X/Y`
- **保存坐标系快照**：用于后续的 Box2D 同步

### ✅ 预览过程中

#### 允许的操作：
- ✅ **中键拖动视图**：可以移动视角观察不同区域
- ✅ **暂停/继续**：控制物理模拟
- ✅ **重置**：恢复物体到初始状态
- ✅ **退出**：返回编辑模式

#### 禁用的操作：
- ❌ **滚轮缩放**：避免坐标系不一致
- ❌ **编辑物体**：避免修改物理模拟中的场景
- ❌ **键盘快捷键**：除了 ESC 退出预览

### ✅ 物体位置同步

```
Box2D 计算 --> 画布坐标 (像素)
                    ↓
            使用保存的 previewPPM 和 previewOriginOffset
                    ↓
            世界坐标 (米) --> 更新 objects
                    ↓
            使用当前的 PPM 和 ORIGIN_OFFSET
                    ↓
            画布坐标 (像素) --> 绘制
```

---

## 技术细节

### 坐标转换公式

#### 世界坐标 → 画布坐标（创建 Box2D 物体时）
```typescript
canvasX = (worldX - ORIGIN_OFFSET_X) * PPM + canvas.width / 2
canvasY = -(worldY - ORIGIN_OFFSET_Y) * PPM + canvas.height / 2  // Y 轴翻转
```

#### 画布坐标 → 世界坐标（同步 Box2D 状态时）
```typescript
worldX = (canvasX - canvas.width / 2) / previewPPM + previewOriginOffsetX
worldY = -(canvasY - canvas.height / 2) / previewPPM + previewOriginOffsetY  // Y 轴翻转
```

**关键点**：
- 创建和同步使用**相同的**坐标系参数（保存的快照）
- 渲染使用**当前的**坐标系参数（支持视图拖动）

### 变量说明

```typescript
// 全局坐标系参数（用户可以实时修改）
let PPM = 20;                    // 当前的像素/米比例
let ORIGIN_OFFSET_X = 0;         // 当前的原点 X 偏移
let ORIGIN_OFFSET_Y = 0;         // 当前的原点 Y 偏移

// 预览模式的坐标系快照（启动预览时保存，用于 Box2D 同步）
private previewPPM = 20;              // 预览时的像素/米比例
private previewOriginOffsetX = 0;     // 预览时的原点 X 偏移
private previewOriginOffsetY = 0;     // 预览时的原点 Y 偏移
```

---

## 测试场景

### 场景 1: 启动预览保持视图
1. 创建几个物体
2. 缩放视图（滚轮调整 PPM）
3. 拖动视图（中键调整 ORIGIN_OFFSET）
4. 启动物理预览
5. **预期**：视图位置和缩放级别保持不变

### 场景 2: 预览时拖动视图
1. 启动物理预览
2. 物体开始下落
3. 使用中键拖动视图跟随物体
4. **预期**：物体位置正确，没有抖动或错位

### 场景 3: 预览时尝试缩放
1. 启动物理预览
2. 尝试使用滚轮缩放
3. **预期**：缩放被禁用，视图不变

### 场景 4: 预览后退出
1. 启动物理预览
2. 在预览中拖动视图到其他位置
3. 退出预览
4. **预期**：
   - 物体位置恢复到预览前状态
   - 视图位置保持在拖动后的位置

### 场景 5: 复杂场景测试
1. 创建 10+ 个物体，包含静态和动态
2. 添加多个关节
3. 调整视图到合适位置
4. 启动预览
5. 在预览中拖动视图观察不同区域
6. **预期**：所有物体和关节行为正确，没有位置错误

---

## 相关文件

### 主要修改
- `src/main.ts`
  - 添加 `previewPPM`, `previewOriginOffsetX`, `previewOriginOffsetY` 成员变量
  - 修改 `startPreview()`: 保存坐标系快照
  - 修改 `syncBox2DToObjects()`: 使用快照参数进行转换
  - 修改 `onMouseWheel()`: 预览时禁用缩放

### 相关文档
- `PHYSICS_PREVIEW_COMPLETE.md` - 物理预览完整文档
- `BOX2D_OLD_API_FIX.md` - Box2D 旧版 API 说明
- `COORDINATE_SYSTEM.md` - 坐标系统详细说明

---

## 已知限制

### 1. 预览时无法缩放
**原因**：缩放会改变 `PPM`，导致坐标系不一致

**替代方案**：
- 退出预览，调整缩放，再次进入预览
- 或者在预览前调整好合适的缩放级别

### 2. 拖动视图后物体可能不在视野内
**原因**：拖动只移动视图，不影响物理模拟

**解决**：
- 预览时物体会继续按物理规律运动
- 可以继续拖动视图跟随物体
- 或者使用"重置"按钮重新开始模拟

---

## 未来改进

### 可能的增强功能

1. **预览时支持缩放**
   - 需要在缩放时重新创建所有 Box2D 物体
   - 或者实现真正的世界坐标系 Box2D（需要大量重构）

2. **自动跟随物体**
   - 可以添加"跟随模式"，视图自动移动跟随选中的物体
   - 类似游戏中的相机跟随

3. **小地图预览**
   - 在预览时显示一个小地图
   - 显示所有物体的位置和当前视图范围

4. **慢动作/快进**
   - 调整物理模拟的时间步长
   - 方便观察快速或缓慢的运动

---

## 总结

通过保存坐标系快照并在 Box2D 同步时使用保存的参数，我们解决了预览时视图控制的所有问题：

✅ **启动预览不重置视角** - 保持用户当前的视图设置
✅ **拖动视图正常工作** - 使用坐标系快照确保同步正确
✅ **禁用预览时缩放** - 避免坐标系参数不一致
✅ **物体位置始终正确** - 创建和同步使用相同的坐标系参数

这些修复确保了物理预览功能的稳定性和可用性！🎉
