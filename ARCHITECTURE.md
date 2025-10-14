# 2D Box2D 地图设计器 - 架构设计文档

## 1. 技术栈

### 1.1 核心技术
- **Vite 5.x**: 现代化构建工具，提供快速的 HMR 和优化的生产构建
- **TypeScript 5.x**: 类型安全，增强代码可维护性
- **HTML5 Canvas**: 2D图形绘制
- **Box2D-wasm**: WebAssembly版本的Box2D物理引擎

### 1.2 开发工具
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Vitest**: 单元测试（可选）

## 2. 项目结构

```
moonbit_stickman_map_designer/
├── src/
│   ├── core/                  # 核心模块
│   │   ├── constants.ts       # 常量定义（单位转换、默认值）
│   │   ├── types.ts          # TypeScript 类型定义
│   │   └── utils.ts          # 工具函数
│   │
│   ├── models/                # 数据模型层
│   │   ├── MapObject.ts      # 基类
│   │   ├── Body.ts           # 刚体类
│   │   ├── Joint.ts          # 关节基类
│   │   ├── DistanceJoint.ts  # 距离关节
│   │   └── RevoluteJoint.ts  # 旋转关节
│   │
│   ├── renderer/              # 渲染模块
│   │   ├── CanvasRenderer.ts # Canvas 渲染器
│   │   ├── BodyRenderer.ts   # 刚体渲染
│   │   └── JointRenderer.ts  # 关节渲染
│   │
│   ├── controllers/           # 控制器模块
│   │   ├── ToolController.ts # 工具控制器
│   │   ├── InteractionController.ts # 交互控制器
│   │   └── PropertyController.ts    # 属性面板控制器
│   │
│   ├── services/              # 服务层
│   │   ├── MapService.ts     # 地图数据管理
│   │   ├── FileService.ts    # 文件操作
│   │   └── ExportService.ts  # Box2D 导出
│   │
│   ├── demo/                  # Box2D 演示
│   │   ├── Box2DDemo.ts      # Box2D 演示控制器
│   │   └── Box2DRenderer.ts  # Box2D 渲染器
│   │
│   ├── ui/                    # UI 组件
│   │   ├── Toolbar.ts        # 工具栏
│   │   ├── PropertyPanel.ts  # 属性面板
│   │   └── StatusBar.ts      # 状态栏
│   │
│   ├── main.ts               # 应用入口
│   └── app.ts                # 主应用类
│
├── public/                    # 静态资源
│   └── box2d.wasm            # Box2D WebAssembly
│
├── index.html                # HTML 入口
├── styles.css                # 全局样式
├── vite.config.ts            # Vite 配置
├── tsconfig.json             # TypeScript 配置
├── package.json              # 项目配置
├── README.md                 # 使用文档
├── ARCHITECTURE.md           # 架构文档（本文档）
└── API.md                    # API 文档
```

## 3. 核心模块设计

### 3.1 常量定义 (constants.ts)

```typescript
// 单位转换
export const PIXEL_TO_METER = 20; // 20像素 = 1米

// 默认值
export const DEFAULT_WORLD_GRAVITY = [0, -10];
export const DEFAULT_BODY_DENSITY = 1.0;
export const DEFAULT_BODY_FRICTION = 0.3;
export const DEFAULT_BODY_RESTITUTION = 0.5;

// 渲染配置
export const SELECTION_COLOR = '#00ff00';
export const GRID_SIZE = 20;
export const JOINT_ANCHOR_RADIUS = 5;

// 刚体类型颜色
export const BODY_TYPE_COLORS = {
  static: '#95a5a6',
  dynamic: '#3498db',
  kinematic: '#9b59b6'
};
```

### 3.2 数据模型层

#### 3.2.1 MapObject 基类

```typescript
abstract class MapObject {
  id: string;
  type: 'body' | 'joint';
  visual_properties: VisualProperties;
  user_data: Record<string, any>;
  
  abstract toJSON(): any;
  abstract fromJSON(data: any): void;
}
```

#### 3.2.2 Body 类

负责：
- 存储刚体的几何和物理属性
- 像素↔️米单位转换
- 世界↔️局部坐标系转换
- 更新夹具尺寸

关键方法：
- `updateFixtureSize()`: 更新夹具的米单位尺寸
- `getLocalAnchor(worldX, worldY)`: 世界坐标转局部坐标
- `containsPoint(worldX, worldY)`: 点击测试

#### 3.2.3 Joint 类

负责：
- 存储关节的连接信息
- 计算锚点位置
- 自动计算长度/参考角度

### 3.3 渲染模块

#### CanvasRenderer
- 管理Canvas上下文
- 实现坐标系转换（Y轴翻转）
- 管理视口变换（缩放、平移）

#### BodyRenderer
- 绘制矩形（旋转、缩放）
- 绘制圆形
- 绘制多边形
- 选中状态高亮

#### JointRenderer
- 绘制距离关节（线条）
- 绘制旋转关节（枢轴标记）
- 绘制锚点

### 3.4 交互控制

#### 工具系统
```typescript
enum Tool {
  SELECT = 'select',
  RECT = 'rect',
  CIRCLE = 'circle',
  POLYGON = 'polygon',
  DISTANCE_JOINT = 'distanceJoint',
  REVOLUTE_JOINT = 'revoluteJoint',
  DELETE = 'delete'
}
```

#### 交互流程

**创建矩形/圆形**:
1. mousedown: 记录起点，创建临时对象
2. mousemove: 更新尺寸，实时预览
3. mouseup: 完成创建，添加到mapObjects

**创建多边形**:
1. 每次click添加顶点
2. 双击或按Enter完成
3. 至少3个顶点

**创建关节**:
1. 第一次click: 选择bodyA，记录锚点
2. 第二次click: 选择bodyB，记录锚点
3. 自动计算局部锚点和长度/角度
4. 创建关节对象

**选择和移动**:
1. 点击检测（hitTest）
2. 拖动更新position
3. 实时渲染

### 3.5 属性面板

动态生成表单元素：
- 根据选中对象类型（Body/Joint）
- 遍历body_def/fixture_def/joint_def属性
- 创建对应的input/select/checkbox
- 双向数据绑定

### 3.6 文件服务

#### 保存/加载
- 序列化整个mapObjects数组
- 使用Blob API下载
- FileReader API读取

#### Box2D导出
- 转换单位（像素→米）
- 转换坐标系（如需要）
- 生成标准Box2D JSON格式

### 3.7 Box2D演示

#### 初始化
1. 加载Box2D-wasm
2. 创建b2World
3. 根据导出JSON创建刚体和关节

#### 模拟循环
```typescript
function simulate() {
  world.Step(1/60, 8, 3);
  render();
  requestAnimationFrame(simulate);
}
```

## 4. Box2D JSON 导出格式

详见主文档中的JSON格式规范。

### 关键转换规则

1. **位置**: 像素坐标 / PIXEL_TO_METER
2. **尺寸**: 像素尺寸 / PIXEL_TO_METER
3. **角度**: 弧度（无需转换）
4. **速度**: 像素/秒 / PIXEL_TO_METER
5. **密度**: kg/m² （直接使用）
6. **力/扭矩**: 需要考虑单位换算

### Y轴处理

Canvas Y轴向下，Box2D Y轴向上：
- **方案1**: 导出时翻转Y坐标（position.y = -position.y）
- **方案2**: 在演示时翻转渲染坐标系
- **推荐**: 方案2，保持数据一致性

## 5. 性能优化策略

### 5.1 渲染优化
- 脏矩形标记，只重绘变化区域
- 离屏Canvas缓存静态背景
- 使用Path2D缓存形状路径

### 5.2 交互优化
- 防抖/节流鼠标移动事件
- 空间分区（Quadtree）加速hitTest
- 延迟属性面板更新

### 5.3 Box2D优化
- 合理设置时间步长（1/60秒）
- 优化速度/位置迭代次数
- 启用刚体休眠（allow_sleep）

## 6. 扩展性设计

### 6.1 插件系统
预留接口支持：
- 自定义工具
- 自定义渲染器
- 自定义导出格式

### 6.2 预留字段
所有预留字段在JSON中保持存在：
- is_sensor
- filter_* (碰撞过滤)
- visual_properties
- user_data

### 6.3 未来功能
- 更多关节类型（Prismatic, Weld, Pulley等）
- 图层管理
- 预制件系统
- 撤销/重做（Command模式）
- 协作编辑（WebSocket）

## 7. 测试策略

### 7.1 单元测试
- 数据模型类测试
- 工具函数测试
- 坐标转换测试

### 7.2 集成测试
- 完整的创建→编辑→导出流程
- Box2D导入验证

### 7.3 E2E测试
- 用户交互流程测试

## 8. 部署

### 开发环境
```bash
npm install
npm run dev
```

### 生产构建
```bash
npm run build
npm run preview
```

### 静态部署
- Vercel
- Netlify
- GitHub Pages
- 自托管服务器
