# Box2D 地图设计器 - 使用手册

## 目录

1. [简介](#简介)
2. [快速开始](#快速开始)
3. [界面介绍](#界面介绍)
4. [工具使用](#工具使用)
5. [属性编辑](#属性编辑)
6. [文件操作](#文件操作)
7. [Box2D导出](#box2d导出)
8. [键盘快捷键](#键盘快捷键)
9. [常见问题](#常见问题)

---

## 简介

Box2D 地图设计器是一个基于Web的2D物理场景编辑器，允许您通过直观的图形界面创建和编辑Box2D物理引擎所需的刚体和关节。

### 主要功能

- ✅ 创建矩形、圆形、多边形刚体
- ✅ 创建距离关节和旋转关节
- ✅ 可视化编辑物理属性
- ✅ 保存/加载地图文件
- ✅ 导出Box2D兼容的JSON格式
- ✅ 实时预览和编辑

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

浏览器会自动打开 `http://localhost:3000`

### 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录

---

## 界面介绍

### 顶部工具栏

工具栏分为以下几个区域：

1. **应用标题**：显示应用名称
2. **形状工具**：选择、矩形、圆形、多边形
3. **关节工具**：距离关节、旋转关节
4. **删除工具**：删除选中对象
5. **文件操作**：新建、保存、加载、导出、演示

### 主画布区

- **设计画布**：中央的白色区域，用于创建和编辑对象
- **网格**：20像素为单位的参考网格
- **状态栏**：显示当前工具、对象数量、鼠标坐标和提示信息

### 右侧属性面板

- 显示选中对象的详细属性
- 可以实时编辑物理参数
- 分组显示不同类型的属性

---

## 工具使用

### 1. 选择工具 (V)

**用途**：选择和移动对象

**操作**：
- 单击对象以选中
- 拖动选中的对象以移动
- 按 `Delete` 键删除选中对象

### 2. 矩形工具 (R)

**用途**：创建矩形刚体

**操作**：
1. 点击工具栏中的"矩形"按钮
2. 在画布上按下鼠标左键
3. 拖动鼠标调整矩形大小
4. 释放鼠标完成创建

**提示**：矩形的最小尺寸为 20x20 像素

### 3. 圆形工具 (C)

**用途**：创建圆形刚体

**操作**：
1. 点击工具栏中的"圆形"按钮
2. 在画布上按下鼠标左键
3. 拖动鼠标调整圆形半径
4. 释放鼠标完成创建

**提示**：圆形的最小半径为 10 像素

### 4. 多边形工具 (P)

**用途**：创建多边形刚体

**操作**：
1. 点击工具栏中的"多边形"按钮
2. 在画布上依次点击以添加顶点
3. 双击或按 `Enter` 键完成创建

**提示**：
- 至少需要 3 个顶点
- 顶点会自动连接成封闭多边形
- 建议按逆时针顺序添加顶点

### 5. 距离关节工具 (D)

**用途**：在两个刚体之间创建距离关节（弹簧效果）

**操作**：
1. 点击工具栏中的"距离关节"按钮
2. 点击第一个刚体，选择锚点位置
3. 点击第二个刚体，选择第二个锚点位置
4. 关节自动创建

**说明**：
- 距离关节会保持两个锚点之间的距离
- 可以设置频率和阻尼比来模拟弹簧效果

### 6. 旋转关节工具 (J)

**用途**：在两个刚体之间创建旋转关节（铰链效果）

**操作**：
1. 点击工具栏中的"旋转关节"按钮
2. 点击第一个刚体，选择枢轴点位置
3. 点击第二个刚体，选择第二个枢轴点位置
4. 关节自动创建

**说明**：
- 旋转关节允许两个刚体围绕共同的枢轴点旋转
- 可以设置角度限制和马达

### 7. 删除工具 (Delete)

**用途**：快速删除对象

**操作**：
- 点击工具栏中的"删除"按钮
- 点击要删除的对象

---

## 属性编辑

选中对象后，右侧属性面板会显示可编辑的属性。

### 刚体属性

#### 刚体类型

- **Static (静态)**：不受力影响，固定不动（如地面、墙壁）
- **Dynamic (动态)**：受力和重力影响，可以移动和旋转
- **Kinematic (运动学)**：可以移动但不受力影响（如移动平台）

#### 物理属性

| 属性 | 说明 | 范围 | 默认值 |
|------|------|------|--------|
| 密度 (Density) | 质量分布，影响总质量 | ≥ 0 | 1.0 |
| 摩擦力 (Friction) | 表面摩擦系数 | 0-1 | 0.3 |
| 弹性 (Restitution) | 碰撞反弹系数 | 0-1 | 0.5 |
| 线性阻尼 (Linear Damping) | 移动速度衰减 | ≥ 0 | 0.0 |
| 角阻尼 (Angular Damping) | 旋转速度衰减 | ≥ 0 | 0.0 |
| 重力缩放 (Gravity Scale) | 重力影响程度 | 任意 | 1.0 |

#### 其他选项

- **固定旋转 (Fixed Rotation)**：勾选后刚体不会旋转

### 距离关节属性

| 属性 | 说明 | 默认值 |
|------|------|--------|
| 长度 | 关节的自然长度（自动计算，只读） | - |
| 频率 (Hz) | 弹簧振动频率，越大越硬 | 4.0 |
| 阻尼比 (Damping Ratio) | 振动衰减，0=无阻尼，1=临界阻尼 | 0.5 |

### 旋转关节属性

| 属性 | 说明 | 默认值 |
|------|------|--------|
| 启用角度限制 | 是否限制旋转角度 | false |
| 下限角度 | 最小旋转角度（度） | -90 |
| 上限角度 | 最大旋转角度（度） | 90 |

**注意**：角度以度为单位显示，但内部存储为弧度。

---

## 文件操作

### 新建地图

点击"新建"按钮，清空当前地图（会提示确认）。

### 保存地图

点击"保存"按钮，将当前地图保存为 JSON 文件（默认文件名：`map.json`）。

**文件格式**：
```json
[
  {
    "id": "body_...",
    "type": "body",
    "shapeType": "box",
    "position": { "x": 100, "y": 200 },
    "angle": 0,
    "width": 80,
    "height": 60,
    "bodyType": "dynamic",
    "density": 1.0,
    "friction": 0.3,
    "restitution": 0.5,
    ...
  },
  ...
]
```

### 加载地图

点击"加载"按钮，选择之前保存的 JSON 文件以继续编辑。

---

## Box2D导出

### 导出格式

点击"导出"按钮，生成 Box2D 引擎可直接使用的 JSON 文件（默认文件名：`box2d_export.json`）。

### JSON 格式说明

导出的 JSON 文件包含三个主要部分：

#### 1. 世界设置 (world_settings)

```json
{
  "world_settings": {
    "gravity": [0, -10],
    "allow_sleeping": true,
    "auto_clear_forces": true
  }
}
```

- `gravity`: 重力向量 [x, y]，米/秒²
- `allow_sleeping`: 是否允许刚体休眠以优化性能
- `auto_clear_forces`: 每步后是否自动清除力

#### 2. 刚体 (bodies)

```json
{
  "id": "body_1",
  "body_def": {
    "type": "dynamic",
    "position": [5.0, 10.0],
    "angle": 0,
    "linear_velocity": [0, 0],
    "angular_velocity": 0,
    "linear_damping": 0,
    "angular_damping": 0,
    "allow_sleep": true,
    "awake": true,
    "fixed_rotation": false,
    "bullet": false,
    "gravity_scale": 1
  },
  "fixtures": [
    {
      "shape": {
        "type": "box",
        "params": {
          "width": 2.0,
          "height": 1.5
        }
      },
      "fixture_def": {
        "density": 1.0,
        "friction": 0.3,
        "restitution": 0.5,
        "is_sensor": false,
        "filter_category_bits": 1,
        "filter_mask_bits": 65535,
        "filter_group_index": 0
      }
    }
  ],
  "visual_properties": {},
  "user_data": {}
}
```

**单位转换**：
- 位置、尺寸：像素 ÷ 20 = 米
- 角度：弧度（无需转换）
- 速度：像素/秒 ÷ 20 = 米/秒

#### 3. 关节 (joints)

**距离关节示例**：
```json
{
  "id": "joint_1",
  "joint_type": "distance",
  "body_a": "body_1",
  "body_b": "body_2",
  "joint_def": {
    "local_anchor_a": [0, -0.5],
    "local_anchor_b": [0, 2],
    "length": 5.0,
    "frequency_hz": 4.0,
    "damping_ratio": 0.5,
    "collide_connected": false
  }
}
```

**旋转关节示例**：
```json
{
  "id": "joint_2",
  "joint_type": "revolute",
  "body_a": "body_2",
  "body_b": "body_3",
  "joint_def": {
    "local_anchor_a": [1, 0],
    "local_anchor_b": [-0.5, 0],
    "reference_angle": 0.5,
    "enable_limit": true,
    "lower_angle": -1.57,
    "upper_angle": 1.57,
    "enable_motor": false,
    "motor_speed": 0,
    "max_motor_torque": 0,
    "collide_connected": false
  }
}
```

### 在Box2D中使用导出文件

```javascript
// 1. 加载 box2d.js 库
const b2World = Box2D.Dynamics.b2World;
const b2Vec2 = Box2D.Common.Math.b2Vec2;
// ... 其他 Box2D 类

// 2. 读取导出的 JSON
const data = JSON.parse(exportedJsonString);

// 3. 创建世界
const world = new b2World(
  new b2Vec2(data.world_settings.gravity[0], data.world_settings.gravity[1]),
  data.world_settings.allow_sleeping
);

// 4. 创建刚体
data.bodies.forEach(bodyData => {
  const bodyDef = new b2BodyDef();
  bodyDef.type = bodyData.body_def.type === 'dynamic' ? b2Body.b2_dynamicBody : 
                 bodyData.body_def.type === 'static' ? b2Body.b2_staticBody :
                 b2Body.b2_kinematicBody;
  bodyDef.position.Set(bodyData.body_def.position[0], bodyData.body_def.position[1]);
  bodyDef.angle = bodyData.body_def.angle;
  
  const body = world.CreateBody(bodyDef);
  
  // 创建夹具
  bodyData.fixtures.forEach(fixtureData => {
    const fixtureDef = new b2FixtureDef();
    fixtureDef.density = fixtureData.fixture_def.density;
    fixtureDef.friction = fixtureData.fixture_def.friction;
    fixtureDef.restitution = fixtureData.fixture_def.restitution;
    
    // 创建形状
    if (fixtureData.shape.type === 'box') {
      fixtureDef.shape = new b2PolygonShape();
      fixtureDef.shape.SetAsBox(
        fixtureData.shape.params.width / 2,
        fixtureData.shape.params.height / 2
      );
    } else if (fixtureData.shape.type === 'circle') {
      fixtureDef.shape = new b2CircleShape(fixtureData.shape.params.radius);
    }
    // ... 处理多边形
    
    body.CreateFixture(fixtureDef);
  });
});

// 5. 创建关节（类似流程）
// ...

// 6. 运行模拟
function step() {
  world.Step(1/60, 8, 3);
  world.ClearForces();
  // 渲染...
  requestAnimationFrame(step);
}
step();
```

---

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `V` | 选择工具 |
| `R` | 矩形工具 |
| `C` | 圆形工具 |
| `P` | 多边形工具 |
| `D` | 距离关节工具 |
| `J` | 旋转关节工具 |
| `Delete` | 删除选中对象 |
| `Enter` | 完成多边形绘制（多边形工具） |

---

## 常见问题

### Q1: 为什么我的对象在物理模拟中不动？

**A**: 检查以下几点：
1. 确保刚体类型是 "Dynamic"（静态刚体不会移动）
2. 检查重力缩放是否为 0
3. 确保密度大于 0（否则质量为 0）

### Q2: 如何创建地面？

**A**: 
1. 使用矩形工具创建一个宽而扁的矩形
2. 选中后，将刚体类型改为 "Static"
3. 调整位置到画布底部

### Q3: 距离关节太硬/太软怎么办？

**A**: 调整以下参数：
- **增加硬度**：提高频率 (Frequency Hz)
- **增加柔软度**：降低频率
- **增加阻尼**：提高阻尼比 (Damping Ratio)

### Q4: 旋转关节不限制角度？

**A**: 确保勾选"启用角度限制"复选框，然后设置上下限角度。

### Q5: 如何调整单位换算比例？

**A**: 默认比例是 20 像素 = 1 米。如需修改，编辑 `src/main.ts` 中的 `PIXEL_TO_METER` 常量。

### Q6: 导出的JSON在Box2D中无法使用？

**A**: 
1. 确认使用的 Box2D 版本（建议使用 box2d-js）
2. 检查 JSON 格式是否完整
3. 参考"在Box2D中使用导出文件"章节

### Q7: 如何创建复杂的机械结构？

**A**: 
1. 先创建所有需要的刚体
2. 使用关节连接它们
3. 从基座开始，逐步连接
4. 使用旋转关节创建铰链
5. 使用距离关节创建弹簧

---

## 技术支持

如有问题或建议，请提交 Issue 或 Pull Request。

## 许可证

MIT License

---

**祝您使用愉快！**
