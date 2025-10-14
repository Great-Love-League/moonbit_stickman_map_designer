# 文件格式说明

## 概述

Box2D 地图设计器支持两种文件格式：

1. **地图保存格式 (map.json)** - 用于保存和加载设计器中的地图
2. **Box2D 导出格式 (box2d_export.json)** - 用于导出到 Box2D 物理引擎

## 1. 地图保存格式 (map.json)

### 用途
- 保存当前编辑的地图状态
- 可以重新加载继续编辑

### 格式
直接保存对象数组：
```json
[
  {
    "id": "body_xxx",
    "type": "body",
    "shapeType": "box",
    "position": { "x": 100, "y": 200 },
    "angle": 0,
    "width": 50,
    "height": 30,
    "dynamic": true,
    "density": 1,
    "friction": 0.3,
    "restitution": 0.5
  },
  {
    "id": "joint_xxx",
    "type": "joint",
    "jointType": "revolute",
    "bodyAId": "body_xxx",
    "bodyBId": "body_yyy",
    "anchorALocal": { "x": 10, "y": 0 },
    "anchorBLocal": { "x": -10, "y": 0 },
    "enableLimit": false,
    "lowerAngle": -1.57,
    "upperAngle": 1.57
  }
]
```

### 操作
- **保存**: 点击"保存地图"按钮
- **加载**: 点击"加载地图"按钮，选择 map.json 文件

## 2. Box2D 导出格式 (box2d_export.json)

### 用途
- 导出到 Box2D 物理引擎
- 用于 MoonBit 或其他 Box2D 实现

### 格式
包含世界设置、刚体和关节定义：
```json
{
  "world_settings": {
    "gravity": [0, -10],
    "allow_sleeping": true,
    "auto_clear_forces": true
  },
  "bodies": [
    {
      "id": "body_xxx",
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
              "width": 2.5,
              "height": 1.5
            }
          },
          "fixture_def": {
            "density": 1,
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
  ],
  "joints": [
    {
      "id": "joint_xxx",
      "joint_type": "revolute",
      "body_a": "body_xxx",
      "body_b": "body_yyy",
      "joint_def": {
        "local_anchor_a": [0.5, 0],
        "local_anchor_b": [-0.5, 0],
        "reference_angle": 0,
        "enable_limit": false,
        "lower_angle": -1.57,
        "upper_angle": 1.57,
        "enable_motor": false,
        "motor_speed": 0,
        "max_motor_torque": 0,
        "collide_connected": false
      }
    }
  ]
}
```

### 单位转换
- **像素转米**: 除以 20（PIXEL_TO_METER = 20）
- 例如: 100 像素 = 5.0 米

### 操作
- **导出**: 点击"导出 Box2D"按钮
- **注意**: ⚠️ 导出文件**不能**重新导入到设计器

## 常见问题

### Q: 为什么不能加载 box2d_export.json？
**A**: Box2D 导出格式是单向导出的，不支持反向导入。如果需要继续编辑，请使用"保存地图"生成的 map.json 文件。

### Q: 如何保存我的工作？
**A**: 使用"保存地图"按钮保存为 map.json，这样可以重新加载继续编辑。

### Q: 导出的文件在哪里使用？
**A**: box2d_export.json 用于在 Box2D 物理引擎中加载，例如 MoonBit、C++、JavaScript 等 Box2D 实现。

### Q: 为什么有两种格式？
**A**: 
- **map.json**: 设计器内部格式，保留所有编辑信息（像素坐标、完整属性）
- **box2d_export.json**: Box2D 标准格式，转换为物理引擎所需的单位和结构

## 最佳实践

1. **编辑时**: 定期使用"保存地图"保存为 map.json
2. **完成后**: 使用"导出 Box2D"生成 box2d_export.json 用于项目
3. **备份**: 保留 map.json 文件，以便将来修改

## 文件命名建议

```
my_level/
├── my_level.map.json          # 设计器保存文件
└── my_level.box2d.json        # Box2D 导出文件
```

## 技术细节

### 坐标系统
- **设计器**: 像素坐标系（原点在左上角）
- **Box2D**: 米为单位的坐标系（原点通常在中心）

### 数据转换
在导出时会进行以下转换：
- 位置坐标：像素 → 米
- 形状尺寸：像素 → 米
- 局部坐标：像素 → 米
- 其他参数：保持不变

### 关节锚点
- **设计器**: 存储在局部坐标系中（相对于 body）
- **Box2D**: 导出时保持局部坐标，确保关节正确连接
