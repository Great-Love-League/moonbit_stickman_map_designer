# Box2D 旧版 API 适配说明

## 问题
当前代码使用的是现代 Box2D.js API，但项目中的 box2d.js 是**旧版 Flash 移植版**，API 完全不同。

## 旧版 API 特征
```javascript
// 全局命名空间（不是 window.Box2D）
window.b2World
window.b2BodyDef  
window.b2BoxDef
window.b2CircleDef
window.b2Vec2
window.b2AABB
window.b2RevoluteJointDef
```

## API 对比

### 现代 API（我们当前代码）
```typescript
const Box2D = window.Box2D;
const gravity = new Box2D.b2Vec2(0, -9.8);
const world = new Box2D.b2World(gravity, true);

const bodyDef = new Box2D.b2BodyDef();
bodyDef.type = Box2D.b2Body.b2_dynamicBody;
const body = world.CreateBody(bodyDef);

const fixtureDef = new Box2D.b2FixtureDef();
const shape = new Box2D.b2PolygonShape();
shape.SetAsBox(width/2, height/2);
fixtureDef.shape = shape;
body.CreateFixture(fixtureDef);
```

###旧版 API（box2d-js 实际使用）
```javascript
// 创建世界
const worldAABB = new b2AABB();
worldAABB.minVertex.Set(-1000, -1000);
worldAABB.maxVertex.Set(1000, 1000);
const gravity = new b2Vec2(0, 300); // Y向下为正
const world = new b2World(worldAABB, gravity, true);

// 创建矩形
const boxDef = new b2BoxDef();
boxDef.extents.Set(width, height); // 注意：extents 不是半宽高
boxDef.density = 1.0;
boxDef.friction = 0.3;
boxDef.restitution = 0.5;

const bodyDef = new b2BodyDef();
bodyDef.AddShape(boxDef); // 先添加形状
bodyDef.position.Set(x, y);
const body = world.CreateBody(bodyDef);

// 创建圆形
const circleDef = new b2CircleDef();
circleDef.radius = radius;
circleDef.density = 1.0;

const bodyDef2 = new b2BodyDef();
bodyDef2.AddShape(circleDef);
bodyDef2.position.Set(x, y);
const body2 = world.CreateBody(bodyDef2);

// 创建关节
const jointDef = new b2RevoluteJointDef();
jointDef.anchorPoint.Set(x, y); // 世界坐标
jointDef.body1 = bodyA;
jointDef.body2 = bodyB;
const joint = world.CreateJoint(jointDef);

// 模拟步进
world.Step(timeStep, iterations);
```

## 需要修改的方法

### 1. startPreview()
```typescript
// 检查改为
if (typeof (window as any).b2World === 'undefined') {
  alert('Box2D 未加载！');
  return;
}
```

### 2. initBox2DWorld()
```typescript
const b2AABB = (window as any).b2AABB;
const b2World = (window as any).b2World;
const b2Vec2 = (window as any).b2Vec2;

const worldAABB = new b2AABB();
worldAABB.minVertex.Set(-1000, -1000);
worldAABB.maxVertex.Set(1000, 1000);

const gravity = new b2Vec2(0, 300); // 像素单位
const world = new b2World(worldAABB, gravity, true);
```

### 3. createBox2DBody()
```typescript
const b2BodyDef = (window as any).b2BodyDef;
const b2BoxDef = (window as any).b2BoxDef;
const b2CircleDef = (window as any).b2CircleDef;
const b2PolyDef = (window as any).b2PolyDef;

const bodyDef = new b2BodyDef();

if (shape === 'box') {
  const boxDef = new b2BoxDef();
  boxDef.extents.Set(width, height);
  boxDef.density = isDynamic ? 1.0 : 0;
  bodyDef.AddShape(boxDef);
}

bodyDef.position.Set(x, y);
return world.CreateBody(bodyDef);
```

### 4. createBox2DJoint()
```typescript
const b2RevoluteJointDef = (window as any).b2RevoluteJointDef;

const jointDef = new b2RevoluteJointDef();
jointDef.anchorPoint.Set(worldX, worldY);
jointDef.body1 = bodyA;
jointDef.body2 = bodyB;
return world.CreateJoint(jointDef);
```

### 5. startPreviewAnimation()
```typescript
world.Step(1/60, 10); // 旧版只有2个参数
```

### 6. syncBox2DToObjects()
```typescript
// 读取位置
const pos = b2Body.m_position; // 不是 GetPosition()
body.position.x = pos.x / PPM;
body.position.y = pos.y / PPM;
body.angle = b2Body.m_rotation; // 不是 GetAngle()
```

## 坐标系注意事项

旧版 Box2D-JS 使用：
- **像素单位**（不是米）
- **Y轴向下为正**（与 Canvas 一致）
- 我们的 Box2D 坐标系是 Y 轴向上，所以需要转换

## 完整替换建议

由于 API 差异太大，建议：
1. 要么更换为现代 Box2D.js 库
2. 要么完全重写物理预览部分以适配旧版 API

推荐方案：**下载现代 Box2D.js** 
- GitHub: https://github.com/kripken/box2d.js/
- 使用 Emscripten 编译版本
- 支持现代 API
