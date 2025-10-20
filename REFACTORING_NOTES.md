# 代码重构说明

## 已完成的重构

### 1. 常量提取 (`src/core/constants.ts`)
已将魔法数字提取到常量文件，包括：

#### 画布和视图设置
- `DEFAULT_CANVAS_WIDTH = 1000` - 默认画布宽度
- `DEFAULT_CANVAS_HEIGHT = 600` - 默认画布高度  
- `MIN_CANVAS_WIDTH / MAX_CANVAS_WIDTH` - 画布宽度范围
- `MIN_CANVAS_HEIGHT / MAX_CANVAS_HEIGHT` - 画布高度范围
- `MIN_PPM / MAX_PPM` - 像素/米缩放范围

#### 形状尺寸限制
- `MIN_SHAPE_WIDTH = 0.5` - 最小矩形宽度（米）
- `MIN_SHAPE_HEIGHT = 0.5` - 最小矩形高度（米）
- `MIN_SHAPE_RADIUS = 0.25` - 最小圆形半径（米）
- `MIN_SCALE_SIZE = 0.1` - 缩放时最小尺寸（米）
- `MAX_POLYGON_VERTICES = 8` - 多边形最大顶点数

#### 交互控制尺寸
- `VERTEX_RADIUS_NORMAL = 5` - 普通顶点半径（像素）
- `VERTEX_RADIUS_HOVER = 8` - 悬停顶点半径（像素）
- `VERTEX_SNAP_DISTANCE = 10` - 顶点捕捉距离（像素）
- `ANCHOR_RADIUS_NORMAL / SELECTED` - 锚点半径
- `DELETE_HOVER_RADIUS = 4` - 删除工具悬停圆圈半径
- `TRANSFORM_HANDLE_SIZE = 8` - 变换手柄大小
- `TRANSFORM_ROTATE_HANDLE_RADIUS = 6` - 旋转手柄半径
- `TRANSFORM_ROTATE_HANDLE_OFFSET = 30` - 旋转手柄偏移
- `TRANSFORM_BBOX_LINE_DASH = [5, 5]` - 包围框虚线样式

#### 渲染颜色
- `COLOR_GRID = '#e0e0e0'` - 网格线颜色
- `COLOR_GRID_TEXT = '#666'` - 网格坐标文字颜色
- `COLOR_ORIGIN = '#ff0000'` - 原点标记颜色（红色）
- `COLOR_SELECTED = '#3498db'` - 选中物体颜色（蓝色）
- `COLOR_HIGHLIGHT = '#27ae60'` - 高亮颜色（绿色）
- `COLOR_VERTEX_EDITING = '#27ae60'` - 顶点编辑模式颜色
- `COLOR_DRAWING = '#999'` - 绘制中物体颜色（灰色）
- `COLOR_DELETE_HOVER = '#e74c3c'` - 删除工具悬停颜色（红色）
- `COLOR_TEXT = '#333'` - 普通文字颜色
- `COLOR_TEXT_DARK = '#2c3e50'` - 深色文字
- `COLOR_JOINT = '#f39c12'` - 关节颜色（橙色）

#### 渲染线宽
- `LINE_WIDTH_GRID = 1` - 网格线宽
- `LINE_WIDTH_ORIGIN = 2` - 原点标记线宽
- `LINE_WIDTH_SELECTED = 2` - 选中物体线宽
- `LINE_WIDTH_VERTEX_HIGHLIGHT = 2` - 顶点高亮线宽
- `LINE_WIDTH_VERTEX_EDITING = 3` - 顶点编辑线宽
- `LINE_WIDTH_DRAWING = 1` - 绘制中物体线宽
- `LINE_WIDTH_JOINT = 3` - 关节线宽

### 2. 已在 main.ts 中应用的常量

#### 已替换的魔法数字：
✅ **画布初始化**
- `DEFAULT_CANVAS_WIDTH/HEIGHT` - 画布默认尺寸
- 初始化和重置视图逻辑

✅ **形状尺寸**
- `MIN_SHAPE_WIDTH/HEIGHT` - 矩形最小尺寸
- `MIN_SHAPE_RADIUS` - 圆形最小半径  
- `MAX_POLYGON_VERTICES` - 多边形顶点数限制

✅ **网格和坐标系**
- `COLOR_GRID` - 网格线颜色
- `COLOR_GRID_TEXT` - 坐标文字颜色
- `COLOR_ORIGIN` - 原点标记颜色
- `LINE_WIDTH_GRID/ORIGIN` - 线宽

✅ **多边形绘制**
- `COLOR_SELECTED` - 顶点和边框颜色
- `COLOR_HIGHLIGHT` - 起始点高亮和闭合预览
- `VERTEX_RADIUS_NORMAL/HOVER` - 顶点显示半径
- `LINE_WIDTH_SELECTED/VERTEX_HIGHLIGHT/VERTEX_EDITING` - 各种线宽

✅ **鼠标十字线**
- `COLOR_DRAWING` - 绘制模式十字线
- `COLOR_DELETE_HOVER` - 鼠标位置标记
- `COLOR_TEXT/TEXT_DARK` - 文字显示
- `DELETE_HOVER_RADIUS` - 标记圆圈半径
- `LINE_WIDTH_DRAWING` - 十字线线宽

✅ **物体渲染**
- `COLOR_SELECTED` - 选中物体边框
- `COLOR_TEXT_DARK` - 未选中物体边框
- `COLOR_TEXT` - ID 标签文字
- `LINE_WIDTH_SELECTED` - 选中物体线宽

✅ **顶点编辑**
- `COLOR_DELETE_HOVER` - 拖动中的顶点
- `COLOR_SELECTED` - 普通顶点
- `VERTEX_CONTROL_RADIUS` - 顶点控制点半径
- `LINE_WIDTH_SELECTED` - 顶点边框线宽

✅ **关节渲染**
- `COLOR_JOINT` - 关节工具颜色
- `COLOR_HIGHLIGHT` - 拖动中锚点高亮
- `COLOR_DELETE_HOVER` - 旋转关节锚点A
- `ANCHOR_RADIUS_NORMAL/SELECTED` - 锚点半径
- `JOINT_ANCHOR_RADIUS` - 关节连接点半径
- `LINE_WIDTH_JOINT/SELECTED/VERTEX_EDITING` - 各种线宽

✅ **文字显示**
- `COLOR_TEXT` - 所有标签和提示文字
- `COLOR_TEXT_DARK` - 顶点数量提示等

## 待完成的重构

### ~~需要批量替换的颜色值~~ ✅ 已完成！

所有硬编码的颜色值已经替换为常量：
- ~~#3498db → COLOR_SELECTED~~ ✅
- ~~#27ae60 → COLOR_HIGHLIGHT~~ ✅
- ~~#e74c3c → COLOR_DELETE_HOVER~~ ✅
- ~~#f39c12 → COLOR_JOINT~~ ✅
- ~~#999 → COLOR_DRAWING~~ ✅
- ~~#333 → COLOR_TEXT~~ ✅
- ~~#2c3e50 → COLOR_TEXT_DARK~~ ✅

### ~~需要替换的尺寸值~~ ✅ 已完成！

所有魔法数字已经替换为常量：
- ~~顶点半径 5/8~~ ✅ `VERTEX_RADIUS_NORMAL/HOVER`
- ~~锚点半径 5/7~~ ✅ `ANCHOR_RADIUS_NORMAL/SELECTED`
- ~~关节连接点 6~~ ✅ `JOINT_ANCHOR_RADIUS`
- ~~顶点控制点 6~~ ✅ `VERTEX_CONTROL_RADIUS`
- ~~删除标记 4~~ ✅ `DELETE_HOVER_RADIUS`
- ~~多边形顶点数 8~~ ✅ `MAX_POLYGON_VERTICES`
- ~~各种线宽 1/2/3~~ ✅ `LINE_WIDTH_*` 系列

### 剩余改进（可选）

### 1. 变换控制系统模块化
当前变换控制相关代码散布在主文件中，建议：
- 创建 `TransformController` 类
- 封装缩放、旋转、移动逻辑
- 统一处理手柄渲染和交互

### 2. 渲染器分离
建议创建专门的渲染器类：
```typescript
class CanvasRenderer {
  renderGrid()
  renderOrigin()
  renderBody()
  renderJoint()
  renderTransformControls()
  renderVertexEditor()
}
```

### 3. 配置文件增强
考虑添加运行时可配置的设置：
```typescript
interface EditorConfig {
  colors: ColorScheme;
  sizes: SizeConfig;
  behavior: BehaviorConfig;
}
```

### 4. 类型安全改进
使用更严格的类型定义：
- 手柄类型枚举
- 颜色类型（使用 branded types）
- 尺寸单位类型（区分像素和米）

## 重构优先级

### 高优先级（影响可维护性）
1. ✅ 提取所有魔法数字到常量
2. ⏳ 替换 main.ts 中的硬编码颜色值
3. ⏳ 替换 main.ts 中的硬编码尺寸值

### 中优先级（影响代码组织）
4. 创建 TransformController 类
5. 分离渲染逻辑

### 低优先级（锦上添花）
6. 配置系统
7. 更强的类型约束

## 使用说明

重构后，修改视觉样式只需在 `constants.ts` 中调整相应常量即可，无需在代码中搜索魔法数字。

例如，要改变选中物体的颜色：
```typescript
// src/core/constants.ts
export const COLOR_SELECTED = '#ff6b6b'; // 从蓝色改为红色
```

所有使用该常量的地方都会自动更新。
