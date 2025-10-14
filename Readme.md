# 2D Box2D 地图设计器

<div align="center">

**一个基于Web的可视化2D物理场景编辑器**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF)](https://vitejs.dev/)

[快速开始](#快速开始) • [功能特性](#功能特性) • [文档](#文档) • [演示](#演示)

</div>

---

## 📖 项目简介

Box2D 地图设计器是一个现代化的Web应用，让您能够通过直观的图形界面创建和编辑2D物理场景。设计的场景可以直接导出为Box2D物理引擎兼容的JSON格式，用于游戏开发和物理模拟项目。

### ✨ 核心优势

- 🎨 **直观的可视化编辑** - 所见即所得的设计体验
- 🔧 **完整的物理属性** - 支持Box2D所有关键参数
- 📦 **标准化导出** - 生成Box2D标准JSON格式
- ⚡ **现代化技术栈** - 基于Vite + TypeScript构建
- 🎯 **零依赖运行** - 纯Web技术，无需后端

---

## 🚀 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd moonbit_stickman_map_designer

# 安装依赖
npm install
```

### 运行

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

启动后访问 `http://localhost:3000`

---

## 🎯 功能特性

### 刚体创建

- ✅ **矩形** - 创建Box形状的刚体
- ✅ **圆形** - 创建Circle形状的刚体  
- ✅ **多边形** - 创建自定义Polygon形状

### 关节系统

- ✅ **距离关节** (Distance Joint) - 保持两个刚体间的距离，支持弹簧效果
- ✅ **旋转关节** (Revolute Joint) - 创建铰链效果，支持角度限制和马达

### 编辑功能

- ✅ 选择、移动、删除对象
- ✅ 实时属性编辑
- ✅ 撤销/重做功能（Ctrl+Z / Ctrl+Y）
- ✅ 网格对齐辅助
- ✅ 多对象管理

### 物理属性

完整支持Box2D物理属性：

**刚体属性**：
- 类型（Static/Dynamic/Kinematic）
- 密度、摩擦力、弹性
- 线性/角阻尼
- 重力缩放
- 固定旋转

**关节属性**：
- 距离关节：长度、频率、阻尼比
- 旋转关节：角度限制、马达控制

### 文件操作

- 💾 保存/加载地图（JSON格式）
- 📤 导出Box2D JSON
- 📥 导入现有地图

---

## 📚 文档

### 完整文档

- [📘 使用手册](./USER_GUIDE.md) - 详细的使用说明和教程
- [📗 API文档](./API.md) - Box2D导出格式规范和集成指南
- [📙 架构文档](./ARCHITECTURE.md) - 系统设计和技术架构

### Box2D JSON 导出格式

导出的JSON文件包含三个主要部分：

```json
{
  "world_settings": {
    "gravity": [0, -10],
    "allow_sleeping": true
  },
  "bodies": [
    {
      "id": "body_1",
      "body_def": {
        "type": "dynamic",
        "position": [5.0, 10.0],
        "angle": 0,
        ...
      },
      "fixtures": [...]
    }
  ],
  "joints": [...]
}
```

详细格式说明请查看 [API文档](./API.md)。

---

## 🎨 界面预览

### 主界面

```
┌─────────────────────────────────────────────────────────┐
│  [选择] [矩形] [圆形] [多边形] [距离关节] [旋转关节]  │ 工具栏
│  [新建] [保存] [加载] [导出] [演示]                     │
├──────────────────────────────────┬──────────────────────┤
│                                  │  属性面板            │
│                                  │                      │
│         设计画布                 │  ┌────────────────┐ │
│      (网格辅助线)                │  │ 对象ID: ...    │ │
│                                  │  │ 类型: 刚体     │ │
│                                  │  ├────────────────┤ │
│                                  │  │ 刚体类型       │ │
│                                  │  │ [Dynamic ▼]    │ │
│                                  │  ├────────────────┤ │
│                                  │  │ 物理属性       │ │
│                                  │  │ 密度: 1.0      │ │
│                                  │  │ 摩擦: 0.3      │ │
│                                  │  │ ...            │ │
│                                  │  └────────────────┘ │
├──────────────────────────────────┴──────────────────────┤
│ 工具: 选择 | 对象: 5 | 坐标: (120, 80) | 提示信息      │ 状态栏
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 技术栈

### 核心技术

- **Vite 5.x** - 快速的开发服务器和构建工具
- **TypeScript 5.x** - 类型安全的JavaScript超集
- **HTML5 Canvas** - 2D图形渲染
- **box2d-js** - Box2D物理引擎的JavaScript实现

### 开发工具

- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化

---

## 📂 项目结构

```
moonbit_stickman_map_designer/
├── src/
│   ├── core/              # 核心模块（常量、类型、工具）
│   ├── main.ts            # 应用入口和主逻辑
│   └── app.css            # 应用样式
├── box2d-js/              # Box2D库
│   └── lib/box2d.js
├── index.html             # HTML入口
├── styles.css             # 全局样式
├── vite.config.ts         # Vite配置
├── tsconfig.json          # TypeScript配置
├── package.json           # 项目配置
├── README.md              # 项目说明（本文档）
├── USER_GUIDE.md          # 使用手册
├── API.md                 # API文档
└── ARCHITECTURE.md        # 架构文档
```

---

## ⌨️ 快捷键

- **Delete** - 删除选中的对象
- **Ctrl + Z** - 撤销上一步操作
- **Ctrl + Y** - 重做被撤销的操作
- **双击** - 完成多边形绘制

---

## 💡 使用示例

### 1. 创建一个简单场景

1. 启动应用
2. 选择"矩形"工具，创建一个地面（设为Static类型）
3. 选择"圆形"工具，在上方创建一个球（默认Dynamic类型）
4. 点击"演示"按钮查看物理效果

### 2. 创建摆锤

1. 创建一个静态矩形作为支架
2. 创建一个动态圆形作为摆锤
3. 使用"旋转关节"连接支架和摆锤
4. 导出JSON用于游戏

### 3. 创建弹簧系统

1. 创建两个动态矩形
2. 使用"距离关节"连接它们
3. 调整频率(4-8 Hz)和阻尼比(0.3-0.7)
4. 测试弹簧效果

---

## 🎯 使用场景

- 🎮 **游戏关卡设计** - 快速原型化物理关卡
- 🏗️ **物理模拟教学** - 可视化学习Box2D
- 🔬 **机械结构测试** - 验证复杂机械系统
- 🎨 **互动艺术** - 创建物理驱动的艺术作品

---

## 🛠️ Box2D集成

### 在项目中使用导出的JSON

```javascript
// 1. 加载box2d-js
<script src="box2d-js/lib/box2d.js"></script>

// 2. 加载导出的JSON
const response = await fetch('box2d_export.json');
const data = await response.json();

// 3. 创建Box2D世界
const b2World = Box2D.Dynamics.b2World;
const b2Vec2 = Box2D.Common.Math.b2Vec2;

const gravity = new b2Vec2(
  data.world_settings.gravity[0],
  data.world_settings.gravity[1]
);
const world = new b2World(gravity, true);

// 4. 创建刚体和关节（见API文档）
data.bodies.forEach(bodyData => {
  // 创建刚体...
});

data.joints.forEach(jointData => {
  // 创建关节...
});

// 5. 运行模拟
function step() {
  world.Step(1/60, 8, 3);
  render();
  requestAnimationFrame(step);
}
```

完整集成示例请参考 [API文档](./API.md)。

---

## 📋 开发路线图

### 已完成 ✅

- [x] 基础刚体创建（矩形、圆形、多边形）
- [x] 距离关节和旋转关节
- [x] 属性编辑面板
- [x] 文件保存/加载
- [x] Box2D JSON导出
- [x] 撤销/重做功能（Ctrl+Z / Ctrl+Y）
- [x] 完整文档

### 计划中 🚧

- [ ] Box2D物理演示功能
- [ ] 更多关节类型（滑块、齿轮、滑轮）
- [ ] 碰撞过滤UI
- [ ] 图层管理
- [ ] 预制件系统
- [ ] 协作编辑

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📧 联系方式

如有问题或建议，请提交 Issue。

---

## 🙏 致谢

- [Box2D](https://box2d.org/) - 优秀的2D物理引擎
- [box2d-js](https://github.com/kripken/box2d.js/) - Box2D的JavaScript移植
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给它一个星标！⭐**

Made with ❤️ by developers, for developers

</div>

---

## 附录：原始开发文档

以下是详细的开发文档内容：

## 1. 引言

### 1.1 项目目标
本项目旨在构建一个基于Web的2D地图设计器，允许用户通过直观的图形界面创建和编辑2D物理场景。设计的核心在于能够方便地定义Box2D物理引擎所需的刚体（矩形、圆形、多边形）和关节（距离关节、旋转关节）。设计器必须具备导出Box2D兼容数据格式的能力，并集成一个Box2D演示功能，使用户能够即时预览其设计的物理行为。

### 1.2 项目范围
**核心功能：**
*   **用户界面 (UI/UX):** 提供一个直观的Web界面，包含主设计画布、功能工具栏和属性编辑面板。
*   **刚体创建:** 支持在画布上创建矩形、圆形和多边形形状的刚体。
*   **关节创建:** 支持在刚体之间创建 `b2DistanceJoint`（距离关节）和 `b2RevoluteJoint`（旋转关节）。
*   **对象操作:** 提供选择、移动、删除、旋转（针对刚体）和缩放（针对矩形和圆形刚体）等基本操作。
*   **属性编辑:** 允许用户通过属性面板编辑选中刚体和关节的关键Box2D物理参数。
*   **数据持久化:** 支持将设计器内部的地图数据保存为JSON文件，并能从JSON文件加载现有地图。
*   **Box2D导出:** 能够将当前设计转换为符合Box2D引擎导入规范的JSON数据格式。
*   **Box2D演示:** 内置功能，可加载导出的Box2D数据并在独立的画布上运行物理模拟，以视觉化方式验证设计。

**非核心功能（预留接口，不在初始版本实现UI）：**
*   Box2D的 `is_sensor` 属性。
*   Box2D的碰撞过滤 (`filter_category_bits`, `filter_mask_bits`, `filter_group_index`) 属性。
*   自定义视觉属性 (`visual_properties`)。
*   自定义用户数据 (`user_data`)。

### 1.3 目标受众
*   需要快速原型化和测试2D物理场景的游戏设计师、关卡设计师。
*   对Box2D物理引擎感兴趣并希望通过可视化工具进行学习和实验的开发者。

## 2. 技术栈

*   **核心语言:** JavaScript
*   **Web 技术:** HTML5 (Canvas), CSS3
*   **物理引擎库:** Box2D.js (Box2D C++ 库的 Emscripten 移植版本)
*   **数据交换格式:** JSON
*   **开发/运行环境:** 现代Web浏览器（如Google Chrome, Mozilla Firefox）

## 3. 系统架构

系统设计遵循模块化原则，以提高代码的可维护性和可扩展性。整体架构可视为一个轻量级的MVVM（Model-View-ViewModel）模式在Web环境下的应用。

```mermaid
graph TD
    A[index.html & style.css] <--> B[app.js: 主应用程序逻辑]
    B --> C[数据模型层: Body, Joint 对象]
    B --> D[Canvas 渲染模块]
    B --> E[交互控制模块]
    B --> F[属性面板管理模块]
    B --> G[文件操作 & Box2D 导出模块]
    B --> H[box2d-demo.js: Box2D 演示模块]
    H --> I[Box2D.js 库]

    subgraph User Interface
        A
    end

    subgraph Core Application (app.js)
        B
        C
        D
        E
        F
        G
    end

    subgraph Physics Integration
        H
        I
    end
```

**模块职责概述：**

*   **UI 模块 (`index.html`, `style.css`):**
    *   负责提供应用程序的结构骨架，包括画布容器、工具栏按钮、属性面板区域。
    *   定义应用程序的视觉表现和布局样式。
*   **主应用程序逻辑 (`app.js`):**
    *   作为整个设计器的核心控制器，协调各个子模块。
    *   初始化画布、绑定事件监听器。
    *   管理 `mapObjects` 数组，这是所有刚体和关节的中央数据存储。
*   **数据模型层 (`app.js` 内部):**
    *   定义 `MapObject`、`Body`、`Joint`、`DistanceJoint`、`RevoluteJoint` 等JavaScript类。
    *   这些类封装了Box2D对象所需的所有几何、物理属性，并预留了未来扩展的接口。
    *   负责处理像素单位与Box2D米单位之间的转换。
*   **Canvas 渲染模块 (`app.js` 内部):**
    *   负责将数据模型中的 `Body` 和 `Joint` 对象以图形形式绘制到设计画布上。
    *   根据对象类型和状态（如是否选中、刚体类型）应用不同的视觉样式。
*   **交互控制模块 (`app.js` 内部):**
    *   处理所有用户输入事件（鼠标点击、拖动、键盘输入）。
    *   实现工具（选择、创建刚体、创建关节、删除）的切换和逻辑。
    *   管理对象的创建流程（例如，多边形顶点添加，关节的锚点选择）。
    *   执行对象的选择、移动、旋转和缩放操作。
*   **属性面板管理模块 (`app.js` 内部):**
    *   根据当前 `selectedObject` 的类型和属性，动态生成HTML表单元素。
    *   负责将用户在属性面板中输入的值更新回 `selectedObject` 的数据模型中，并触发画布重绘。
*   **文件操作与Box2D导出模块 (`app.js` 内部):**
    *   实现将整个 `mapObjects` 数据结构序列化为JSON字符串，并提供保存和加载功能。
    *   负责将设计器内部的数据模型转换为Box2D引擎可直接解析的特定JSON格式。
*   **Box2D 演示模块 (`box2d-demo.js`):**
    *   独立于设计器，负责与 `Box2D.js` 库交互。
    *   从主应用程序获取导出的Box2D JSON数据。
    *   初始化 `b2World`，并根据JSON数据在Box2D世界中创建 `b2Body` 和 `b2Joint`。
    *   运行物理模拟循环，并使用Box2D的调试绘制功能将模拟结果渲染到独立的演示画布上。
*   **Box2D.js 库 (`lib/box2d.min.js`):**
    *   提供所有Box2D物理引擎的核心功能和API。

## 4. 数据模型设计

所有地图元素都将以JavaScript对象的形式存储在内存中，它们的结构将严格遵循Box2D的概念，并预留了用户要求的不在UI中暴露的字段。

### 4.1 刚体 (Body) 数据结构

每个刚体对象将包含以下核心属性：

*   `id`: 唯一的字符串标识符。
*   `type`: 指示对象为“body”。
*   `shapeType`: 字符串，描述刚体的几何形状（例如 "box", "circle", "polygon"），这有助于设计器渲染。
*   `position`: 一个 `{ x: number, y: number }` 对象，表示刚体在世界坐标系中的中心位置（像素单位）。
*   `angle`: 刚体的旋转角度，以弧度表示。
*   `width`, `height`, `radius`, `vertices`: 形状特有的几何参数，以像素单位存储。这些参数是设计器内部使用，并通过方法转换为Box2D所需的米单位。
*   `body_def`: 一个对象，直接映射Box2D的 `b2BodyDef` 结构，包含：
    *   `type`: 字符串，如 "static", "dynamic", "kinematic"。
    *   `linear_damping`, `angular_damping`, `allow_sleep`, `awake`, `fixed_rotation`, `bullet`, `gravity_scale` 等Box2D `b2BodyDef` 属性。
    *   `linear_velocity`, `angular_velocity`: 预留接口，用于初始速度设置。
*   `fixtures`: 一个数组，每个元素表示一个夹具（碰撞形状）。初始版本中，每个刚体将只包含一个夹具。每个夹具包含：
    *   `shape`: 一个对象，描述夹具的几何形状。
        *   `type`: 字符串，例如 "box", "circle", "polygon"。
        *   `params`: 一个对象，包含形状的Box2D单位（米）参数，如 `width`, `height`, `radius`, `vertices`（局部坐标）。
    *   `fixture_def`: 一个对象，直接映射Box2D的 `b2FixtureDef` 结构，包含：
        *   `density`, `friction`, `restitution` 等Box2D `b2FixtureDef` 属性。
        *   `is_sensor`: 布尔值（预留接口，默认为 `false`）。
        *   `filter_category_bits`, `filter_mask_bits`, `filter_group_index`: 整型（预留接口，默认为Box2D默认值）。
*   `visual_properties`: 一个对象（预留接口，默认空对象），用于存储设计器中对象的颜色、线条样式等视觉信息。
*   `user_data`: 一个对象（预留接口，默认空对象），用于存储用户自定义的额外数据。

**关键辅助方法（在刚体类中）：**
*   **`updateFixtureSize()`:** 负责将设计器中的像素单位几何尺寸转换为Box2D所需的米单位，并更新夹具的 `shape.params`。
*   **`getLocalAnchor(worldX, worldY)`:** 将世界坐标系中的一个点转换到该刚体的局部坐标系中，并转换为米单位。这对于计算关节锚点至关重要。

### 4.2 关节 (Joint) 数据结构

每个关节对象将包含以下核心属性：

*   `id`: 唯一的字符串标识符。
*   `type`: 指示对象为“joint”。
*   `jointType`: 字符串，描述关节类型（例如 "distance", "revolute"）。
*   `bodyA_id`, `bodyB_id`: 字符串，连接的两个刚体的ID。`bodyB_id` 可以为 `null`，表示连接到世界。
*   `joint_def`: 一个对象，直接映射Box2D的 `b2JointDef` 或其子类结构，包含：
    *   `collide_connected`: 布尔值，指示连接的两个刚体是否相互碰撞。
    *   **对于距离关节 (`b2DistanceJointDef`)：**
        *   `local_anchor_a`, `local_anchor_b`: 对象，锚点在各自刚体局部坐标系中的位置（米单位）。
        *   `length`: 浮点数，关节的理想长度（米单位），通常在创建时自动计算。
        *   `frequency_hz`, `damping_ratio`: 浮点数，用于软距离关节的弹簧/阻尼特性。
    *   **对于旋转关节 (`b2RevoluteJointDef`)：**
        *   `local_anchor_a`, `local_anchor_b`: 对象，锚点（枢轴点）在各自刚体局部坐标系中的位置（米单位）。
        *   `reference_angle`: 浮点数，刚体B相对于刚体A的初始角度偏移量（弧度），通常在创建时自动计算。
        *   `enable_limit`, `lower_angle`, `upper_angle`: 布尔值和浮点数，用于关节角度限制。
        *   `enable_motor`, `motor_speed`, `max_motor_torque`: 布尔值和浮点数，用于关节马达控制。
*   `visual_properties`: 一个对象（预留接口），用于存储关节的视觉信息。
*   `user_data`: 一个对象（预留接口），用于存储用户自定义的额外数据。

## 5. 核心模块设计

### 5.1 单位转换常量

一个全局常量 `PIXEL_TO_METER` (例如 20)，用于在设计器（像素）和Box2D（米）之间进行转换。所有物理属性（如位置、尺寸、速度、长度）在数据模型中都应存储为Box2D单位（米），但UI显示和用户输入时会涉及像素单位。

### 5.2 Canvas 渲染模块

*   **`renderCanvas()`:** 核心绘制函数。每次数据模型发生变化（例如对象被移动、属性被修改）时调用。负责清空画布，然后迭代 `mapObjects` 数组，依次调用 `drawBody()` 和 `drawJoint()`。
*   **`drawBody(body)`:** 负责根据传入的 `Body` 对象绘制其形状。需要进行 Canvas 坐标平移和旋转操作，以匹配刚体的 `position` 和 `angle`。根据 `body.shapeType` 绘制矩形、圆形或多边形。刚体类型（静态、动态、运动学）可以通过不同填充色或边框颜色区分。
*   **`drawJoint(joint)`:** 负责根据传入的 `Joint` 对象绘制其视觉表示。需要根据 `joint.bodyA_id` 和 `joint.bodyB_id` 找到对应的刚体，然后计算关节锚点的世界坐标。
    *   **距离关节:** 绘制一条连接两个锚点的直线。
    *   **旋转关节:** 在枢轴点世界坐标处绘制一个小的圆形或十字标记。
    *   选中状态的关节应有特殊的描边颜色。

### 5.3 交互控制模块

*   **工具选择机制:** 工具栏按钮绑定事件监听器，用于设置当前的 `currentTool` 状态（例如 'select', 'rect', 'distanceJoint'）。
*   **鼠标事件处理 (`onMouseDown`, `onMouseMove`, `onMouseUp`):**
    *   **选择工具:** `onMouseDown` 时执行 `hitTest` 函数，确定 `selectedObject`。如果选中刚体，可以开始拖动以移动刚体。
    *   **刚体创建工具 (矩形/圆形):** `onMouseDown` 记录起始点，创建临时的 `drawingBody`。`onMouseMove` 时根据鼠标当前位置动态调整 `drawingBody` 的尺寸/半径并实时预览。`onMouseUp` 时完成 `drawingBody` 并添加到 `mapObjects`。
    *   **多边形刚体工具:** `onMouseDown` 每次点击都在 `drawingBody` 的 `vertices` 数组中添加一个顶点。可以通过双击或点击“完成多边形”按钮来结束创建。
    *   **关节创建工具 (距离/旋转):**
        *   `onMouseDown` 首次点击：`hitTest` 选中第一个刚体 `bodyA`，并记录第一个锚点的世界坐标。
        *   `onMouseDown` 再次点击：`hitTest` 选中第二个刚体 `bodyB`（或假设为世界），记录第二个锚点的世界坐标。根据 `bodyA` 和 `bodyB` 以及锚点世界坐标，创建 `DistanceJoint` 或 `RevoluteJoint` 实例，并添加到 `mapObjects`。关节的 `local_anchor_a/b` 和 `length`/`reference_angle` 需在此时根据世界锚点和刚体信息自动计算。
*   **`hitTest(worldX, worldY)`:** 一个核心函数，用于确定在给定世界坐标 `(worldX, worldY)` 处是否存在地图对象。
    *   应优先检测刚体，然后检测关节。
    *   **刚体检测:** 针对矩形、圆形、多边形实现点内测试（或更简单的边界框检测）。需要考虑刚体的旋转。
    *   **关节检测:** 通常检测锚点附近的一个小半径区域。
*   **对象操作:**
    *   **移动:** 通过鼠标拖动 `selectedObject` 来更新其 `position`。
    *   **旋转:** 对于刚体，可以考虑在属性面板中直接输入角度，或者实现一个旋转手柄。
    *   **缩放:** 对于矩形和圆形刚体，通过拖动角点或边沿，或在属性面板中输入尺寸。
    *   **删除:** 选中对象后点击删除按钮，从 `mapObjects` 中移除 `selectedObject`。

### 5.4 属性面板管理模块

*   **`updatePropertyPanel()`:** 根据 `selectedObject` 的类型（`Body` 或 `Joint`）和其内部的Box2D属性（`body_def`, `fixture_def`, `joint_def`）动态生成HTML表单元素（输入框、下拉菜单、复选框）。
*   **数据绑定:** 为每个生成的表单元素添加 `change` 或 `input` 事件监听器。当用户修改输入值时，使用反射机制（例如通过 `dataset` 属性存储属性路径）来更新 `selectedObject` 数据模型中的对应属性。
*   **刷新机制:** 属性更新后，立即调用 `renderCanvas()` 刷新设计画布，以便用户看到视觉变化。

### 5.5 文件操作与Box2D导出模块

*   **`saveMap()`:** 将当前 `mapObjects` 数组，包括所有刚体和关节的完整数据，转换为JSON字符串，并通过浏览器API（例如创建 Blob 并用 `URL.createObjectURL` 下载）保存为 `.json` 文件。
*   **`loadMap(file)`:** 从用户选择的 `.json` 文件中读取内容，解析为JavaScript对象。然后迭代该数据，根据其 `type` 重新实例化 `Body` 和 `Joint` 对象，并重建 `mapObjects` 数组。
*   **`exportBox2DJson()`:** 这是一个关键函数，负责将设计器内部的 `mapObjects` 转换为Box2D引擎可以直接解析的JSON格式。
    *   构建一个顶层JSON对象，包含 `world_settings`（如重力 `[x, y]`）、`bodies` 数组和 `joints` 数组。
    *   遍历 `mapObjects` 中的 `Body` 对象，为每个刚体创建一个Box2D兼容的结构，将其 `body_def`、`fixtures` 中的 `shape.params`（已转换为米）和 `fixture_def` 复制到导出结构中。确保将 `position` 和 `angle` 等也转换为Box2D所需单位（米和弧度）。
    *   遍历 `mapObjects` 中的 `Joint` 对象，为每个关节创建一个Box2D兼容的结构，将其 `bodyA_id`, `bodyB_id` 和 `joint_def` 复制到导出结构中。
    *   确保所有预留接口（`is_sensor`, `filter_*`, `user_data`, `visual_properties`）即使是默认值或空，也存在于导出JSON中，以保持格式一致性和未来兼容性。
    *   最后，触发浏览器下载这个Box2D JSON文件。

### 5.6 Box2D 演示模块 (`box2d-demo.js`)

*   **`initDemo(exportedData)`:**
    *   初始化 `b2World` 对象，设置重力（通常从 `exportedData.world_settings` 获取）。
    *   **创建刚体:** 遍历 `exportedData.bodies` 数组。对于每个导出的刚体数据，创建 `b2BodyDef`，设置其类型、位置、角度等。然后创建 `b2Body` 实例并添加到 `b2World`。接着，为每个夹具创建 `b2Shape` (如 `b2PolygonShape`, `b2CircleShape`) 和 `b2FixtureDef`，并将其附加到 `b2Body` 上。
    *   **创建关节:** 遍历 `exportedData.joints` 数组。根据 `jointType` 创建相应的 `b2DistanceJointDef` 或 `b2RevoluteJointDef`，设置锚点、长度、角度限制、马达等参数。在 `b2World` 中查找对应的 `b2Body` 实例，然后创建 `b2Joint` 并添加到 `b2World`。
*   **`runSimulation()`:**
    *   一个使用 `requestAnimationFrame` 实现的动画循环。
    *   在每次循环中，调用 `b2World.Step(timeStep, velocityIterations, positionIterations)` 来更新物理模拟。
    *   调用一个自定义的绘制函数 (`drawDebugWorld`) 来渲染 `b2World` 的当前状态到 `box2dDemoCanvas`。
*   **`drawDebugWorld(world, ctx, PIXEL_TO_METER)`:**
    *   Box2D.js通常提供一个 `b2DebugDraw` 类。需要实例化它，并将其设置为 `b2World` 的调试绘制监听器。
    *   `b2DebugDraw` 会自动遍历 `b2World` 中的所有刚体和关节，并根据其形状、类型（激活、睡眠等）绘制它们。需要配置 `b2DebugDraw` 的绘图上下文 (`ctx`) 和缩放比例 (`PIXEL_TO_METER`)。
*   **`startDemo()`:** 隐藏设计画布，显示演示画布。调用 `exportBox2DJson` 获取数据，然后 `initDemo` 并启动 `runSimulation`。
*   **`stopDemo()`:** 停止动画循环，销毁 `b2World`（可选，但推荐），隐藏演示画布，显示设计画布。

## 6. 关键架构考虑

*   **单位管理:** 严格区分设计器内部的像素单位和Box2D引擎所需的米单位。所有Box2D相关的属性（如长度、半径、位置、速度、密度等）在数据模型中都应存储为米，并在UI显示或用户输入时进行像素-米转换。
*   **坐标系:** Box2D的Y轴通常向上为正，而HTML Canvas的Y轴向下为正。在渲染和与Box2D交互时，需要处理这种Y轴方向的差异。一种常见的做法是在Canvas渲染时进行Y轴翻转，或者统一在数据模型层进行转换。
*   **对象唯一ID:** 所有 `Body` 和 `Joint` 对象都必须拥有唯一的ID，以便在关节定义中引用，以及在保存/加载和导出时进行识别。
*   **对象选择与Hit-Testing:** 实现高效准确的点击测试是用户体验的关键。对于旋转的矩形和多边形，需要更复杂的几何算法。
*   **性能优化:**
    *   对于大型地图，Canvas绘图可能成为瓶颈。可以考虑脏矩形渲染、离屏Canvas缓存等优化技术。
    *   Box2D模拟的性能取决于刚体和关节的数量以及 `timeStep` 设置。
*   **可扩展性:** 通过预留的接口 (`is_sensor`, `filter_*`, `user_data`, `visual_properties`)，可以轻松在未来版本中添加更多功能，而无需修改核心数据模型。

## 7. 未来展望

*   **更多关节类型:** 增加 `b2PrismaticJoint` (滑块关节), `b2WeldJoint` (焊接关节) 等。
*   **碰撞过滤UI:** 为 `filter_category_bits`, `filter_mask_bits`, `filter_group_index` 添加用户界面，实现更精细的碰撞控制。
*   **传感器UI:** 允许用户将形状标记为传感器。
*   **图层管理:** 引入图层概念，方便管理复杂的地图。
*   **预制件/资产库:** 允许用户保存常用刚体或组合（例如一扇门）为预制件，方便复用。
*   **高级编辑工具:** 贝塞尔曲线工具、对齐工具、网格吸附等。
*   **Undo/Redo功能:** 提供撤销和重做操作历史记录。
*   **保存为图片:** 将设计画布导出为图片文件。

