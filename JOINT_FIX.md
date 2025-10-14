# 关节系统修复文档

## 🎯 修复的问题

### 问题 1：锚点不跟随 Body 移动
**原因**：关节的锚点使用世界坐标存储，当 Body 移动或旋转时，锚点位置不会更新。

**解决方案**：
- 将锚点从世界坐标改为局部坐标存储
- 渲染时动态计算世界坐标位置
- 添加 `localToWorld()` 辅助函数进行坐标转换

### 问题 2：关节无法选中和编辑
**原因**：`hitTest()` 函数只检测 Body，忽略了 Joint。

**解决方案**：
- 扩展 `hitTest()` 函数，优先检测关节的锚点
- 锚点点击范围扩大到 8 像素，便于精确选择
- 选中后显示白色边框高亮

### 问题 3：属性面板无法编辑关节参数
**原因**：虽然代码已经有了属性编辑功能，但缺少锚点位置编辑。

**解决方案**：
- 添加锚点位置（局部坐标）编辑字段
- 所有关节参数都可编辑（包括长度）
- 属性修改支持撤销/重做

---

## 📝 实现细节

### 1. 类型定义更新

**之前**：
```typescript
interface Joint {
  anchorAWorld: Vector2;  // 世界坐标
  anchorBWorld: Vector2;  // 世界坐标
}
```

**之后**：
```typescript
interface Joint {
  anchorALocal: Vector2;  // Body A 的局部坐标
  anchorBLocal: Vector2;  // Body B 的局部坐标
}
```

### 2. 坐标转换函数

```typescript
// 世界坐标 → 局部坐标
function worldToLocal(
  worldX: number, worldY: number,
  bodyX: number, bodyY: number, bodyAngle: number
): Vector2

// 局部坐标 → 世界坐标
function localToWorld(
  localX: number, localY: number,
  bodyX: number, bodyY: number, bodyAngle: number
): Vector2
```

### 3. 创建关节时的坐标转换

```typescript
private createJoint(bodyA: Body, bodyB: Body, anchorA: Vector2, anchorB: Vector2) {
  // 用户点击的是世界坐标，转换为局部坐标存储
  const anchorALocal = worldToLocal(
    anchorA.x, anchorA.y,
    bodyA.position.x, bodyA.position.y, bodyA.angle
  );
  const anchorBLocal = worldToLocal(
    anchorB.x, anchorB.y,
    bodyB.position.x, bodyB.position.y, bodyB.angle
  );
  
  // 存储局部坐标
  const joint = {
    anchorALocal,
    anchorBLocal,
    // ...
  };
}
```

### 4. 渲染时的坐标转换

```typescript
private renderJoint(joint: Joint) {
  const bodyA = findBody(joint.bodyAId);
  const bodyB = findBody(joint.bodyBId);
  
  // 渲染时将局部坐标转换为世界坐标
  const anchorAWorld = localToWorld(
    joint.anchorALocal.x, joint.anchorALocal.y,
    bodyA.position.x, bodyA.position.y, bodyA.angle
  );
  const anchorBWorld = localToWorld(
    joint.anchorBLocal.x, joint.anchorBLocal.y,
    bodyB.position.x, bodyB.position.y, bodyB.angle
  );
  
  // 使用世界坐标绘制
  ctx.moveTo(anchorAWorld.x, anchorAWorld.y);
  ctx.lineTo(anchorBWorld.x, anchorBWorld.y);
}
```

### 5. 关节选择检测

```typescript
private hitTest(x: number, y: number): MapObject | null {
  // 优先检测关节（更精确）
  for (const joint of joints) {
    const anchorAWorld = localToWorld(/*...*/);
    const anchorBWorld = localToWorld(/*...*/);
    
    // 检测是否点击了锚点（8像素范围）
    if (distance(x, y, anchorAWorld.x, anchorAWorld.y) <= 8 ||
        distance(x, y, anchorBWorld.x, anchorBWorld.y) <= 8) {
      return joint;
    }
  }
  
  // 然后检测刚体
  // ...
}
```

### 6. 属性面板增强

新增字段：
```html
<div class="property-group">
  <div class="property-group-title">锚点位置（局部坐标）</div>
  <div class="property-field">
    <label>锚点 A - X</label>
    <input type="number" id="prop-anchorALocalX" value="0.0" step="1">
  </div>
  <div class="property-field">
    <label>锚点 A - Y</label>
    <input type="number" id="prop-anchorALocalY" value="0.0" step="1">
  </div>
  <div class="property-field">
    <label>锚点 B - X</label>
    <input type="number" id="prop-anchorBLocalX" value="0.0" step="1">
  </div>
  <div class="property-field">
    <label>锚点 B - Y</label>
    <input type="number" id="prop-anchorBLocalY" value="0.0" step="1">
  </div>
</div>
```

### 7. 锚点编辑事件绑定

```typescript
private bindJointPropertyEvents() {
  // 编辑锚点 A 的 X 坐标
  document.getElementById('prop-anchorALocalX').addEventListener('input', (e) => {
    const newValue = { 
      x: parseFloat(e.target.value), 
      y: joint.anchorALocal.y 
    };
    // 使用命令模式支持撤销
    const cmd = new ModifyPropertyCommand(
      joint,
      'anchorALocal',
      oldValue,
      newValue,
      () => { this.render(); this.updatePropertyPanel(); }
    );
    this.commandHistory.execute(cmd);
  });
  
  // 其他锚点坐标类似...
}
```

### 8. 🎯 鼠标拖动锚点（新增）

#### 检测锚点点击

```typescript
private hitTestAnchor(x: number, y: number): { joint: Joint; isAnchorA: boolean } | null {
  for (const joint of joints) {
    const anchorAWorld = localToWorld(/*...*/);
    const anchorBWorld = localToWorld(/*...*/);
    
    // 优先检测锚点 A
    if (distance(x, y, anchorAWorld.x, anchorAWorld.y) <= 8) {
      return { joint, isAnchorA: true };
    }
    // 然后检测锚点 B
    if (distance(x, y, anchorBWorld.x, anchorBWorld.y) <= 8) {
      return { joint, isAnchorA: false };
    }
  }
  return null;
}
```

#### 开始拖动

```typescript
private handleSelectMouseDown(pos: Vector2) {
  // 首先检测是否点击了锚点
  const anchorHit = this.hitTestAnchor(pos.x, pos.y);
  if (anchorHit) {
    this.draggingAnchor = anchorHit;
    this.anchorStartPos = { x: anchor.x, y: anchor.y }; // 记录初始位置
    return;
  }
  
  // 否则检测普通对象...
}
```

#### 拖动过程

```typescript
private onMouseMove(pos: Vector2) {
  if (this.draggingAnchor) {
    const { joint, isAnchorA } = this.draggingAnchor;
    const body = findBody(isAnchorA ? joint.bodyAId : joint.bodyBId);
    
    // 将世界坐标转换为 body 的局部坐标
    const localPos = worldToLocal(pos.x, pos.y, body.position.x, body.position.y, body.angle);
    
    // 更新锚点
    if (isAnchorA) {
      joint.anchorALocal = localPos;
    } else {
      joint.anchorBLocal = localPos;
    }
    
    // 距离关节自动更新长度
    if (joint.jointType === 'distance') {
      joint.length = calculateDistance(anchorAWorld, anchorBWorld);
    }
    
    this.render();
  }
}
```

#### 结束拖动

```typescript
private onMouseUp() {
  if (this.draggingAnchor && this.anchorStartPos) {
    const { joint, isAnchorA } = this.draggingAnchor;
    const anchor = isAnchorA ? joint.anchorALocal : joint.anchorBLocal;
    const oldValue = this.anchorStartPos;
    const newValue = { x: anchor.x, y: anchor.y };
    
    // 只有真正移动了才记录命令（支持撤销）
    if (oldValue.x !== newValue.x || oldValue.y !== newValue.y) {
      const cmd = new ModifyPropertyCommand(/*...*/);
      this.commandHistory.execute(cmd);
    }
    
    this.draggingAnchor = null;
    this.anchorStartPos = null;
    this.updatePropertyPanel(); // 更新显示
  }
}
```

#### 视觉反馈

```typescript
// 渲染时检测是否正在拖动
const isDraggingAnchorA = this.draggingAnchor && 
                          this.draggingAnchor.joint === joint && 
                          this.draggingAnchor.isAnchorA;

// 拖动中的锚点：
// - 半径变大（6px → 8px）
// - 绿色边框高亮
// - 边框变粗（2px → 3px）
ctx.arc(anchorX, anchorY, isDragging ? 8 : 6, 0, Math.PI * 2);
ctx.strokeStyle = isDragging ? '#00ff00' : '#fff';
ctx.lineWidth = isDragging ? 3 : 2;
```

---

## 🎨 视觉改进

### 关节渲染增强

**选中状态**：
- 连线变粗（2px → 3px）
- 连线颜色变为绿色高亮
- 锚点变大（4px → 6px）
- 锚点添加白色边框

**未选中状态**：
- 距离关节：橙色 (#e67e22)
- 旋转关节：红色 (#e74c3c)
- 标准粗细和大小

### 选择反馈

```typescript
// 扩大点击范围到 8 像素
if (distance(mouseX, mouseY, anchorX, anchorY) <= 8) {
  return joint;
}
```

---

## ✅ 功能验证

### 测试场景

1. **创建关节并移动 Body**
   - 创建两个刚体
   - 用关节连接它们
   - 移动或旋转任一刚体
   - ✅ 关节锚点应该跟随移动

2. **选择关节**
   - 点击关节的锚点
   - ✅ 关节应该被选中并高亮显示
   - ✅ 属性面板显示关节信息

3. **拖动锚点（新增）**
   - 选中关节
   - 点击并拖动任一锚点
   - ✅ 锚点应该跟随鼠标移动
   - ✅ 锚点变大并显示绿色高亮
   - ✅ 距离关节长度自动更新
   - ✅ 松开鼠标后属性面板更新
   - ✅ 支持撤销/重做

4. **编辑关节属性**
   - 选中关节
   - 修改锚点位置（输入框）
   - 修改物理参数（频率、阻尼等）
   - ✅ 修改应该实时生效
   - ✅ 支持撤销/重做

5. **删除关节**
   - 选中关节
   - 按 Delete 键或点击删除按钮
   - ✅ 关节应该被删除
   - ✅ 支持撤销

6. **导出 Box2D**
   - 创建场景并导出 JSON
   - ✅ 锚点应该以局部坐标导出
   - ✅ 符合 Box2D 标准格式

---

## 📊 技术优势

### 1. 正确的物理语义
- 使用局部坐标符合 Box2D 规范
- 锚点随刚体变换自动更新
- 导出的数据可直接用于物理引擎

### 2. 更好的用户体验
- 关节可以独立选择和编辑
- 视觉反馈清晰明确
- 精确的点击检测
- **直接拖动锚点调整位置**
- **拖动时实时视觉反馈**
- **自动更新距离关节长度**

### 3. 完整的编辑功能
- 所有参数都可编辑
- 支持撤销/重做
- 属性面板组织清晰

### 4. 代码质量
- 坐标转换逻辑清晰
- 函数职责单一
- 易于维护和扩展

---

## 🔄 向后兼容

### 旧数据迁移

如果加载旧格式的 JSON（使用 `anchorAWorld` / `anchorBWorld`），需要添加迁移代码：

```typescript
function migrateOldJointFormat(joint: any, bodyA: Body, bodyB: Body): Joint {
  return {
    ...joint,
    anchorALocal: worldToLocal(
      joint.anchorAWorld.x, joint.anchorAWorld.y,
      bodyA.position.x, bodyA.position.y, bodyA.angle
    ),
    anchorBLocal: worldToLocal(
      joint.anchorBWorld.x, joint.anchorBWorld.y,
      bodyB.position.x, bodyB.position.y, bodyB.angle
    )
  };
}
```

---

## 🚀 后续改进建议

### 1. ✅ 可视化拖动锚点（已实现）
- 直接在画布上拖动锚点改变位置
- 实时显示距离和角度
- 拖动时锚点变大并显示绿色高亮
- 支持撤销/重做

### 2. 锚点吸附
- 自动吸附到刚体的边缘或中心
- 智能建议合理的锚点位置

### 3. 更多关节类型
- Prismatic Joint（滑动关节）
- Pulley Joint（滑轮关节）
- Gear Joint（齿轮关节）
- Weld Joint（焊接关节）

### 4. 关节模板
- 预设常用的关节配置
- 一键创建复杂机械结构

---

**修复完成日期**: 2024-01  
**修复人**: GitHub Copilot  
**相关文件**: `src/main.ts`
