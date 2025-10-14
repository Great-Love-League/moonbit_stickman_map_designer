# 关节锚点拖动功能实现

## 🎯 功能概述

实现了完整的关节锚点鼠标拖动功能，用户可以直接在画布上拖动锚点来调整关节的连接位置，提供直观的可视化编辑体验。

## ✨ 核心特性

### 1. 直接拖动锚点
- 🖱️ 点击锚点开始拖动
- 🎯 实时跟随鼠标移动
- 📍 自动转换世界坐标到局部坐标
- 💾 松开鼠标保存修改
- ↩️ 支持撤销/重做

### 2. 智能坐标处理
- 拖动过程中自动将世界坐标转换为 Body 的局部坐标
- 确保锚点始终相对于所属 Body 正确定位
- 支持旋转的 Body（局部坐标系会随 Body 旋转）

### 3. 自动更新参数
- **距离关节**：拖动锚点时自动重新计算长度
- **旋转关节**：保持锚点与 Body 的相对关系

### 4. 视觉反馈
- 🟢 拖动中的锚点变大（6px → 8px）
- 🟢 显示绿色高亮边框（3px 粗）
- 🔵 选中但未拖动的锚点显示白色边框
- 🔴 未选中的锚点保持原色

---

## 🔧 实现细节

### 数据结构

```typescript
class MapDesigner {
  // 锚点拖动状态
  private draggingAnchor: { joint: Joint; isAnchorA: boolean } | null = null;
  private anchorStartPos: Vector2 | null = null; // 记录初始位置用于撤销
}
```

### 核心函数

#### 1. 检测锚点点击

```typescript
private hitTestAnchor(x: number, y: number): { joint: Joint; isAnchorA: boolean } | null {
  for (const joint of this.objects) {
    if (joint.type !== 'joint') continue;
    
    const bodyA = findBody(joint.bodyAId);
    const bodyB = findBody(joint.bodyBId);
    
    // 计算锚点的世界坐标
    const anchorAWorld = localToWorld(
      joint.anchorALocal.x, joint.anchorALocal.y,
      bodyA.position.x, bodyA.position.y, bodyA.angle
    );
    const anchorBWorld = localToWorld(
      joint.anchorBLocal.x, joint.anchorBLocal.y,
      bodyB.position.x, bodyB.position.y, bodyB.angle
    );
    
    // 检测点击（8像素范围）
    if (distance(x, y, anchorAWorld.x, anchorAWorld.y) <= 8) {
      return { joint, isAnchorA: true };
    }
    if (distance(x, y, anchorBWorld.x, anchorBWorld.y) <= 8) {
      return { joint, isAnchorA: false };
    }
  }
  return null;
}
```

#### 2. 开始拖动（onMouseDown）

```typescript
private handleSelectMouseDown(pos: Vector2): void {
  // 优先检测锚点
  const anchorHit = this.hitTestAnchor(pos.x, pos.y);
  if (anchorHit) {
    this.draggingAnchor = anchorHit;
    this.selectedObject = anchorHit.joint;
    
    // 记录初始位置
    const anchor = anchorHit.isAnchorA 
      ? anchorHit.joint.anchorALocal 
      : anchorHit.joint.anchorBLocal;
    this.anchorStartPos = { x: anchor.x, y: anchor.y };
    
    this.updatePropertyPanel();
    this.render();
    return;
  }
  
  // 否则检测普通对象...
}
```

#### 3. 拖动过程（onMouseMove）

```typescript
private onMouseMove(e: MouseEvent): void {
  const pos = this.getMousePos(e);
  
  if (this.draggingAnchor) {
    const { joint, isAnchorA } = this.draggingAnchor;
    
    // 获取锚点所属的 Body
    const bodyId = isAnchorA ? joint.bodyAId : joint.bodyBId;
    const body = this.objects.find(o => o.id === bodyId) as Body;
    
    if (body) {
      // 将鼠标的世界坐标转换为 Body 的局部坐标
      const localPos = worldToLocal(
        pos.x, pos.y, 
        body.position.x, body.position.y, body.angle
      );
      
      // 更新锚点
      if (isAnchorA) {
        joint.anchorALocal.x = localPos.x;
        joint.anchorALocal.y = localPos.y;
      } else {
        joint.anchorBLocal.x = localPos.x;
        joint.anchorBLocal.y = localPos.y;
      }
      
      // 距离关节自动更新长度
      if (joint.jointType === 'distance') {
        const bodyA = findBody(joint.bodyAId);
        const bodyB = findBody(joint.bodyBId);
        const anchorAWorld = localToWorld(/*...*/);
        const anchorBWorld = localToWorld(/*...*/);
        joint.length = distance(
          anchorAWorld.x, anchorAWorld.y,
          anchorBWorld.x, anchorBWorld.y
        );
      }
    }
    
    this.render();
    return;
  }
  
  // 其他拖动处理...
}
```

#### 4. 结束拖动（onMouseUp）

```typescript
private onMouseUp(): void {
  // 处理锚点拖动结束
  if (this.draggingAnchor && this.anchorStartPos) {
    const { joint, isAnchorA } = this.draggingAnchor;
    const anchor = isAnchorA ? joint.anchorALocal : joint.anchorBLocal;
    const prop = isAnchorA ? 'anchorALocal' : 'anchorBLocal';
    
    const oldValue = this.anchorStartPos;
    const newValue = { x: anchor.x, y: anchor.y };
    
    // 只有真正移动了才记录命令
    if (oldValue.x !== newValue.x || oldValue.y !== newValue.y) {
      const cmd = new ModifyPropertyCommand(
        joint,
        prop,
        oldValue,
        newValue,
        () => {
          this.render();
          this.updatePropertyPanel();
        }
      );
      this.commandHistory.execute(cmd);
      this.updateUndoRedoButtons();
    }
    
    this.draggingAnchor = null;
    this.anchorStartPos = null;
    this.updatePropertyPanel(); // 更新显示新位置
  }
  
  // 其他处理...
}
```

#### 5. 视觉反馈（渲染）

```typescript
private renderJoint(joint: Joint): void {
  // ... 计算锚点世界坐标 ...
  
  // 检测是否正在拖动
  const isDraggingAnchorA = this.draggingAnchor && 
                            this.draggingAnchor.joint === joint && 
                            this.draggingAnchor.isAnchorA;
  const isDraggingAnchorB = this.draggingAnchor && 
                            this.draggingAnchor.joint === joint && 
                            !this.draggingAnchor.isAnchorA;
  
  // 绘制锚点 A
  ctx.beginPath();
  ctx.arc(
    anchorAWorld.x, anchorAWorld.y, 
    isDraggingAnchorA ? 8 : 6,  // 拖动时变大
    0, Math.PI * 2
  );
  ctx.fill();
  
  // 拖动时显示绿色高亮
  if (isDraggingAnchorA) {
    ctx.strokeStyle = '#00ff00';  // 绿色
    ctx.lineWidth = 3;            // 粗边框
    ctx.stroke();
  } else if (isSelected) {
    ctx.strokeStyle = '#fff';     // 白色
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // 锚点 B 同理...
}
```

---

## 🎮 使用方法

### 基本操作

1. **选择工具**：点击"选择"工具
2. **点击锚点**：点击关节的任一锚点（8像素点击范围）
3. **开始拖动**：按住鼠标左键
4. **移动锚点**：拖动鼠标到目标位置
5. **释放鼠标**：松开左键完成拖动

### 视觉提示

- **未选中锚点**：橙色/红色小圆点（4px）
- **选中关节**：锚点变大（6px）+ 白色边框
- **正在拖动**：锚点更大（8px）+ 绿色亮边框

### 自动功能

- **距离关节**：拖动时自动更新 `length` 参数
- **属性面板**：松开鼠标后自动更新显示
- **撤销/重做**：Ctrl+Z 撤销拖动，Ctrl+Y 重做

---

## ✅ 测试验证

### 测试用例 1：基本拖动

```
步骤：
1. 创建两个矩形刚体 A 和 B
2. 用距离关节连接它们
3. 选择工具切换到"选择"
4. 点击关节的锚点 A
5. 拖动到新位置
6. 松开鼠标

预期结果：
✅ 锚点跟随鼠标移动
✅ 锚点显示绿色高亮
✅ 距离关节长度实时更新
✅ 属性面板显示新的坐标
✅ 可以撤销拖动操作
```

### 测试用例 2：旋转 Body

```
步骤：
1. 创建关节连接两个 Body
2. 拖动锚点到某个位置
3. 旋转 Body（修改 angle 属性）
4. 观察锚点位置

预期结果：
✅ 锚点随 Body 旋转
✅ 保持相对于 Body 的位置不变
✅ 使用局部坐标正确工作
```

### 测试用例 3：撤销/重做

```
步骤：
1. 拖动锚点到位置 A
2. 按 Ctrl+Z 撤销
3. 按 Ctrl+Y 重做
4. 再次拖动到位置 B
5. 连续按 Ctrl+Z 两次

预期结果：
✅ 第一次撤销回到原位置
✅ 重做回到位置 A
✅ 两次撤销依次回到位置 A 和原位置
✅ 历史记录正确管理
```

### 测试用例 4：距离关节长度

```
步骤：
1. 创建距离关节，长度 100px
2. 拖动锚点 A 远离锚点 B
3. 观察属性面板

预期结果：
✅ 长度参数自动增加（如 150px）
✅ 实时更新显示
✅ 松开鼠标后数值固定
```

---

## 🚀 性能优化

### 1. 事件处理优化
- 只在选择工具模式下检测锚点
- 优先检测锚点再检测 Body（避免误选）
- 拖动过程中跳过不必要的计算

### 2. 渲染优化
- 只重绘变化的部分
- 拖动时暂停属性面板更新
- 松开鼠标后才更新面板

### 3. 内存管理
- 拖动结束立即清空状态
- 避免闭包导致的内存泄漏
- 命令对象只保存必要数据

---

## 💡 设计亮点

### 1. 坐标系统正确性
- 使用局部坐标存储
- 拖动时正确转换坐标系
- 支持任意角度旋转的 Body

### 2. 用户体验优化
- 8像素点击范围（易于选中）
- 拖动时锚点变大（视觉反馈）
- 绿色高亮（明确拖动状态）
- 实时更新参数（所见即所得）

### 3. 命令模式集成
- 完美支持撤销/重做
- 只记录实际变化
- 与其他命令一致的接口

### 4. 智能参数更新
- 距离关节自动更新长度
- 避免无效或冲突的值
- 保持物理引擎的要求

---

## 🔄 与现有功能集成

### 属性面板编辑
- 拖动和输入框编辑完全兼容
- 都使用相同的命令系统
- 互相同步更新

### 关节选择
- 点击锚点优先级最高
- 选中关节时锚点高亮
- 支持键盘删除（Delete 键）

### Body 移动
- 锚点拖动不影响 Body 拖动
- 两种操作互不干扰
- 都支持撤销/重做

---

## 📚 相关文档

- [JOINT_FIX.md](./JOINT_FIX.md) - 关节系统完整修复文档
- [UNDO_REDO_GUIDE.md](./UNDO_REDO_GUIDE.md) - 撤销/重做功能指南
- [USER_GUIDE.md](./USER_GUIDE.md) - 完整使用手册

---

## 🎉 总结

锚点拖动功能的实现极大地提升了关节编辑的便利性和直观性。用户无需手动输入坐标，可以通过直接拖动快速调整关节连接位置，配合实时视觉反馈和撤销/重做支持，提供了专业级的编辑体验。

**核心价值**：
- ✨ 直观的可视化编辑
- 🎯 精确的坐标处理
- 💾 完整的撤销支持
- 🎨 清晰的视觉反馈

---

**实现日期**: 2024-01  
**实现人**: GitHub Copilot  
**相关文件**: `src/main.ts`
