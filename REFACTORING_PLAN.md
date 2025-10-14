# 坐标系统重构计划

## 目标

将整个设计器从 Canvas 坐标系统改为 Box2D 坐标系统：
- 所有内部数据使用 Box2D 坐标（Y向上，米为单位）
- 只在渲染时转换为 Canvas 坐标
- 保存/导出时直接使用，无需转换

## PPM 配置

```typescript
let PPM = 20;  // Pixels Per Meter，可配置
```

用户可以通过 UI 调整 PPM 值来缩放视图。

## 坐标转换函数

```typescript
// Box2D → Canvas（用于渲染）
function box2DToCanvas(box2dX, box2dY, canvasWidth, canvasHeight): Vector2 {
  return {
    x: canvasWidth / 2 + box2dX * PPM,
    y: canvasHeight - box2dY * PPM
  };
}

// Canvas → Box2D（用于鼠标输入）
function canvasToBox2D(canvasX, canvasY, canvasWidth, canvasHeight): Vector2 {
  return {
    x: (canvasX - canvasWidth / 2) / PPM,
    y: (canvasHeight - canvasY) / PPM
  };
}

// 标量转换
function box2DToCanvasScale(meters): number {
  return meters * PPM;
}

function canvasToBox2DScale(pixels): number {
  return pixels / PPM;
}
```

## 需要修改的部分

### 1. 常量定义 ✅
- `PPM` 替代 `PIXEL_TO_METER`
- `GRID_SIZE` 改为 1 米

### 2. 鼠标输入 ✅
- `getMousePos()`: 返回 Box2D 坐标

### 3. 创建对象
- 默认尺寸使用米（如 1m x 1m，半径 0.5m）
- 最小尺寸使用米（0.5m, 0.25m）

### 4. 渲染系统（最复杂）

需要修改所有渲染函数：
- `render()`: 网格、坐标轴、原点标记
- `renderBody()`: 矩形、圆形、多边形
- `renderJoint()`: 关节线和锚点
- 多边形顶点绘制
- 鼠标十字线
- 选中框

每个渲染调用都需要：
```typescript
const canvasPos = box2DToCanvas(body.position.x, body.position.y, width, height);
const canvasWidth = box2DToCanvasScale(body.width);
const canvasHeight = box2DToCanvasScale(body.height);
```

### 5. 碰撞检测

hitTest 函数需要继续使用 Box2D 坐标（已经正确，因为输入就是 Box2D）

### 6. 属性面板

显示时使用米，精度 2 位小数：
```typescript
value="${body.position.x.toFixed(2)}"  // 米
value="${body.width.toFixed(2)}"       // 米
```

### 7. 导出 ✅
- 不需要任何转换，直接使用

### 8. 保存/加载 ✅
- 数据已经是 Box2D 格式，直接保存/加载

## 实现步骤

1. ✅ 添加坐标转换函数
2. ✅ 修改鼠标输入
3. ✅ 修改状态栏显示
4. ✅ 修改创建对象默认值
5. ⏳ 修改 render() 主函数
6. ⏳ 修改 renderBody()
7. ⏳ 修改 renderJoint()
8. ⏳ 修改多边形绘制
9. ⏳ 修改属性面板显示
10. ⏳ 添加 PPM 配置 UI
11. ✅ 验证导出功能

## 渲染示例

```typescript
private renderBody(body: Body): void {
  const ctx = this.ctx;
  const width = this.canvas.width;
  const height = this.canvas.height;
  
  // Box2D → Canvas
  const canvasPos = box2DToCanvas(body.position.x, body.position.y, width, height);
  
  ctx.save();
  ctx.translate(canvasPos.x, canvasPos.y);
  ctx.rotate(-body.angle);  // Canvas 顺时针为正，Box2D 逆时针为正
  
  if (body.shapeType === 'box') {
    const w = box2DToCanvasScale(body.width);
    const h = box2DToCanvasScale(body.height);
    ctx.fillRect(-w/2, -h/2, w, h);
  } else if (body.shapeType === 'circle') {
    const r = box2DToCanvasScale(body.radius);
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}
```

## 测试清单

- [ ] 创建矩形，尺寸正确（米）
- [ ] 创建圆形，尺寸正确（米）
- [ ] 创建多边形，位置正确
- [ ] 移动对象，位置正确更新
- [ ] 旋转对象，方向正确
- [ ] 创建关节，锚点位置正确
- [ ] 拖动锚点，位置正确更新
- [ ] 属性面板显示米为单位
- [ ] 导出 Box2D，数据直接可用
- [ ] 保存/加载地图，数据一致
- [ ] 网格显示 1m 间隔
- [ ] 原点标记在 Canvas 中心底部
- [ ] PPM 调整后，视图正确缩放

## 优势

1. **直接对应 Box2D**：编辑的就是最终使用的数据
2. **更直观**：以米为单位，符合物理思维
3. **无转换损耗**：导出时零转换
4. **易于调试**：坐标值直接对应物理世界
5. **灵活缩放**：通过 PPM 调整视图
