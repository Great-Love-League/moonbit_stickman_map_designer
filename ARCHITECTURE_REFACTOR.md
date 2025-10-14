# 架构重构计划：支持多 Fixture 的 Body

## 🎯 问题说明

当前实现中，一个 Body 只能包含一个 Shape，这不符合标准的 Box2D 架构。

### 标准 Box2D 架构
```
Body (刚体)
├── Fixture 1 (夹具)
│   ├── Shape (形状: box/circle/polygon)
│   └── Properties (密度/摩擦力/弹性)
├── Fixture 2
│   ├── Shape
│   └── Properties
└── ...

Joint (关节) - 连接两个 Bodies
```

### 当前错误的架构
```
Body (刚体)
└── 单个 Shape + 物理属性混合
```

## 📋 重构计划

### 阶段 1：类型定义重构 ✅
```typescript
interface Fixture {
  id: string;
  shapeType: 'box' | 'circle' | 'polygon';
  // 形状参数（局部坐标）
  width?: number;
  height?: number;
  radius?: number;
  vertices?: Vector2[];
  // Fixture 级别的物理属性
  density: number;
  friction: number;
  restitution: number;
}

interface Body {
  id: string;
  type: 'body';
  position: Vector2;
  angle: number;
  bodyType: BodyType;
  fixtures: Fixture[];  // 关键变化：支持多个 Fixtures
  // Body 级别的物理属性
  linearDamping: number;
  angularDamping: number;
  gravityScale: number;
  fixedRotation: boolean;
}
```

### 阶段 2：核心功能适配

#### 2.1 创建 Body 的函数
```typescript
// 旧：直接创建带单个形状的 Body
createBody(shapeType, x, y, width, height)

// 新：创建 Body + 第一个 Fixture
createBodyWithFixture(shapeType, x, y, width, height) {
  const body = createEmptyBody(x, y);
  const fixture = createFixture(shapeType, width, height);
  body.fixtures.push(fixture);
  return body;
}
```

#### 2.2 碰撞检测 (hitTest)
```typescript
// 需要遍历 Body 的所有 Fixtures
hitTest(x, y) {
  for (body of bodies) {
    for (fixture of body.fixtures) {
      if (fixtureContainsPoint(fixture, x, y, body.position, body.angle)) {
        return body;
      }
    }
  }
}
```

#### 2.3 渲染 (render)
```typescript
// 需要渲染每个 Body 的所有 Fixtures
renderBody(body) {
  for (fixture of body.fixtures) {
    renderFixture(fixture, body.position, body.angle);
  }
}
```

#### 2.4 属性面板
```typescript
// 需要显示：
// 1. Body 级别的属性（位置、角度、阻尼等）
// 2. 选中的 Fixture 属性（密度、摩擦力等）
// 3. Fixture 列表（可以选择编辑哪个 Fixture）
```

### 阶段 3：新增功能

#### 3.1 添加 Fixture 到现有 Body
- UI：选中 Body 后，显示"添加 Fixture"按钮
- 工具：进入"添加 Fixture 模式"
- 绘制：在 Body 的局部坐标系中绘制新形状

#### 3.2 编辑/删除 Fixture
- 选择：点击 Body 时，高亮显示所有 Fixtures
- 细选：再次点击选择具体的 Fixture
- 删除：删除选中的 Fixture（保留至少一个）

#### 3.3 Fixture 列表管理
- 显示当前 Body 的所有 Fixtures
- 可以切换选择不同的 Fixture 编辑属性
- 显示/隐藏特定 Fixture

## 🔄 向后兼容

### 迁移旧数据
```typescript
function migrateOldBodyFormat(oldBody) {
  return {
    id: oldBody.id,
    type: 'body',
    position: oldBody.position,
    angle: oldBody.angle,
    bodyType: oldBody.bodyType,
    fixtures: [{
      id: generateId('fixture_'),
      shapeType: oldBody.shapeType,
      width: oldBody.width,
      height: oldBody.height,
      radius: oldBody.radius,
      vertices: oldBody.vertices,
      density: oldBody.density || 1.0,
      friction: oldBody.friction || 0.3,
      restitution: oldBody.restitution || 0.5
    }],
    linearDamping: oldBody.linearDamping || 0,
    angularDamping: oldBody.angularDamping || 0,
    gravityScale: oldBody.gravityScale || 1,
    fixedRotation: oldBody.fixedRotation || false
  };
}
```

## 📝 实现优先级

### MVP（最小可行产品）
1. ✅ 重构类型定义
2. 🚧 适配现有功能（单 Fixture 模式）
   - 创建 Body 时自动创建一个 Fixture
   - 保持现有 UI 不变
   - 所有操作针对 Body 的第一个 Fixture
3. 🚧 数据迁移函数

### 完整版本
4. ⏳ UI 改进：Fixture 列表面板
5. ⏳ 添加 Fixture 功能
6. ⏳ 编辑/删除单个 Fixture
7. ⏳ 复合形状示例和模板

## 🎯 当前状态

- [x] 类型定义已重构
- [ ] 需要适配所有使用旧 Body 属性的代码
- [ ] 需要测试所有功能

## 📊 影响范围

### 需要修改的文件
- `src/main.ts` - 主要逻辑（约 60+ 处）
- `src/core/commands.ts` - 命令系统
- API 导出格式（已符合标准）

### 需要修改的函数
1. `createBody` → `createBodyWithFixture`
2. `hitTest` - 遍历所有 Fixtures
3. `render` - 渲染所有 Fixtures
4. `updateDrawingShape` - 更新 Fixture 属性
5. `generateBodyProperties` - 显示 Fixture 信息
6. `bindBodyPropertyEvents` - 绑定 Fixture 属性
7. `exportBox2D` - 导出格式（可能已兼容）

---

**重构负责人**: GitHub Copilot  
**创建时间**: 2024-01  
**状态**: 进行中
