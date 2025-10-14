# 开发者指南

欢迎为Box2D地图设计器项目做出贡献！

## 🎯 项目状态

- ✅ **核心功能**：已完成
- 🚧 **Box2D演示**：待实现
- 💡 **功能扩展**：欢迎贡献

## 📂 项目结构

```
moonbit_stickman_map_designer/
├── src/
│   ├── core/              # 核心模块
│   │   ├── constants.ts   # 常量定义
│   │   ├── types.ts       # TypeScript类型
│   │   └── utils.ts       # 工具函数
│   ├── models/            # 数据模型（部分实现）
│   │   └── MapObject.ts
│   ├── main.ts            # 主应用（1200+行）
│   └── app.css            # 应用样式
├── box2d-js/              # Box2D库
├── index.html             # HTML入口
├── styles.css             # 全局样式
├── vite.config.ts         # Vite配置
├── tsconfig.json          # TypeScript配置
└── package.json           # 项目配置
```

## 🛠️ 开发环境设置

### 必需工具

- Node.js 18+
- npm 或 yarn
- VS Code（推荐）

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## 🏗️ 架构概览

### 核心类：MapDesigner

主应用类，负责：
- Canvas渲染
- 事件处理
- 对象管理
- 属性编辑

### 数据模型

```typescript
// 刚体
interface Body {
  id: string;
  type: 'body';
  shapeType: 'box' | 'circle' | 'polygon';
  position: Vector2;
  angle: number;
  // ... 物理属性
}

// 关节
interface Joint {
  id: string;
  type: 'joint';
  jointType: 'distance' | 'revolute';
  bodyAId: string;
  bodyBId: string;
  // ... 关节参数
}
```

## 📝 代码规范

### TypeScript

```typescript
// 使用接口定义类型
interface MyInterface {
  prop: string;
}

// 使用类型别名组合类型
type MyType = TypeA | TypeB;

// 函数使用箭头函数或方法
private myMethod(): void {
  // ...
}
```

### 命名约定

- **类名**：PascalCase（`MapDesigner`）
- **函数/方法**：camelCase（`getMousePos`）
- **常量**：UPPER_SNAKE_CASE（`PIXEL_TO_METER`）
- **私有成员**：private关键字（`private canvas`）

### 注释

```typescript
/**
 * 函数说明
 * @param param1 参数说明
 * @returns 返回值说明
 */
function myFunction(param1: string): number {
  // 单行注释
  return 0;
}
```

## 🎨 添加新功能

### 示例：添加三角形工具

#### 1. 更新类型定义

```typescript
// src/core/types.ts
type ShapeType = 'box' | 'circle' | 'polygon' | 'triangle';
type Tool = '...' | 'triangle';
```

#### 2. 添加工具按钮

```html
<!-- index.html -->
<button class="tool-btn" data-tool="triangle">
  三角形
</button>
```

#### 3. 实现工具逻辑

```typescript
// src/main.ts
private onMouseDown(e: MouseEvent): void {
  const pos = this.getMousePos(e);
  
  switch (this.currentTool) {
    // ... 其他工具
    case 'triangle':
      this.handleTriangleMouseDown(pos);
      break;
  }
}

private handleTriangleMouseDown(pos: Vector2): void {
  // 实现三角形创建逻辑
  const triangle = this.createTriangle(pos);
  this.objects.push(triangle);
  this.render();
}
```

#### 4. 添加渲染逻辑

```typescript
private renderBody(body: Body): void {
  // ... 现有代码
  if (body.shapeType === 'triangle') {
    this.renderTriangle(body);
  }
}

private renderTriangle(body: Body): void {
  // Canvas绘制代码
}
```

#### 5. 更新导出逻辑

```typescript
private bodyToBox2D(body: Body): any {
  if (body.shapeType === 'triangle') {
    // 转换为Box2D格式
    return {
      shape: {
        type: 'polygon',
        params: {
          vertices: [/* 三角形顶点 */]
        }
      }
    };
  }
}
```

## 🐛 调试技巧

### 控制台日志

```typescript
console.log('鼠标位置:', pos);
console.log('当前对象:', this.objects);
```

### Canvas调试绘制

```typescript
// 绘制调试信息
ctx.fillStyle = 'red';
ctx.fillText(`Debug: ${value}`, x, y);
```

### TypeScript类型检查

```bash
# 运行类型检查
npm run build
```

## 🧪 测试

### 手动测试清单

- [ ] 所有工具都能正常创建对象
- [ ] 对象可以选择和移动
- [ ] 属性编辑实时更新
- [ ] 保存/加载功能正常
- [ ] 导出的JSON格式正确

### 创建测试场景

```typescript
// 在构造函数中添加测试数据
constructor(canvasId: string) {
  // ... 初始化代码
  
  if (import.meta.env.DEV) {
    this.loadTestScene();
  }
}

private loadTestScene(): void {
  // 创建测试对象
  this.objects.push(this.createBody('box', 100, 100, 80, 60));
  this.render();
}
```

## 📊 性能优化

### 渲染优化

```typescript
// 使用requestAnimationFrame
private scheduleRender(): void {
  if (!this.renderScheduled) {
    this.renderScheduled = true;
    requestAnimationFrame(() => {
      this.render();
      this.renderScheduled = false;
    });
  }
}
```

### 事件节流

```typescript
// 使用throttle函数
this.canvas.addEventListener('mousemove', 
  throttle(this.onMouseMove.bind(this), 16) // 60fps
);
```

## 🚀 实现Box2D演示功能

这是最重要的待实现功能！

### 步骤概览

1. **创建演示画布管理**
2. **加载box2d-js库**
3. **解析导出的JSON**
4. **创建Box2D世界**
5. **运行物理模拟**
6. **渲染模拟结果**

### 代码框架

```typescript
class Box2DDemo {
  private world: any; // b2World
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }
  
  async loadScene(box2dData: Box2DExportData): Promise<void> {
    // 创建世界
    const b2World = (window as any).Box2D.Dynamics.b2World;
    const b2Vec2 = (window as any).Box2D.Common.Math.b2Vec2;
    
    const gravity = new b2Vec2(
      box2dData.world_settings.gravity[0],
      box2dData.world_settings.gravity[1]
    );
    this.world = new b2World(gravity, true);
    
    // 创建刚体
    box2dData.bodies.forEach(bodyData => {
      this.createBody(bodyData);
    });
    
    // 创建关节
    box2dData.joints.forEach(jointData => {
      this.createJoint(jointData);
    });
  }
  
  start(): void {
    this.simulate();
  }
  
  private simulate(): void {
    this.world.Step(1/60, 8, 3);
    this.world.ClearForces();
    this.render();
    requestAnimationFrame(() => this.simulate());
  }
  
  private render(): void {
    // 渲染所有刚体
  }
}
```

### 集成到主应用

```typescript
// main.ts
private demo: Box2DDemo | null = null;

constructor(canvasId: string) {
  // ... 现有代码
  
  // 演示按钮事件
  document.getElementById('btn-demo')?.addEventListener('click', 
    () => this.startDemo()
  );
}

private startDemo(): void {
  // 导出Box2D数据
  const box2dData = this.generateBox2DData();
  
  // 隐藏设计画布
  document.getElementById('design-canvas')!.style.display = 'none';
  
  // 显示演示画布
  const demoCanvas = document.getElementById('demo-canvas')!;
  demoCanvas.style.display = 'block';
  
  // 创建演示实例
  this.demo = new Box2DDemo('demo-canvas');
  this.demo.loadScene(box2dData);
  this.demo.start();
}
```

## 📦 发布流程

### 版本号规范

遵循语义化版本：`MAJOR.MINOR.PATCH`

- **MAJOR**：不兼容的API更改
- **MINOR**：向后兼容的功能添加
- **PATCH**：向后兼容的bug修复

### 发布步骤

```bash
# 1. 更新版本号
npm version patch  # 或 minor / major

# 2. 构建
npm run build

# 3. 测试构建结果
npm run preview

# 4. 提交更改
git add .
git commit -m "Release v1.0.1"
git tag v1.0.1

# 5. 推送
git push origin main --tags
```

## 🤝 贡献流程

### 1. Fork项目

点击GitHub页面的Fork按钮

### 2. 克隆到本地

```bash
git clone https://github.com/YOUR_USERNAME/moonbit_stickman_map_designer.git
cd moonbit_stickman_map_designer
```

### 3. 创建特性分支

```bash
git checkout -b feature/my-new-feature
```

### 4. 进行更改

- 编写代码
- 测试功能
- 更新文档

### 5. 提交更改

```bash
git add .
git commit -m "Add: 新功能描述"
```

提交信息格式：
- `Add:` 新功能
- `Fix:` Bug修复
- `Update:` 更新现有功能
- `Docs:` 文档更新
- `Refactor:` 代码重构

### 6. 推送到Fork

```bash
git push origin feature/my-new-feature
```

### 7. 创建Pull Request

在GitHub上创建PR，描述你的更改。

## 📋 待实现功能列表

### 高优先级

- [ ] **Box2D物理演示**
  - 集成box2d-js
  - 实现物理模拟
  - 渲染模拟结果
  
- [ ] **撤销/重做**
  - Command模式实现
  - 历史记录管理
  
- [ ] **键盘快捷键**
  - 完善现有快捷键
  - 添加Ctrl+S保存等

### 中优先级

- [ ] **更多关节类型**
  - 滑块关节（Prismatic）
  - 滑轮关节（Pulley）
  - 齿轮关节（Gear）
  - 焊接关节（Weld）
  
- [ ] **碰撞过滤UI**
  - Category bits编辑
  - Mask bits编辑
  - Group index编辑
  
- [ ] **图层管理**
  - 多图层支持
  - 图层显示/隐藏
  - 图层锁定

### 低优先级

- [ ] **高级编辑**
  - 复制/粘贴
  - 多选
  - 对齐工具
  - 分布工具
  
- [ ] **画布控制**
  - 缩放（Zoom）
  - 平移（Pan）
  - 标尺显示
  
- [ ] **预制件系统**
  - 保存预制件
  - 预制件库
  - 拖放预制件

## 💡 贡献建议

### 适合新手的任务

1. **改进UI样式**
   - 优化按钮图标
   - 改进配色方案
   - 添加工具提示

2. **文档改进**
   - 修复错别字
   - 添加示例
   - 翻译文档

3. **Bug修复**
   - 修复已知问题
   - 改进错误处理

### 进阶任务

1. **功能扩展**
   - 添加新工具
   - 实现撤销/重做
   - 添加快捷键

2. **性能优化**
   - Canvas渲染优化
   - 内存使用优化
   - 大场景优化

3. **Box2D集成**
   - 实现物理演示
   - 添加调试绘制
   - 优化模拟性能

## 📞 联系方式

- **Issues**：报告bug或建议新功能
- **Discussions**：讨论设计和架构
- **Pull Requests**：提交代码贡献

## 📜 许可证

MIT License - 详见LICENSE文件

---

**感谢你的贡献！** 🎉
