/**
 * Box2D 地图设计器 - 完整实现
 * 这是一个简化但功能完整的单文件实现
 */

import './app.css';
import { 
  CommandHistory, 
  AddObjectCommand, 
  DeleteObjectCommand, 
  MoveObjectCommand,
  ModifyPropertyCommand 
} from '@core/commands';

// ==================== 类型定义 ====================

type BodyType = 'static' | 'dynamic' | 'kinematic';
type ShapeType = 'box' | 'circle' | 'polygon';
type JointType = 'revolute'; // 'distance' 已屏蔽
type Tool = 'select' | 'rect' | 'circle' | 'polygon' | 'revoluteJoint' | 'delete'; // 移除 'distanceJoint'

interface Vector2 {
  x: number;
  y: number;
}

interface Body {
  id: string;
  type: 'body';
  shapeType: ShapeType;
  position: Vector2;
  angle: number;
  width?: number;
  height?: number;
  radius?: number;
  vertices?: Vector2[];
  bodyType: BodyType;
  density: number;
  friction: number;
  restitution: number;
  linearDamping: number;
  angularDamping: number;
  gravityScale: number;
  fixedRotation: boolean;
}

interface Joint {
  id: string;
  type: 'joint';
  jointType: JointType;
  bodyAId: string;
  bodyBId: string;
  anchorALocal: Vector2;  // Body A 的局部坐标
  anchorBLocal: Vector2;  // Body B 的局部坐标
  length?: number;
  frequencyHz?: number;
  dampingRatio?: number;
  enableLimit?: boolean;
  lowerAngle?: number;
  upperAngle?: number;
  enableMotor?: boolean;
  motorSpeed?: number;
  maxMotorTorque?: number;
  collideConnected?: boolean;
}

type MapObject = Body | Joint;

// ==================== 常量 ====================

// PPM: Pixels Per Meter - 每米多少像素（可配置）
let PPM = 20; // 默认 20 像素 = 1 米

// 视图原点偏移（Box2D 坐标，单位：米）
let ORIGIN_OFFSET_X = 0;
let ORIGIN_OFFSET_Y = 0;

const GRID_SIZE = 1; // 网格大小 1 米
const SELECTION_COLOR = '#00ff00';
const BODY_COLORS = {
  static: '#95a5a6',
  dynamic: '#3498db',
  kinematic: '#9b59b6'
};

// ==================== 工具函数 ====================

function generateId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Box2D 坐标 <-> Canvas 像素坐标转换
// Box2D: Y向上，原点在Canvas中心底部（可偏移），单位：米
// Canvas: Y向下，原点在左上角，单位：像素

function box2DToCanvas(box2dX: number, box2dY: number, canvasWidth: number, canvasHeight: number): Vector2 {
  // 应用原点偏移
  const offsetX = box2dX - ORIGIN_OFFSET_X;
  const offsetY = box2dY - ORIGIN_OFFSET_Y;
  
  // Box2D 坐标转 Canvas 坐标
  return {
    x: canvasWidth / 2 + offsetX * PPM,        // X: 中心偏移
    y: canvasHeight - offsetY * PPM             // Y: 翻转（Box2D向上 -> Canvas向下）
  };
}

function canvasToBox2D(canvasX: number, canvasY: number, canvasWidth: number, canvasHeight: number): Vector2 {
  // Canvas 坐标转 Box2D 坐标
  const box2dX = (canvasX - canvasWidth / 2) / PPM;
  const box2dY = (canvasHeight - canvasY) / PPM;
  
  // 应用原点偏移
  return {
    x: box2dX + ORIGIN_OFFSET_X,
    y: box2dY + ORIGIN_OFFSET_Y
  };
}

function box2DToCanvasScale(box2dValue: number): number {
  // Box2D 标量（长度）转 Canvas 像素
  return box2dValue * PPM;
}

function canvasToBox2DScale(pixelValue: number): number {
  // Canvas 像素转 Box2D 标量（长度）
  return pixelValue / PPM;
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function worldToLocal(worldX: number, worldY: number, bodyX: number, bodyY: number, bodyAngle: number): Vector2 {
  const dx = worldX - bodyX;
  const dy = worldY - bodyY;
  const cos = Math.cos(-bodyAngle);
  const sin = Math.sin(-bodyAngle);
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  };
}

function localToWorld(localX: number, localY: number, bodyX: number, bodyY: number, bodyAngle: number): Vector2 {
  const cos = Math.cos(bodyAngle);
  const sin = Math.sin(bodyAngle);
  return {
    x: bodyX + localX * cos - localY * sin,
    y: bodyY + localX * sin + localY * cos
  };
}

function pointInRotatedRect(px: number, py: number, rectX: number, rectY: number, width: number, height: number, angle: number): boolean {
  const local = worldToLocal(px, py, rectX, rectY, angle);
  const halfW = width / 2;
  const halfH = height / 2;
  return local.x >= -halfW && local.x <= halfW && local.y >= -halfH && local.y <= halfH;
}

function pointInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
  return distance(px, py, cx, cy) <= radius;
}

function pointInPolygon(px: number, py: number, vertices: Vector2[], centerX: number, centerY: number, angle: number): boolean {
  // 将点转换到多边形的本地坐标系
  const local = worldToLocal(px, py, centerX, centerY, angle);
  
  // 使用射线法（Ray Casting）判断点是否在多边形内
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    const intersect = ((yi > local.y) !== (yj > local.y)) &&
      (local.x < (xj - xi) * (local.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ==================== 主应用类 ====================

class MapDesigner {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private objects: MapObject[] = [];
  private selectedObject: MapObject | null = null;
  private currentTool: Tool = 'select';
  
  private drawingObject: Body | null = null;
  private polygonVertices: Vector2[] = [];
  private jointBodyA: Body | null = null;
  private jointAnchorA: Vector2 | null = null;
  
  private isDragging = false;
  private dragStartPos: Vector2 | null = null;
  private mousePos: Vector2 = { x: 0, y: 0 }; // 当前鼠标位置
  
  // 撤销/重做系统
  private commandHistory: CommandHistory;
  private moveStartPos: Vector2 | null = null; // 用于记录移动开始位置
  
  // 关节锚点拖动
  private draggingAnchor: { joint: Joint; isAnchorA: boolean } | null = null;
  private anchorStartPos: Vector2 | null = null;
  
  // 画布平移（中键拖动）
  private isPanning = false;
  private panStartOriginX = 0;
  private panStartOriginY = 0;
  private panStartMouseX = 0;
  private panStartMouseY = 0;
  
  // 顶点编辑模式
  private isEditingVertices = false;
  private editingBody: Body | null = null;
  private draggedVertexIndex: number = -1;
  private vertexDragStart: Vector2 | null = null;
  
  // 物理预览模式
  private isPreviewMode = false;
  private box2dWorld: any = null;
  private box2dBodies: Map<string, any> = new Map();
  private box2dJoints: Map<string, any> = new Map();
  private previewAnimationId: number | null = null;
  private previewPaused = false;
  private previewOriginalState: Array<{id: string, position: Vector2, angle: number}> = [];
  
  // 预览模式的坐标系快照（用于 Box2D 同步）
  private previewPPM = 20;
  private previewOriginOffsetX = 0;
  private previewOriginOffsetY = 0;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.commandHistory = new CommandHistory();
    
    this.setupEventListeners();
    this.updateUndoRedoButtons();
    this.render();
  }

  private setupEventListeners(): void {
    // 工具栏按钮
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tool = (e.currentTarget as HTMLElement).dataset.tool as Tool;
        this.setTool(tool);
      });
    });

    // 画布事件
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
    
    // 画布滚轮缩放
    this.canvas.addEventListener('wheel', this.onMouseWheel.bind(this), { passive: false });
    
    // 阻止右键菜单，以便使用中键
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // 文件操作
    document.getElementById('btn-new')?.addEventListener('click', () => this.newMap());
    document.getElementById('btn-save')?.addEventListener('click', () => this.saveMap());
    document.getElementById('btn-load')?.addEventListener('click', () => this.loadMap());
    document.getElementById('btn-export')?.addEventListener('click', () => this.exportBox2D());
    
    // 属性面板收起/展开
    document.getElementById('btn-toggle-panel')?.addEventListener('click', () => this.togglePanel());
    
    // 物理预览
    document.getElementById('btn-preview')?.addEventListener('click', () => this.togglePreview());
    document.getElementById('btn-preview-play')?.addEventListener('click', () => this.resumePreview());
    document.getElementById('btn-preview-pause')?.addEventListener('click', () => this.pausePreview());
    document.getElementById('btn-preview-reset')?.addEventListener('click', () => this.resetPreview());
    document.getElementById('btn-preview-exit')?.addEventListener('click', () => this.exitPreview());
    
    // 撤销/重做按钮
    document.getElementById('btn-undo')?.addEventListener('click', () => this.undo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.redo());
    
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) this.loadFromFile(file);
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 预览模式下只允许 ESC 键退出
      if (this.isPreviewMode) {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.exitPreview();
        }
        return; // 其他按键在预览模式下无效
      }
      
      // 普通模式下的快捷键
      if (e.key === 'Delete' && this.selectedObject) {
        this.deleteSelected();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      } else if (e.key === ' ') {
        e.preventDefault();
        this.togglePreview();
      }
    });

    // 视图设置控件
    this.setupViewControls();
  }

  private setupViewControls(): void {
    const canvasWidthSlider = document.getElementById('canvas-width-slider') as HTMLInputElement;
    const canvasWidthValue = document.getElementById('canvas-width-value') as HTMLSpanElement;
    const canvasHeightSlider = document.getElementById('canvas-height-slider') as HTMLInputElement;
    const canvasHeightValue = document.getElementById('canvas-height-value') as HTMLSpanElement;
    const ppmSlider = document.getElementById('ppm-slider') as HTMLInputElement;
    const ppmValue = document.getElementById('ppm-value') as HTMLSpanElement;
    const originXSlider = document.getElementById('origin-x-slider') as HTMLInputElement;
    const originXValue = document.getElementById('origin-x-value') as HTMLSpanElement;
    const originYSlider = document.getElementById('origin-y-slider') as HTMLInputElement;
    const originYValue = document.getElementById('origin-y-value') as HTMLSpanElement;
    const resetBtn = document.getElementById('btn-reset-view') as HTMLButtonElement;

    // 画布宽度调整
    canvasWidthSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.canvas.width = value;
      if (canvasWidthValue) canvasWidthValue.textContent = value.toString();
      this.render();
      this.updateStatus('画布宽度已调整为 ' + value + 'px');
    });

    // 画布高度调整
    canvasHeightSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.canvas.height = value;
      if (canvasHeightValue) canvasHeightValue.textContent = value.toString();
      this.render();
      this.updateStatus('画布高度已调整为 ' + value + 'px');
    });

    // PPM 缩放控制
    ppmSlider?.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      PPM = value;
      if (ppmValue) ppmValue.textContent = value.toString();
      this.render();
    });

    // 原点 X 偏移
    originXSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      ORIGIN_OFFSET_X = value;
      if (originXValue) originXValue.textContent = value.toFixed(2);
      this.render();
    });

    // 原点 Y 偏移
    originYSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      ORIGIN_OFFSET_Y = value;
      if (originYValue) originYValue.textContent = value.toFixed(2);
      this.render();
    });

    // 重置视图
    resetBtn?.addEventListener('click', () => {
      // 重置画布大小
      this.canvas.width = 1000;
      this.canvas.height = 700;
      if (canvasWidthSlider) canvasWidthSlider.value = '1000';
      if (canvasWidthValue) canvasWidthValue.textContent = '1000';
      if (canvasHeightSlider) canvasHeightSlider.value = '700';
      if (canvasHeightValue) canvasHeightValue.textContent = '700';
      
      // 重置缩放和原点
      PPM = 20;
      ORIGIN_OFFSET_X = 0;
      ORIGIN_OFFSET_Y = 0;
      
      if (ppmSlider) ppmSlider.value = '20';
      if (ppmValue) ppmValue.textContent = '20';
      if (originXSlider) originXSlider.value = '0';
      if (originXValue) originXValue.textContent = '0.00';
      if (originYSlider) originYSlider.value = '0';
      if (originYValue) originYValue.textContent = '0.00';
      
      this.render();
      this.updateStatus('视图已重置');
    });
  }

  private togglePanel(): void {
    const panel = document.getElementById('property-panel');
    if (panel) {
      panel.classList.toggle('collapsed');
      const isCollapsed = panel.classList.contains('collapsed');
      this.updateStatus(isCollapsed ? '属性面板已收起' : '属性面板已展开');
    }
  }

  private setTool(tool: Tool): void {
    this.currentTool = tool;
    
    // 重置状态
    this.drawingObject = null;
    this.polygonVertices = [];
    this.jointBodyA = null;
    this.jointAnchorA = null;
    
    // 更新UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tool="${tool}"]`)?.classList.add('active');
    
    this.updateStatus(`工具: ${tool}`);
    this.render();
  }

  private getMousePos(e: MouseEvent): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    // 考虑Canvas的缩放比例
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    // 转换为 Box2D 坐标（Y向上，原点在Canvas中心底部，单位：米）
    return canvasToBox2D(canvasX, canvasY, this.canvas.width, this.canvas.height);
  }

  private onMouseDown(e: MouseEvent): void {
    // 预览模式下禁用所有鼠标操作（除了中键平移）
    if (this.isPreviewMode && e.button !== 1) {
      return;
    }
    
    // 中键拖动画布
    if (e.button === 1) {
      e.preventDefault();
      this.isPanning = true;
      this.panStartOriginX = ORIGIN_OFFSET_X;
      this.panStartOriginY = ORIGIN_OFFSET_Y;
      this.panStartMouseX = e.clientX;
      this.panStartMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
      return;
    }
    
    // 只有左键才执行工具操作
    if (e.button !== 0) return;
    
    const pos = this.getMousePos(e);

    switch (this.currentTool) {
      case 'select':
        this.handleSelectMouseDown(pos);
        break;
      case 'rect':
      case 'circle':
        this.handleShapeMouseDown(pos);
        break;
      case 'polygon':
        this.handlePolygonMouseDown(pos);
        break;
      case 'revoluteJoint':
        this.handleJointMouseDown(pos);
        break;
      case 'delete':
        this.handleDeleteMouseDown(pos);
        break;
    }
  }

  private onMouseMove(e: MouseEvent): void {
    // 画布平移（中键拖动）
    if (this.isPanning) {
      const deltaX = e.clientX - this.panStartMouseX;
      const deltaY = e.clientY - this.panStartMouseY;
      
      // 转换为 Box2D 单位（米）并更新原点偏移
      // 向右拖动 = 画布向右 = 原点向左（减小）
      // 向下拖动 = 画布向下 = 原点向上（增大，因为 Box2D Y 向上）
      ORIGIN_OFFSET_X = this.panStartOriginX - deltaX / PPM;
      ORIGIN_OFFSET_Y = this.panStartOriginY + deltaY / PPM;
      
      // 更新滑块显示
      this.updateViewControlsUI();
      this.render();
      return;
    }
    
    // 预览模式下只更新状态栏坐标
    if (this.isPreviewMode) {
      const pos = this.getMousePos(e);
      this.updateStatus('物理预览模式', `坐标: (${pos.x.toFixed(2)}m, ${pos.y.toFixed(2)}m)`, '按 ESC 或点击退出');
      return;
    }
    
    const pos = this.getMousePos(e);
    this.mousePos = pos; // 保存当前鼠标位置（Box2D坐标）
    
    // 更新状态栏
    if (this.isEditingVertices) {
      this.updateStatus(
        `顶点编辑模式 (拖动顶点修改 | 双击/点击空白处退出)`,
        `坐标: (${pos.x.toFixed(2)}m, ${pos.y.toFixed(2)}m)`
      );
    } else {
      this.updateStatus(`工具: ${this.currentTool}`, `坐标: (${pos.x.toFixed(2)}m, ${pos.y.toFixed(2)}m)`);
    }

    // 顶点拖动
    if (this.draggedVertexIndex >= 0 && this.editingBody?.vertices) {
      const body = this.editingBody;
      
      // 将世界坐标转换为物体局部坐标
      const cos = Math.cos(-body.angle); // 注意这里是逆旋转
      const sin = Math.sin(-body.angle);
      const dx = pos.x - body.position.x;
      const dy = pos.y - body.position.y;
      const localX = dx * cos - dy * sin;
      const localY = dx * sin + dy * cos;
      
      // 更新顶点位置
      body.vertices![this.draggedVertexIndex].x = localX;
      body.vertices![this.draggedVertexIndex].y = localY;
      
      this.render();
      return;
    }

    // 拖动锚点
    if (this.draggingAnchor) {
      const { joint, isAnchorA } = this.draggingAnchor;
      const body = this.objects.find(o => o.id === (isAnchorA ? joint.bodyAId : joint.bodyBId)) as Body;
      
      if (body) {
        // 将世界坐标转换为该 body 的局部坐标
        const localPos = worldToLocal(pos.x, pos.y, body.position.x, body.position.y, body.angle);
        
        // 更新锚点位置
        if (isAnchorA) {
          joint.anchorALocal.x = localPos.x;
          joint.anchorALocal.y = localPos.y;
        } else {
          joint.anchorBLocal.x = localPos.x;
          joint.anchorBLocal.y = localPos.y;
        }
        
        // 距离关节已屏蔽，不需要更新长度
      }
      
      this.render();
      return;
    }

    if (this.currentTool === 'select' && this.isDragging && this.selectedObject && this.dragStartPos) {
      const dx = pos.x - this.dragStartPos.x;
      const dy = pos.y - this.dragStartPos.y;
      
      if (this.selectedObject.type === 'body') {
        this.selectedObject.position.x += dx;
        this.selectedObject.position.y += dy;
      }
      
      this.dragStartPos = pos;
      this.render();
    }

    if (this.drawingObject && (this.currentTool === 'rect' || this.currentTool === 'circle')) {
      this.updateDrawingShape(pos);
      this.render();
    }
    
    // 如果在绘制模式下，实时渲染鼠标位置
    if (this.currentTool !== 'select' || this.polygonVertices.length > 0) {
      this.render();
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    // 结束画布平移
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.style.cursor = this.isPreviewMode ? 'default' : 'crosshair';
      return;
    }
    
    // 预览模式下禁用所有编辑操作
    if (this.isPreviewMode) {
      return;
    }
    
    if (this.currentTool === 'rect' || this.currentTool === 'circle') {
      if (this.drawingObject) {
        this.finalizeDrawingShape();
      }
    }

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
      this.updatePropertyPanel(); // 更新属性面板显示新位置
    }
    
    // 处理顶点拖动结束
    if (this.draggedVertexIndex >= 0 && this.vertexDragStart && this.editingBody?.vertices) {
      const body = this.editingBody;
      
      // 创建旧顶点数组（拖动前的位置）
      const oldVertices = JSON.parse(JSON.stringify(body.vertices));
      oldVertices[this.draggedVertexIndex].x = this.vertexDragStart.x;
      oldVertices[this.draggedVertexIndex].y = this.vertexDragStart.y;
      
      // 新顶点数组就是当前的 body.vertices（已经在 onMouseMove 中更新了）
      const newVertices = JSON.parse(JSON.stringify(body.vertices));
      
      // 只有真正移动了才记录命令
      const moved = Math.abs(newVertices[this.draggedVertexIndex].x - oldVertices[this.draggedVertexIndex].x) > 0.01 ||
                    Math.abs(newVertices[this.draggedVertexIndex].y - oldVertices[this.draggedVertexIndex].y) > 0.01;
      
      if (moved) {
        const cmd = new ModifyPropertyCommand(
          body,
          'vertices',
          oldVertices,
          newVertices,
          () => {
            this.render();
            this.updatePropertyPanel();
          }
        );
        this.commandHistory.execute(cmd);
        this.updateUndoRedoButtons();
      }
      
      this.draggedVertexIndex = -1;
      this.vertexDragStart = null;
      this.updatePropertyPanel();
    }

    // 处理移动命令
    if (this.isDragging && this.moveStartPos && this.selectedObject && this.selectedObject.type === 'body') {
      const body = this.selectedObject as Body;
      const oldX = this.moveStartPos.x;
      const oldY = this.moveStartPos.y;
      const newX = body.position.x;
      const newY = body.position.y;
      
      // 只有真正移动了才记录命令
      if (oldX !== newX || oldY !== newY) {
        const cmd = new MoveObjectCommand(
          body,
          oldX,
          oldY,
          newX,
          newY,
          () => this.render()
        );
        this.commandHistory.execute(cmd);
        this.updateUndoRedoButtons();
      }
    }

    this.isDragging = false;
    this.dragStartPos = null;
    this.moveStartPos = null;
  }

  private onDoubleClick(e: MouseEvent): void {
    // 预览模式下禁用双击操作
    if (this.isPreviewMode) {
      return;
    }
    
    // 多边形绘制工具：双击完成多边形
    if (this.currentTool === 'polygon' && this.polygonVertices.length >= 3) {
      // 移除最后一个重复添加的点（双击的第二次点击添加的）
      this.polygonVertices.pop();
      this.finalizePolygon();
      return;
    }
    
    // 选择工具：双击多边形进入顶点编辑模式
    if (this.currentTool === 'select') {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      const worldPos = canvasToBox2D(canvasX, canvasY, this.canvas.width, this.canvas.height);
      
      // 如果已经在编辑模式，退出编辑模式
      if (this.isEditingVertices) {
        this.exitVertexEditMode();
        return;
      }
      
      // 查找点击的物体
      const obj = this.hitTest(worldPos.x, worldPos.y);
      
      // 如果点击的是多边形，进入顶点编辑模式
      if (obj && obj.type === 'body') {
        const body = obj as Body;
        if (body.shapeType === 'polygon' && body.vertices) {
          this.enterVertexEditMode(body);
        }
      }
    }
  }

  private onMouseWheel(e: WheelEvent): void {
    e.preventDefault();
    
    // 获取鼠标在画布上的位置（用于缩放中心）
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // 计算鼠标位置的 Box2D 坐标（缩放前）
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const canvasX = mouseX * scaleX;
    const canvasY = mouseY * scaleY;
    const worldPosBefore = canvasToBox2D(canvasX, canvasY, this.canvas.width, this.canvas.height);
    
    // 调整 PPM（缩放）
    const delta = e.deltaY > 0 ? -1 : 1; // 向上滚动放大，向下滚动缩小
    const oldPPM = PPM;
    PPM = Math.max(5, Math.min(50, PPM + delta));
    
    // 如果 PPM 没有改变（达到边界），直接返回
    if (PPM === oldPPM) return;
    
    // 计算鼠标位置的 Box2D 坐标（缩放后）
    const worldPosAfter = canvasToBox2D(canvasX, canvasY, this.canvas.width, this.canvas.height);
    
    // 调整原点偏移，使鼠标位置的世界坐标保持不变
    ORIGIN_OFFSET_X += (worldPosBefore.x - worldPosAfter.x);
    ORIGIN_OFFSET_Y += (worldPosBefore.y - worldPosAfter.y);
    
    // 更新滑块显示
    this.updateViewControlsUI();
    
    // 如果在预览模式，需要重建 Box2D 世界以适应新的缩放
    if (this.isPreviewMode) {
      this.rebuildBox2DWorldWithNewScale();
    } else {
      this.render();
    }
  }

  private updateViewControlsUI(): void {
    // 更新 PPM 显示
    const ppmSlider = document.getElementById('ppm-slider') as HTMLInputElement;
    const ppmValue = document.getElementById('ppm-value') as HTMLSpanElement;
    if (ppmSlider) ppmSlider.value = PPM.toString();
    if (ppmValue) ppmValue.textContent = PPM.toString();
    
    // 更新原点 X 显示
    const originXSlider = document.getElementById('origin-x-slider') as HTMLInputElement;
    const originXValue = document.getElementById('origin-x-value') as HTMLSpanElement;
    if (originXSlider) {
      // 如果超出滑块范围，设置为边界值
      const clampedX = Math.max(-20, Math.min(20, ORIGIN_OFFSET_X));
      originXSlider.value = clampedX.toString();
    }
    if (originXValue) originXValue.textContent = ORIGIN_OFFSET_X.toFixed(2);
    
    // 更新原点 Y 显示
    const originYSlider = document.getElementById('origin-y-slider') as HTMLInputElement;
    const originYValue = document.getElementById('origin-y-value') as HTMLSpanElement;
    if (originYSlider) {
      // 如果超出滑块范围，设置为边界值
      const clampedY = Math.max(-20, Math.min(20, ORIGIN_OFFSET_Y));
      originYSlider.value = clampedY.toString();
    }
    if (originYValue) originYValue.textContent = ORIGIN_OFFSET_Y.toFixed(2);
  }

  private handleSelectMouseDown(pos: Vector2): void {
    // 顶点编辑模式：尝试选中顶点
    if (this.isEditingVertices && this.editingBody) {
      const vertexIndex = this.hitTestVertex(this.editingBody, pos.x, pos.y);
      if (vertexIndex >= 0) {
        this.draggedVertexIndex = vertexIndex;
        const vertex = this.editingBody.vertices![vertexIndex];
        this.vertexDragStart = { x: vertex.x, y: vertex.y };
        console.log(`开始拖动顶点 ${vertexIndex}`);
        return;
      }
      // 如果没有点击顶点，退出编辑模式
      this.exitVertexEditMode();
    }
    
    // 首先检测是否点击了关节的锚点
    const anchorHit = this.hitTestAnchor(pos.x, pos.y);
    if (anchorHit) {
      // 开始拖动锚点
      this.draggingAnchor = anchorHit;
      this.selectedObject = anchorHit.joint;
      const anchor = anchorHit.isAnchorA ? anchorHit.joint.anchorALocal : anchorHit.joint.anchorBLocal;
      this.anchorStartPos = { x: anchor.x, y: anchor.y };
      this.updatePropertyPanel();
      this.render();
      return;
    }
    
    // 否则检测普通对象
    const obj = this.hitTest(pos.x, pos.y);
    this.selectedObject = obj;
    
    if (obj && obj.type === 'body') {
      this.isDragging = true;
      this.dragStartPos = pos;
      // 记录移动开始位置
      this.moveStartPos = { x: obj.position.x, y: obj.position.y };
    }
    
    this.updatePropertyPanel();
    this.render();
  }
  private handleShapeMouseDown(pos: Vector2): void {
    if (this.currentTool === 'rect') {
      // 创建 1m x 1m 的矩形（Box2D 单位）
      this.drawingObject = this.createBody('box', pos.x, pos.y, 1, 1);
    } else {
      // 创建 0.5m 半径的圆形（Box2D 单位）
      this.drawingObject = this.createBody('circle', pos.x, pos.y, 0.5);
    }
    this.dragStartPos = pos;
  }

  private handlePolygonMouseDown(pos: Vector2): void {
    this.polygonVertices.push({ x: pos.x, y: pos.y });
    this.render();
  }

  private handleJointMouseDown(pos: Vector2): void {
    const body = this.hitTest(pos.x, pos.y);
    
    if (!body || body.type !== 'body') {
      this.updateStatus('关节工具', '', '请点击一个刚体作为第一个连接点');
      return;
    }

    if (!this.jointBodyA) {
      // 选择第一个物体
      this.jointBodyA = body as Body;
      this.jointAnchorA = pos;
      this.updateStatus('关节工具', '', `已选择物体 ${this.jointBodyA.id.substring(0, 8)}..., 请选择第二个刚体`);
    } else {
      const bodyB = body as Body;
      
      // 检查是否选择了同一个物体
      if (this.jointBodyA.id === bodyB.id) {
        this.updateStatus('关节工具', '', '❌ 不能连接同一个物体！请选择另一个刚体');
        return;
      }
      
      // 创建关节
      this.createJoint(this.jointBodyA, bodyB, this.jointAnchorA!, pos);
      this.jointBodyA = null;
      this.jointAnchorA = null;
      this.updateStatus('关节工具', '', '✓ 关节已创建！（默认允许碰撞，可在属性面板修改）');
    }
  }

  private handleDeleteMouseDown(pos: Vector2): void {
    const obj = this.hitTest(pos.x, pos.y);
    if (obj) {
      this.objects = this.objects.filter(o => o.id !== obj.id);
      this.selectedObject = null;
      this.updatePropertyPanel();
      this.render();
    }
  }

  private updateDrawingShape(pos: Vector2): void {
    if (!this.drawingObject || !this.dragStartPos) return;

    const dx = pos.x - this.dragStartPos.x;
    const dy = pos.y - this.dragStartPos.y;

    if (this.drawingObject.shapeType === 'box') {
      // Box2D 坐标，最小 0.5m
      this.drawingObject.width = Math.max(0.5, Math.abs(dx));
      this.drawingObject.height = Math.max(0.5, Math.abs(dy));
      // 位置是起始点和结束点的中点
      this.drawingObject.position.x = this.dragStartPos.x + dx / 2;
      this.drawingObject.position.y = this.dragStartPos.y + dy / 2;
    } else if (this.drawingObject.shapeType === 'circle') {
      // Box2D 坐标，最小半径 0.25m
      this.drawingObject.radius = Math.max(0.25, Math.max(Math.abs(dx), Math.abs(dy)) / 2);
    }
  }

  private finalizeDrawingShape(): void {
    if (this.drawingObject) {
      const newObject = this.drawingObject;
      const cmd = new AddObjectCommand(
        this.objects,
        newObject,
        () => this.render()
      );
      this.commandHistory.execute(cmd);
      
      this.drawingObject = null;
      this.dragStartPos = null;
      this.updateUndoRedoButtons();
      this.render();
    }
  }

  private finalizePolygon(): void {
    if (this.polygonVertices.length >= 3) {
      const centerX = this.polygonVertices.reduce((sum, v) => sum + v.x, 0) / this.polygonVertices.length;
      const centerY = this.polygonVertices.reduce((sum, v) => sum + v.y, 0) / this.polygonVertices.length;
      
      const localVertices = this.polygonVertices.map(v => ({
        x: v.x - centerX,
        y: v.y - centerY
      }));

      const body = this.createBody('polygon', centerX, centerY);
      body.vertices = localVertices;
      
      const cmd = new AddObjectCommand(
        this.objects,
        body,
        () => this.render()
      );
      this.commandHistory.execute(cmd);
      
      this.polygonVertices = [];
      this.updateUndoRedoButtons();
      this.render();
    }
  }

  private createBody(shapeType: ShapeType, x: number, y: number, width?: number, height?: number): Body {
    return {
      id: generateId('body_'),
      type: 'body',
      shapeType,
      position: { x, y },
      angle: 0,
      width,
      height,
      radius: shapeType === 'circle' ? 20 : undefined,
      bodyType: 'dynamic',
      density: 1.0,
      friction: 0.3,
      restitution: 0.5,
      linearDamping: 0,
      angularDamping: 0,
      gravityScale: 1,
      fixedRotation: false
    };
  }

  private createJoint(bodyA: Body, bodyB: Body, anchorA: Vector2, anchorB: Vector2): void {
    // 将世界坐标转换为局部坐标
    const anchorALocal = worldToLocal(anchorA.x, anchorA.y, bodyA.position.x, bodyA.position.y, bodyA.angle);
    const anchorBLocal = worldToLocal(anchorB.x, anchorB.y, bodyB.position.x, bodyB.position.y, bodyB.angle);
    
    const joint: Joint = {
      id: generateId('joint_'),
      type: 'joint',
      jointType: 'revolute', // 只支持旋转关节
      bodyAId: bodyA.id,
      bodyBId: bodyB.id,
      anchorALocal,
      anchorBLocal
    };

    // 初始化旋转关节属性
    joint.enableLimit = false;
    joint.lowerAngle = -Math.PI / 2;
    joint.upperAngle = Math.PI / 2;
    joint.enableMotor = false;
    joint.motorSpeed = 0;
    joint.maxMotorTorque = 1000;
    joint.collideConnected = true;  // 默认允许碰撞（更符合现实物理）

    const cmd = new AddObjectCommand(
      this.objects,
      joint,
      () => this.render()
    );
    this.commandHistory.execute(cmd);
    
    this.updateUndoRedoButtons();
    this.render();
  }

  private hitTest(x: number, y: number): MapObject | null {
    // 将像素阈值转换为 Box2D 单位（米）
    const hitRadius = 10 / PPM; // 10 像素的点击范围
    
    // 优先检测关节的锚点（更小更精确）
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      
      if (obj.type === 'joint') {
        const joint = obj as Joint;
        const bodyA = this.objects.find(o => o.id === joint.bodyAId) as Body;
        const bodyB = this.objects.find(o => o.id === joint.bodyBId) as Body;
        
        if (bodyA && bodyB) {
          const anchorAWorld = localToWorld(
            joint.anchorALocal.x, joint.anchorALocal.y,
            bodyA.position.x, bodyA.position.y, bodyA.angle
          );
          const anchorBWorld = localToWorld(
            joint.anchorBLocal.x, joint.anchorBLocal.y,
            bodyB.position.x, bodyB.position.y, bodyB.angle
          );
          
          // 检测是否点击了锚点
          if (distance(x, y, anchorAWorld.x, anchorAWorld.y) <= hitRadius ||
              distance(x, y, anchorBWorld.x, anchorBWorld.y) <= hitRadius) {
            return joint;
          }
        }
      }
    }
    
    // 然后检测刚体
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      
      if (obj.type === 'body') {
        if (obj.shapeType === 'box' && obj.width && obj.height) {
          if (pointInRotatedRect(x, y, obj.position.x, obj.position.y, obj.width, obj.height, obj.angle)) {
            return obj;
          }
        } else if (obj.shapeType === 'circle' && obj.radius) {
          if (pointInCircle(x, y, obj.position.x, obj.position.y, obj.radius)) {
            return obj;
          }
        } else if (obj.shapeType === 'polygon' && obj.vertices && obj.vertices.length >= 3) {
          if (pointInPolygon(x, y, obj.vertices, obj.position.x, obj.position.y, obj.angle)) {
            return obj;
          }
        }
      }
    }
    return null;
  }

  // 检测点击的是哪个锚点（x, y 为 Box2D 坐标）
  private hitTestAnchor(x: number, y: number): { joint: Joint; isAnchorA: boolean } | null {
    // 将像素阈值转换为 Box2D 单位（米）
    const hitRadius = 10 / PPM; // 10 像素的点击范围
    
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      
      if (obj.type === 'joint') {
        const joint = obj as Joint;
        const bodyA = this.objects.find(o => o.id === joint.bodyAId) as Body;
        const bodyB = this.objects.find(o => o.id === joint.bodyBId) as Body;
        
        if (bodyA && bodyB) {
          const anchorAWorld = localToWorld(
            joint.anchorALocal.x, joint.anchorALocal.y,
            bodyA.position.x, bodyA.position.y, bodyA.angle
          );
          const anchorBWorld = localToWorld(
            joint.anchorBLocal.x, joint.anchorBLocal.y,
            bodyB.position.x, bodyB.position.y, bodyB.angle
          );
          
          // 优先检测锚点 A
          if (distance(x, y, anchorAWorld.x, anchorAWorld.y) <= hitRadius) {
            return { joint, isAnchorA: true };
          }
          // 然后检测锚点 B
          if (distance(x, y, anchorBWorld.x, anchorBWorld.y) <= hitRadius) {
            return { joint, isAnchorA: false };
          }
        }
      }
    }
    return null;
  }

  // ==================== 顶点编辑模式 ====================
  
  private enterVertexEditMode(body: Body): void {
    this.isEditingVertices = true;
    this.editingBody = body;
    this.selectedObject = body;
    console.log(`进入顶点编辑模式: ${body.id}`);
    this.updateStatus('顶点编辑模式', '拖动顶点修改位置', '双击或点击空白处退出');
    this.render();
  }
  
  private exitVertexEditMode(): void {
    this.isEditingVertices = false;
    this.editingBody = null;
    this.draggedVertexIndex = -1;
    this.vertexDragStart = null;
    console.log('退出顶点编辑模式');
    this.updateStatus('退出顶点编辑模式');
    this.render();
  }
  
  private hitTestVertex(body: Body, worldX: number, worldY: number): number {
    if (!body.vertices) return -1;
    
    const hitRadius = 0.3; // 顶点点击半径（米）
    
    for (let i = 0; i < body.vertices.length; i++) {
      const vertex = body.vertices[i];
      // 将本地顶点坐标转换为世界坐标
      const cos = Math.cos(body.angle);
      const sin = Math.sin(body.angle);
      const worldVx = body.position.x + vertex.x * cos - vertex.y * sin;
      const worldVy = body.position.y + vertex.x * sin + vertex.y * cos;
      
      const dist = Math.sqrt(
        (worldX - worldVx) ** 2 + (worldY - worldVy) ** 2
      );
      
      if (dist <= hitRadius) {
        return i;
      }
    }
    
    return -1;
  }

  private deleteSelected(): void {
    if (this.selectedObject) {
      const objToDelete = this.selectedObject;
      const cmd = new DeleteObjectCommand(
        this.objects,
        objToDelete,
        () => {
          this.selectedObject = null;
          this.updatePropertyPanel();
          this.render();
        }
      );
      this.commandHistory.execute(cmd);
      
      this.updateUndoRedoButtons();
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制网格（Box2D 坐标系，每格 GRID_SIZE 米）
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // 计算可视范围的 Box2D 坐标（考虑原点偏移）
    const worldMinX = ORIGIN_OFFSET_X - (width / 2) / PPM;
    const worldMaxX = ORIGIN_OFFSET_X + (width / 2) / PPM;
    const worldMinY = ORIGIN_OFFSET_Y;
    const worldMaxY = ORIGIN_OFFSET_Y + height / PPM;
    
    // 绘制垂直网格线
    for (let x = Math.floor(worldMinX / GRID_SIZE) * GRID_SIZE; x <= worldMaxX; x += GRID_SIZE) {
      const canvasPos = box2DToCanvas(x, 0, width, height);
      ctx.beginPath();
      ctx.moveTo(canvasPos.x, 0);
      ctx.lineTo(canvasPos.x, height);
      ctx.stroke();
    }
    
    // 绘制水平网格线
    for (let y = Math.floor(worldMinY / GRID_SIZE) * GRID_SIZE; y <= worldMaxY; y += GRID_SIZE) {
      const canvasPos = box2DToCanvas(0, y, width, height);
      ctx.beginPath();
      ctx.moveTo(0, canvasPos.y);
      ctx.lineTo(width, canvasPos.y);
      ctx.stroke();
    }

    // 绘制坐标轴标记（Box2D 坐标，米）
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    
    // X 轴标记（每 5米）
    for (let x = Math.ceil(worldMinX); x <= Math.floor(worldMaxX); x++) {
      if (x % 5 === 0) {
        const canvasPos = box2DToCanvas(x, worldMinY, width, height);
        ctx.fillText(`${x}m`, canvasPos.x + 2, height - 5);
      }
    }
    
    // Y 轴标记（每 5米）
    for (let y = Math.ceil(worldMinY); y <= Math.floor(worldMaxY); y++) {
      if (y % 5 === 0) {
        const canvasPos = box2DToCanvas(worldMinX, y, width, height);
        ctx.fillText(`${y}m`, 5, canvasPos.y - 2);
      }
    }
    
    // 绘制原点标记（红色十字）
    const origin = box2DToCanvas(0, 0, width, height);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(origin.x - 10, origin.y);
    ctx.lineTo(origin.x + 10, origin.y);
    ctx.moveTo(origin.x, origin.y - 10);
    ctx.lineTo(origin.x, origin.y + 10);
    ctx.stroke();
    ctx.fillStyle = '#ff0000';
    ctx.font = '11px monospace';
    ctx.fillText('(0,0)', origin.x + 12, origin.y - 5);

    // 绘制对象
    this.objects.forEach(obj => {
      if (obj.type === 'body') {
        this.renderBody(obj);
      } else {
        this.renderJoint(obj);
      }
    });

    // 绘制正在创建的对象
    if (this.drawingObject) {
      this.renderBody(this.drawingObject);
    }

    // 绘制多边形顶点（Box2D 坐标）
    if (this.polygonVertices.length > 0) {
      ctx.strokeStyle = '#3498db';
      ctx.fillStyle = '#3498db';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      const firstCanvas = box2DToCanvas(this.polygonVertices[0].x, this.polygonVertices[0].y, width, height);
      ctx.moveTo(firstCanvas.x, firstCanvas.y);
      for (let i = 1; i < this.polygonVertices.length; i++) {
        const canvasPos = box2DToCanvas(this.polygonVertices[i].x, this.polygonVertices[i].y, width, height);
        ctx.lineTo(canvasPos.x, canvasPos.y);
      }
      ctx.stroke();

      this.polygonVertices.forEach(v => {
        const canvasPos = box2DToCanvas(v.x, v.y, width, height);
        ctx.beginPath();
        ctx.arc(canvasPos.x, canvasPos.y, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // 从最后一个顶点到鼠标位置画虚线
      if (this.polygonVertices.length > 0) {
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const lastVertex = this.polygonVertices[this.polygonVertices.length - 1];
        const lastCanvas = box2DToCanvas(lastVertex.x, lastVertex.y, width, height);
        const mouseCanvas = box2DToCanvas(this.mousePos.x, this.mousePos.y, width, height);
        ctx.moveTo(lastCanvas.x, lastCanvas.y);
        ctx.lineTo(mouseCanvas.x, mouseCanvas.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // 绘制鼠标十字线（仅在创建模式下）
    if (this.currentTool !== 'select' && !this.isDragging) {
      const mouseCanvas = box2DToCanvas(this.mousePos.x, this.mousePos.y, width, height);
      
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      
      // 垂直线
      ctx.beginPath();
      ctx.moveTo(mouseCanvas.x, 0);
      ctx.lineTo(mouseCanvas.x, height);
      ctx.stroke();
      
      // 水平线
      ctx.beginPath();
      ctx.moveTo(0, mouseCanvas.y);
      ctx.lineTo(width, mouseCanvas.y);
      ctx.stroke();
      
      ctx.setLineDash([]);
      
      // 鼠标位置标记
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(mouseCanvas.x, mouseCanvas.y, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // 显示坐标
      ctx.fillStyle = '#333';
      ctx.font = '11px monospace';
      ctx.fillText(`(${this.mousePos.x.toFixed(2)}m, ${this.mousePos.y.toFixed(2)}m)`, 
                   mouseCanvas.x + 10, mouseCanvas.y - 10);
    }
    
    // 绘制关节工具的视觉反馈
    if (this.currentTool === 'revoluteJoint' && this.jointBodyA && this.jointAnchorA) {
      const width = this.canvas.width;
      const height = this.canvas.height;
      
      // 高亮第一个选中的物体
      ctx.save();
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      
      const bodyCenter = box2DToCanvas(this.jointBodyA.position.x, this.jointBodyA.position.y, width, height);
      if (this.jointBodyA.shapeType === 'box' && this.jointBodyA.width && this.jointBodyA.height) {
        const w = this.jointBodyA.width * PPM;
        const h = this.jointBodyA.height * PPM;
        ctx.strokeRect(bodyCenter.x - w / 2 - 5, bodyCenter.y - h / 2 - 5, w + 10, h + 10);
      } else if (this.jointBodyA.shapeType === 'circle' && this.jointBodyA.radius) {
        const r = this.jointBodyA.radius * PPM;
        ctx.beginPath();
        ctx.arc(bodyCenter.x, bodyCenter.y, r + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.setLineDash([]);
      
      // 绘制第一个锚点
      const anchorA = box2DToCanvas(this.jointAnchorA.x, this.jointAnchorA.y, width, height);
      ctx.fillStyle = '#f39c12';
      ctx.beginPath();
      ctx.arc(anchorA.x, anchorA.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // 从锚点到鼠标位置画虚线
      const mouseCanvas = box2DToCanvas(this.mousePos.x, this.mousePos.y, width, height);
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(anchorA.x, anchorA.y);
      ctx.lineTo(mouseCanvas.x, mouseCanvas.y);
      ctx.stroke();
      
      ctx.restore();
    }
  }

  private renderBody(body: Body): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const isSelected = this.selectedObject === body;

    // Box2D → Canvas 坐标转换
    const canvasPos = box2DToCanvas(body.position.x, body.position.y, width, height);

    ctx.save();
    ctx.translate(canvasPos.x, canvasPos.y);
    ctx.rotate(-body.angle);  // Box2D 逆时针为正 → Canvas 顺时针为正

    ctx.fillStyle = BODY_COLORS[body.bodyType];
    ctx.strokeStyle = isSelected ? SELECTION_COLOR : '#2c3e50';
    ctx.lineWidth = isSelected ? 3 : 2;

    if (body.shapeType === 'box' && body.width && body.height) {
      const w = box2DToCanvasScale(body.width);
      const h = box2DToCanvasScale(body.height);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      
      // 绘制方向指示线
      ctx.strokeStyle = isSelected ? '#fff' : '#34495e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();
    } else if (body.shapeType === 'circle' && body.radius) {
      const r = box2DToCanvasScale(body.radius);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // 绘制半径指示线
      ctx.strokeStyle = isSelected ? '#fff' : '#34495e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(r, 0);
      ctx.stroke();
    } else if (body.shapeType === 'polygon' && body.vertices && body.vertices.length > 0) {
      ctx.beginPath();
      const firstVertex = body.vertices[0];
      const firstCanvas = { x: box2DToCanvasScale(firstVertex.x), y: -box2DToCanvasScale(firstVertex.y) };
      ctx.moveTo(firstCanvas.x, firstCanvas.y);
      
      for (let i = 1; i < body.vertices.length; i++) {
        const v = body.vertices[i];
        const vCanvas = { x: box2DToCanvasScale(v.x), y: -box2DToCanvasScale(v.y) };
        ctx.lineTo(vCanvas.x, vCanvas.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 绘制中心点
    ctx.fillStyle = isSelected ? '#fff' : '#2c3e50';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    
    // 顶点编辑模式：绘制可拖动的顶点控制点
    if (this.isEditingVertices && this.editingBody === body && body.vertices) {
      for (let i = 0; i < body.vertices.length; i++) {
        const vertex = body.vertices[i];
        
        // 将本地顶点坐标转换为世界坐标
        const cos = Math.cos(body.angle);
        const sin = Math.sin(body.angle);
        const worldX = body.position.x + vertex.x * cos - vertex.y * sin;
        const worldY = body.position.y + vertex.x * sin + vertex.y * cos;
        
        // 转换为画布坐标
        const canvasVertex = box2DToCanvas(worldX, worldY, width, height);
        
        // 绘制顶点控制点
        ctx.save();
        ctx.fillStyle = this.draggedVertexIndex === i ? '#e74c3c' : '#3498db';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvasVertex.x, canvasVertex.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // 绘制顶点索引
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i.toString(), canvasVertex.x, canvasVertex.y);
        ctx.restore();
      }
    }
    
    // 绘制 ID 标签（在Canvas坐标系中）
    if (isSelected) {
      ctx.fillStyle = '#333';
      ctx.font = '10px monospace';
      ctx.fillText(body.id.substring(0, 12) + '...', canvasPos.x + 10, canvasPos.y - 10);
    }
  }

  private renderJoint(joint: Joint): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const isSelected = this.selectedObject === joint;

    // 找到关联的两个 Body
    const bodyA = this.objects.find(o => o.id === joint.bodyAId) as Body;
    const bodyB = this.objects.find(o => o.id === joint.bodyBId) as Body;
    
    if (!bodyA || !bodyB) return; // Body 不存在则不渲染
    
    // 将局部坐标转换为世界坐标（Box2D）
    const anchorAWorld = localToWorld(
      joint.anchorALocal.x, 
      joint.anchorALocal.y, 
      bodyA.position.x, 
      bodyA.position.y, 
      bodyA.angle
    );
    const anchorBWorld = localToWorld(
      joint.anchorBLocal.x, 
      joint.anchorBLocal.y, 
      bodyB.position.x, 
      bodyB.position.y, 
      bodyB.angle
    );
    
    // 转换为 Canvas 坐标
    const anchorACanvas = box2DToCanvas(anchorAWorld.x, anchorAWorld.y, width, height);
    const anchorBCanvas = box2DToCanvas(anchorBWorld.x, anchorBWorld.y, width, height);

    // 绘制连线
    ctx.strokeStyle = isSelected ? SELECTION_COLOR : '#e67e22';
    ctx.lineWidth = isSelected ? 3 : 2;

    ctx.beginPath();
    ctx.moveTo(anchorACanvas.x, anchorACanvas.y);
    ctx.lineTo(anchorBCanvas.x, anchorBCanvas.y);
    ctx.stroke();

    // 绘制锚点
    const anchorRadius = isSelected ? 7 : 5;
    ctx.fillStyle = '#e74c3c'; // 旋转关节使用红色
    
    // 检测是否正在拖动某个锚点
    const isDraggingAnchorA = this.draggingAnchor && this.draggingAnchor.joint === joint && this.draggingAnchor.isAnchorA;
    const isDraggingAnchorB = this.draggingAnchor && this.draggingAnchor.joint === joint && !this.draggingAnchor.isAnchorA;
    
    // 锚点 A
    ctx.beginPath();
    ctx.arc(anchorACanvas.x, anchorACanvas.y, isDraggingAnchorA ? 10 : anchorRadius, 0, Math.PI * 2);
    ctx.fill();
    if (isSelected || isDraggingAnchorA) {
      ctx.strokeStyle = isDraggingAnchorA ? '#00ff00' : '#fff';
      ctx.lineWidth = isDraggingAnchorA ? 3 : 2;
      ctx.stroke();
    }
    
    // 锚点 B
    ctx.fillStyle = '#9b59b6'; // 锚点 B 使用紫色区分
    ctx.beginPath();
    ctx.arc(anchorBCanvas.x, anchorBCanvas.y, isDraggingAnchorB ? 10 : anchorRadius, 0, Math.PI * 2);
    ctx.fill();
    if (isSelected || isDraggingAnchorB) {
      ctx.strokeStyle = isDraggingAnchorB ? '#00ff00' : '#fff';
      ctx.lineWidth = isDraggingAnchorB ? 3 : 2;
      ctx.stroke();
    }
    
    // 标签
    if (isSelected) {
      ctx.fillStyle = '#333';
      ctx.font = '10px monospace';
      const midX = (anchorACanvas.x + anchorBCanvas.x) / 2;
      const midY = (anchorACanvas.y + anchorBCanvas.y) / 2;
      ctx.fillText('Revolute Joint', midX + 5, midY - 5);
    }
  }

  private updatePropertyPanel(): void {
    const panel = document.getElementById('property-content');
    if (!panel) return;

    if (!this.selectedObject) {
      panel.innerHTML = '<p class="placeholder">请选择一个对象以编辑其属性</p>';
      return;
    }

    if (this.selectedObject.type === 'body') {
      panel.innerHTML = this.generateBodyProperties(this.selectedObject);
      this.bindBodyPropertyEvents();
    } else {
      panel.innerHTML = this.generateJointProperties(this.selectedObject);
      this.bindJointPropertyEvents();
    }
  }

  private generateBodyProperties(body: Body): string {
    // 生成形状尺寸编辑部分
    let shapePropertiesHTML = '';
    
    if (body.shapeType === 'box' && body.width !== undefined && body.height !== undefined) {
      shapePropertiesHTML = `
        <div class="property-group">
          <div class="property-group-title">矩形尺寸 (单位：米)</div>
          <div class="property-field">
            <label>宽度 (Width)</label>
            <input type="number" id="prop-width" class="body-prop" value="${body.width.toFixed(2)}" step="0.1" min="0.1">
          </div>
          <div class="property-field">
            <label>高度 (Height)</label>
            <input type="number" id="prop-height" class="body-prop" value="${body.height.toFixed(2)}" step="0.1" min="0.1">
          </div>
        </div>
      `;
    } else if (body.shapeType === 'circle' && body.radius !== undefined) {
      shapePropertiesHTML = `
        <div class="property-group">
          <div class="property-group-title">圆形尺寸 (单位：米)</div>
          <div class="property-field">
            <label>半径 (Radius)</label>
            <input type="number" id="prop-radius" class="body-prop" value="${body.radius.toFixed(2)}" step="0.1" min="0.1">
          </div>
        </div>
      `;
    } else if (body.shapeType === 'polygon' && body.vertices && body.vertices.length > 0) {
      const verticesHTML = body.vertices.map((v, i) => `
        <div class="vertex-field">
          <label>顶点 ${i + 1}</label>
          <div class="input-group">
            <input type="number" id="prop-vertex-${i}-x" class="body-prop vertex-input" 
                   value="${v.x.toFixed(2)}" step="0.1" placeholder="X">
            <input type="number" id="prop-vertex-${i}-y" class="body-prop vertex-input" 
                   value="${v.y.toFixed(2)}" step="0.1" placeholder="Y">
          </div>
        </div>
      `).join('');
      
      shapePropertiesHTML = `
        <div class="property-group">
          <div class="property-group-title">多边形顶点 (单位：米)</div>
          ${verticesHTML}
          <div class="hint">提示：顶点坐标相对于物体中心</div>
        </div>
      `;
    }
    
    return `
      <div class="object-info">
        <div class="object-info-row">
          <span class="object-info-label">ID:</span>
          <span class="object-info-value">${body.id}</span>
        </div>
        <div class="object-info-row">
          <span class="object-info-label">类型:</span>
          <span class="object-info-value">刚体 (${body.shapeType})</span>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">位置坐标 (单位：米)</div>
        <div class="property-field">
          <label>X 坐标</label>
          <input type="number" id="prop-position-x" class="body-prop" value="${body.position.x.toFixed(2)}" step="0.1">
        </div>
        <div class="property-field">
          <label>Y 坐标</label>
          <input type="number" id="prop-position-y" class="body-prop" value="${body.position.y.toFixed(2)}" step="0.1">
        </div>
        <div class="property-field">
          <label>旋转角度 (度)</label>
          <input type="number" id="prop-angle" class="body-prop" value="${(body.angle * 180 / Math.PI).toFixed(2)}" step="1">
        </div>
      </div>

      ${shapePropertiesHTML}

      <div class="property-group">
        <div class="property-group-title">刚体类型</div>
        <div class="property-field">
          <select id="prop-bodyType" class="body-prop">
            <option value="static" ${body.bodyType === 'static' ? 'selected' : ''}>Static (静态)</option>
            <option value="dynamic" ${body.bodyType === 'dynamic' ? 'selected' : ''}>Dynamic (动态)</option>
            <option value="kinematic" ${body.bodyType === 'kinematic' ? 'selected' : ''}>Kinematic (运动学)</option>
          </select>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">物理属性</div>
        <div class="property-field">
          <label>密度 (Density)</label>
          <input type="number" id="prop-density" class="body-prop" value="${body.density}" step="0.1" min="0">
        </div>
        <div class="property-field">
          <label>摩擦力 (Friction)</label>
          <input type="number" id="prop-friction" class="body-prop" value="${body.friction}" step="0.1" min="0" max="1">
        </div>
        <div class="property-field">
          <label>弹性 (Restitution)</label>
          <input type="number" id="prop-restitution" class="body-prop" value="${body.restitution}" step="0.1" min="0" max="1">
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">阻尼</div>
        <div class="property-field">
          <label>线性阻尼</label>
          <input type="number" id="prop-linearDamping" class="body-prop" value="${body.linearDamping}" step="0.1" min="0">
        </div>
        <div class="property-field">
          <label>角阻尼</label>
          <input type="number" id="prop-angularDamping" class="body-prop" value="${body.angularDamping}" step="0.1" min="0">
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">其他</div>
        <div class="property-field">
          <label>重力缩放</label>
          <input type="number" id="prop-gravityScale" class="body-prop" value="${body.gravityScale}" step="0.1">
        </div>
        <div class="property-field property-field-inline">
          <input type="checkbox" id="prop-fixedRotation" class="body-prop" ${body.fixedRotation ? 'checked' : ''}>
          <label>固定旋转</label>
        </div>
      </div>

      <div class="btn-group">
        <button id="btn-delete-obj" class="btn">删除对象</button>
      </div>
    `;
  }

  private generateJointProperties(joint: Joint): string {
    const bodyA = this.objects.find(o => o.id === joint.bodyAId);
    const bodyB = this.objects.find(o => o.id === joint.bodyBId);
    
    return `
      <div class="object-info">
        <div class="object-info-row">
          <span class="object-info-label">ID:</span>
          <span class="object-info-value">${joint.id}</span>
        </div>
        <div class="object-info-row">
          <span class="object-info-label">类型:</span>
          <span class="object-info-value">旋转关节</span>
        </div>
        <div class="object-info-row">
          <span class="object-info-label">Body A:</span>
          <span class="object-info-value">${bodyA ? (bodyA as Body).id.substring(0, 12) + '...' : 'N/A'}</span>
        </div>
        <div class="object-info-row">
          <span class="object-info-label">Body B:</span>
          <span class="object-info-value">${bodyB ? (bodyB as Body).id.substring(0, 12) + '...' : 'N/A'}</span>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">锚点位置（局部坐标，单位：米）</div>
        <div class="property-field">
          <label>锚点 A - X (m)</label>
          <input type="number" id="prop-anchorALocalX" class="joint-prop" value="${joint.anchorALocal.x.toFixed(2)}" step="0.1">
        </div>
        <div class="property-field">
          <label>锚点 A - Y (m)</label>
          <input type="number" id="prop-anchorALocalY" class="joint-prop" value="${joint.anchorALocal.y.toFixed(2)}" step="0.1">
        </div>
        <div class="property-field">
          <label>锚点 B - X (m)</label>
          <input type="number" id="prop-anchorBLocalX" class="joint-prop" value="${joint.anchorBLocal.x.toFixed(2)}" step="0.1">
        </div>
        <div class="property-field">
          <label>锚点 B - Y (m)</label>
          <input type="number" id="prop-anchorBLocalY" class="joint-prop" value="${joint.anchorBLocal.y.toFixed(2)}" step="0.1">
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">旋转关节属性</div>
        <div class="property-field property-field-inline">
          <input type="checkbox" id="prop-enableLimit" class="joint-prop" ${joint.enableLimit ? 'checked' : ''}>
          <label>启用角度限制</label>
        </div>
        <div class="property-field">
          <label>下限角度 (度)</label>
          <input type="number" id="prop-lowerAngle" class="joint-prop" value="${Math.round((joint.lowerAngle || 0) * 180 / Math.PI)}" step="5">
        </div>
        <div class="property-field">
          <label>上限角度 (度)</label>
          <input type="number" id="prop-upperAngle" class="joint-prop" value="${Math.round((joint.upperAngle || 0) * 180 / Math.PI)}" step="5">
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">马达控制</div>
        <div class="property-field property-field-inline">
          <input type="checkbox" id="prop-enableMotor" class="joint-prop" ${joint.enableMotor ? 'checked' : ''}>
          <label>启用马达</label>
        </div>
        <div class="property-field">
          <label>马达速度 (rad/s)</label>
          <input type="number" id="prop-motorSpeed" class="joint-prop" value="${(joint.motorSpeed || 0).toFixed(2)}" step="0.1">
          <div class="hint">正值：逆时针旋转 | 负值：顺时针旋转</div>
        </div>
        <div class="property-field">
          <label>最大扭矩</label>
          <input type="number" id="prop-maxMotorTorque" class="joint-prop" value="${joint.maxMotorTorque || 1000}" step="100" min="0">
          <div class="hint">扭矩越大，马达力量越强</div>
        </div>
      </div>

      <div class="property-group">
        <div class="property-group-title">碰撞设置</div>
        <div class="property-field property-field-inline">
          <input type="checkbox" id="prop-collideConnected" class="joint-prop" ${joint.collideConnected ? 'checked' : ''}>
          <label>允许连接物体碰撞</label>
        </div>
        <div class="hint">勾选：连接的物体会发生碰撞（如人体关节）<br>不勾选：连接的物体穿透彼此（适合特殊效果）</div>
      </div>

      <div class="btn-group">
        <button id="btn-delete-obj" class="btn">删除对象</button>
      </div>
    `;
  }

  private bindBodyPropertyEvents(): void {
    const updateProp = (id: string, prop: keyof Body, isCheckbox = false) => {
      const elem = document.getElementById(id) as HTMLInputElement;
      if (!elem || !this.selectedObject || this.selectedObject.type !== 'body') return;
      
      elem.addEventListener(isCheckbox ? 'change' : 'input', () => {
        if (this.selectedObject && this.selectedObject.type === 'body') {
          const body = this.selectedObject as Body;
          const oldValue = (body as any)[prop];
          const newValue = isCheckbox ? elem.checked : (id === 'prop-bodyType' ? elem.value : parseFloat(elem.value));
          
          // 值没变化就不记录
          if (oldValue !== newValue) {
            const cmd = new ModifyPropertyCommand(
              body,
              prop as string,
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
        }
      });
    };

    // 位置坐标 X
    const posXInput = document.getElementById('prop-position-x') as HTMLInputElement;
    if (posXInput && this.selectedObject && this.selectedObject.type === 'body') {
      posXInput.addEventListener('input', () => {
        if (this.selectedObject && this.selectedObject.type === 'body') {
          const body = this.selectedObject as Body;
          const oldX = body.position.x;
          const newX = parseFloat(posXInput.value);
          
          if (oldX !== newX) {
            const cmd = new ModifyPropertyCommand(
              body,
              'position.x',
              oldX,
              newX,
              () => {
                body.position.x = newX;
                this.render();
                this.updatePropertyPanel();
              }
            );
            this.commandHistory.execute(cmd);
            this.updateUndoRedoButtons();
          }
        }
      });
    }

    // 位置坐标 Y
    const posYInput = document.getElementById('prop-position-y') as HTMLInputElement;
    if (posYInput && this.selectedObject && this.selectedObject.type === 'body') {
      posYInput.addEventListener('input', () => {
        if (this.selectedObject && this.selectedObject.type === 'body') {
          const body = this.selectedObject as Body;
          const oldY = body.position.y;
          const newY = parseFloat(posYInput.value);
          
          if (oldY !== newY) {
            const cmd = new ModifyPropertyCommand(
              body,
              'position.y',
              oldY,
              newY,
              () => {
                body.position.y = newY;
                this.render();
                this.updatePropertyPanel();
              }
            );
            this.commandHistory.execute(cmd);
            this.updateUndoRedoButtons();
          }
        }
      });
    }

    // 旋转角度
    const angleInput = document.getElementById('prop-angle') as HTMLInputElement;
    if (angleInput && this.selectedObject && this.selectedObject.type === 'body') {
      angleInput.addEventListener('input', () => {
        if (this.selectedObject && this.selectedObject.type === 'body') {
          const body = this.selectedObject as Body;
          const oldAngle = body.angle;
          const newAngle = parseFloat(angleInput.value) * Math.PI / 180; // 度转弧度
          
          if (oldAngle !== newAngle) {
            const cmd = new ModifyPropertyCommand(
              body,
              'angle',
              oldAngle,
              newAngle,
              () => {
                this.render();
                this.updatePropertyPanel();
              }
            );
            this.commandHistory.execute(cmd);
            this.updateUndoRedoButtons();
          }
        }
      });
    }

    // 形状尺寸属性
    updateProp('prop-width', 'width');
    updateProp('prop-height', 'height');
    updateProp('prop-radius', 'radius');
    
    // 多边形顶点编辑
    if (this.selectedObject && this.selectedObject.type === 'body') {
      const body = this.selectedObject as Body;
      if (body.shapeType === 'polygon' && body.vertices) {
        body.vertices.forEach((_, i) => {
          // X 坐标
          const xInput = document.getElementById(`prop-vertex-${i}-x`) as HTMLInputElement;
          if (xInput) {
            xInput.addEventListener('input', () => {
              const newX = parseFloat(xInput.value);
              const oldVertices = JSON.parse(JSON.stringify(body.vertices));
              const newVertices = JSON.parse(JSON.stringify(body.vertices));
              newVertices[i].x = newX;
              
              const cmd = new ModifyPropertyCommand(
                body,
                'vertices',
                oldVertices,
                newVertices,
                () => {
                  this.render();
                  this.updatePropertyPanel();
                }
              );
              this.commandHistory.execute(cmd);
              this.updateUndoRedoButtons();
            });
          }
          
          // Y 坐标
          const yInput = document.getElementById(`prop-vertex-${i}-y`) as HTMLInputElement;
          if (yInput) {
            yInput.addEventListener('input', () => {
              const newY = parseFloat(yInput.value);
              const oldVertices = JSON.parse(JSON.stringify(body.vertices));
              const newVertices = JSON.parse(JSON.stringify(body.vertices));
              newVertices[i].y = newY;
              
              const cmd = new ModifyPropertyCommand(
                body,
                'vertices',
                oldVertices,
                newVertices,
                () => {
                  this.render();
                  this.updatePropertyPanel();
                }
              );
              this.commandHistory.execute(cmd);
              this.updateUndoRedoButtons();
            });
          }
        });
      }
    }

    // 物理属性
    updateProp('prop-bodyType', 'bodyType');
    updateProp('prop-density', 'density');
    updateProp('prop-friction', 'friction');
    updateProp('prop-restitution', 'restitution');
    updateProp('prop-linearDamping', 'linearDamping');
    updateProp('prop-angularDamping', 'angularDamping');
    updateProp('prop-gravityScale', 'gravityScale');
    updateProp('prop-fixedRotation', 'fixedRotation', true);

    document.getElementById('btn-delete-obj')?.addEventListener('click', () => this.deleteSelected());
  }

  private bindJointPropertyEvents(): void {
    const updateProp = (id: string, prop: keyof Joint, isCheckbox = false, isDegree = false) => {
      const elem = document.getElementById(id) as HTMLInputElement;
      if (!elem || !this.selectedObject || this.selectedObject.type !== 'joint') return;
      
      elem.addEventListener(isCheckbox ? 'change' : 'input', () => {
        if (this.selectedObject && this.selectedObject.type === 'joint') {
          const joint = this.selectedObject as Joint;
          const oldValue = (joint as any)[prop];
          let newValue: any = isCheckbox ? elem.checked : parseFloat(elem.value);
          if (isDegree) newValue = newValue * Math.PI / 180;
          
          // 值没变化就不记录
          if (oldValue !== newValue) {
            const cmd = new ModifyPropertyCommand(
              joint,
              prop as string,
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
        }
      });
    };

    // 锚点位置编辑
    const updateAnchor = (id: string, isAnchorA: boolean, isX: boolean) => {
      const elem = document.getElementById(id) as HTMLInputElement;
      if (!elem || !this.selectedObject || this.selectedObject.type !== 'joint') return;
      
      elem.addEventListener('input', () => {
        if (this.selectedObject && this.selectedObject.type === 'joint') {
          const joint = this.selectedObject as Joint;
          const anchor = isAnchorA ? joint.anchorALocal : joint.anchorBLocal;
          const prop = isAnchorA ? 'anchorALocal' : 'anchorBLocal';
          const oldValue = { x: anchor.x, y: anchor.y };
          const newValue = { x: anchor.x, y: anchor.y };
          
          if (isX) {
            newValue.x = parseFloat(elem.value);
          } else {
            newValue.y = parseFloat(elem.value);
          }
          
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
        }
      });
    };

    updateAnchor('prop-anchorALocalX', true, true);
    updateAnchor('prop-anchorALocalY', true, false);
    updateAnchor('prop-anchorBLocalX', false, true);
    updateAnchor('prop-anchorBLocalY', false, false);

    // 只绑定旋转关节属性
    updateProp('prop-enableLimit', 'enableLimit', true);
    updateProp('prop-lowerAngle', 'lowerAngle', false, true);
    updateProp('prop-upperAngle', 'upperAngle', false, true);
    
    // 马达属性
    updateProp('prop-enableMotor', 'enableMotor', true);
    updateProp('prop-motorSpeed', 'motorSpeed', false);
    updateProp('prop-maxMotorTorque', 'maxMotorTorque', false);
    
    // 其他属性
    updateProp('prop-collideConnected', 'collideConnected', true);

    document.getElementById('btn-delete-obj')?.addEventListener('click', () => this.deleteSelected());
  }

  // ==================== 撤销/重做 ====================

  private updateUndoRedoButtons(): void {
    const undoBtn = document.getElementById('btn-undo') as HTMLButtonElement | null;
    const redoBtn = document.getElementById('btn-redo') as HTMLButtonElement | null;
    
    if (undoBtn) {
      undoBtn.disabled = !this.commandHistory.canUndo();
    }
    if (redoBtn) {
      redoBtn.disabled = !this.commandHistory.canRedo();
    }
  }

  private undo(): void {
    this.commandHistory.undo();
    this.updateUndoRedoButtons();
    this.updateStatus('撤销操作', '', '已撤销');
  }

  private redo(): void {
    this.commandHistory.redo();
    this.updateUndoRedoButtons();
    this.updateStatus('重做操作', '', '已重做');
  }

  // ==================== 状态更新 ====================

  private updateStatus(...messages: string[]): void {
    const statusTool = document.getElementById('status-tool');
    const statusObjects = document.getElementById('status-objects');
    const statusCoords = document.getElementById('status-coords');
    const statusMessage = document.getElementById('status-message');

    if (messages[0] && statusTool) statusTool.textContent = messages[0];
    if (statusObjects) statusObjects.textContent = `对象: ${this.objects.length}`;
    if (messages[1] && statusCoords) statusCoords.textContent = messages[1];
    if (messages[2] && statusMessage) statusMessage.textContent = messages[2];
  }

  private newMap(): void {
    if (confirm('确定要新建地图吗？当前未保存的内容将丢失。')) {
      this.objects = [];
      this.selectedObject = null;
      this.updatePropertyPanel();
      this.render();
    }
  }

  private saveMap(): void {
    if (this.objects.length === 0) {
      alert('没有可保存的对象');
      return;
    }
    const data = JSON.stringify(this.objects, null, 2);
    downloadFile(data, 'map.json');
    alert('地图保存成功！');
  }

  private loadMap(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  }

  private async loadFromFile(file: File): Promise<void> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // 检查是否是 Box2D 导出格式
      if (data.world_settings && data.bodies && data.joints) {
        alert('检测到 Box2D 导出格式，但目前不支持从导出文件导入。\n请使用"保存地图"生成的 map.json 文件。');
        return;
      }
      
      // 验证数据格式（地图保存格式）
      if (!Array.isArray(data)) {
        throw new Error('文件格式错误：数据必须是数组格式');
      }
      
      // 验证数组中的对象是否有必要的字段
      for (const obj of data) {
        if (!obj.id || !obj.type) {
          throw new Error('文件格式错误：对象缺少必要字段（id 或 type）');
        }
      }
      
      this.objects = data;
      this.selectedObject = null;
      this.commandHistory = new CommandHistory(); // 清空撤销历史
      this.updateUndoRedoButtons();
      this.updatePropertyPanel();
      this.render();
      alert('文件加载成功！');
    } catch (error) {
      console.error('加载文件错误:', error);
      alert('加载文件失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  private exportBox2D(): void {
    const box2dData = {
      world_settings: {
        gravity: [0, -10],
        allow_sleeping: true,
        auto_clear_forces: true
      },
      bodies: this.objects
        .filter(o => o.type === 'body')
        .map(body => this.bodyToBox2D(body as Body)),
      joints: this.objects
        .filter(o => o.type === 'joint')
        .map(joint => this.jointToBox2D(joint as Joint))
    };

    const json = JSON.stringify(box2dData, null, 2);
    downloadFile(json, 'box2d_export.json');
  }

  private bodyToBox2D(body: Body): any {
    const fixtures: any[] = [];
    
    // 数据已经是 Box2D 坐标，直接使用
    if (body.shapeType === 'box' && body.width && body.height) {
      fixtures.push({
        shape: {
          type: 'box',
          params: {
            width: body.width,    // 已经是米
            height: body.height   // 已经是米
          }
        },
        fixture_def: {
          density: body.density,
          friction: body.friction,
          restitution: body.restitution,
          is_sensor: false,
          filter_category_bits: 1,
          filter_mask_bits: 65535,
          filter_group_index: 0
        }
      });
    } else if (body.shapeType === 'circle' && body.radius) {
      fixtures.push({
        shape: {
          type: 'circle',
          params: {
            radius: body.radius   // 已经是米
          }
        },
        fixture_def: {
          density: body.density,
          friction: body.friction,
          restitution: body.restitution,
          is_sensor: false,
          filter_category_bits: 1,
          filter_mask_bits: 65535,
          filter_group_index: 0
        }
      });
    } else if (body.shapeType === 'polygon' && body.vertices) {
      fixtures.push({
        shape: {
          type: 'polygon',
          params: {
            vertices: body.vertices.map(v => [v.x, v.y])  // 已经是米
          }
        },
        fixture_def: {
          density: body.density,
          friction: body.friction,
          restitution: body.restitution,
          is_sensor: false,
          filter_category_bits: 1,
          filter_mask_bits: 65535,
          filter_group_index: 0
        }
      });
    }

    return {
      id: body.id,
      body_def: {
        type: body.bodyType,
        position: [body.position.x, body.position.y],  // 已经是米，Y向上
        angle: body.angle,  // 已经是逆时针为正
        linear_velocity: [0, 0],
        angular_velocity: 0,
        linear_damping: body.linearDamping,
        angular_damping: body.angularDamping,
        allow_sleep: true,
        awake: true,
        fixed_rotation: body.fixedRotation,
        bullet: false,
        gravity_scale: body.gravityScale
      },
      fixtures,
      visual_properties: {},
      user_data: {}
    };
  }

  private jointToBox2D(joint: Joint): any {
    const bodyA = this.objects.find(o => o.id === joint.bodyAId) as Body;
    const bodyB = this.objects.find(o => o.id === joint.bodyBId) as Body;

    if (!bodyA || !bodyB) return null;

    // 现在锚点已经是局部坐标了，直接使用
    const base = {
      id: joint.id,
      joint_type: 'revolute', // 只导出旋转关节
      body_a: joint.bodyAId,
      body_b: joint.bodyBId,
      visual_properties: {},
      user_data: {}
    };

    // 数据已经是 Box2D 坐标（局部坐标，米），直接使用
    return {
      ...base,
      joint_def: {
        local_anchor_a: [joint.anchorALocal.x, joint.anchorALocal.y],  // 已经是米
        local_anchor_b: [joint.anchorBLocal.x, joint.anchorBLocal.y],  // 已经是米
        reference_angle: bodyB.angle - bodyA.angle,
        enable_limit: joint.enableLimit || false,
        lower_angle: joint.lowerAngle || -Math.PI / 2,
        upper_angle: joint.upperAngle || Math.PI / 2,
        enable_motor: false,
        motor_speed: 0,
        max_motor_torque: 0,
        collide_connected: false
      }
    };
  }

  // ==================== 物理预览 ====================

  private disableToolbar(disabled: boolean): void {
    // 禁用/启用所有工具按钮
    document.querySelectorAll('.tool-btn').forEach(btn => {
      (btn as HTMLButtonElement).disabled = disabled;
      if (disabled) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    });
    
    // 禁用/启用文件操作按钮
    const fileButtons = ['btn-new', 'btn-save', 'btn-load', 'btn-export', 'btn-undo', 'btn-redo'];
    fileButtons.forEach(id => {
      const btn = document.getElementById(id) as HTMLButtonElement;
      if (btn) {
        btn.disabled = disabled;
      }
    });
  }

  private togglePreview(): void {
    if (this.isPreviewMode) {
      this.exitPreview();
    } else {
      this.startPreview();
    }
  }

  private startPreview(): void {
    // 检查 Box2D 是否加载（旧版 Box2D Flash API）
    if (typeof (window as any).b2World === 'undefined') {
      alert('Box2D 物理引擎未加载！\n\n请确认：\n1. public/box2d-js/lib/box2d.js 文件存在\n2. 刷新页面重新加载\n3. 查看控制台是否有加载错误');
      console.error('Box2D 加载检查失败 - b2World 未定义');
      console.log('可用的全局对象:', Object.keys(window).filter(k => k.includes('b2')));
      return;
    }

    // 如果没有物体，提示用户
    if (this.objects.length === 0) {
      alert('场景中没有物体！请先创建一些物体。');
      return;
    }

    console.log('开始物理预览...');
    console.log('Box2D 版本: Flash 移植版');
    
    this.isPreviewMode = true;
    this.previewPaused = false;
    
    // 保存所有物体的原始状态（用于重置）
    this.previewOriginalState = [];
    for (const obj of this.objects) {
      if (obj.type === 'body') {
        const body = obj as Body;
        this.previewOriginalState.push({
          id: body.id,
          position: { x: body.position.x, y: body.position.y },
          angle: body.angle
        });
      }
    }
    
    // 隐藏设计UI，显示预览UI
    this.canvas.style.cursor = 'default';
    document.getElementById('preview-controls')!.style.display = 'flex';
    document.getElementById('property-panel')!.style.display = 'none';
    
    // 禁用所有工具栏按钮和文件操作按钮
    this.disableToolbar(true);
    
    // 设置预览按钮初始状态（播放中，显示暂停按钮）
    document.getElementById('btn-preview-play')!.style.display = 'none';
    document.getElementById('btn-preview-pause')!.style.display = 'inline-block';
    
    // 保存当前的坐标系参数（用于 Box2D 同步）
    this.previewPPM = PPM;
    this.previewOriginOffsetX = ORIGIN_OFFSET_X;
    this.previewOriginOffsetY = ORIGIN_OFFSET_Y;
    console.log(`保存坐标系快照: PPM=${this.previewPPM}, OriginX=${this.previewOriginOffsetX.toFixed(2)}, OriginY=${this.previewOriginOffsetY.toFixed(2)}`);
    
    // 初始化 Box2D 世界
    this.initBox2DWorld();
    
    // 开始动画循环
    this.startPreviewAnimation();
    
    this.updateStatus('物理预览模式', `物体数: ${this.objects.length}`, '按 ESC 或点击退出');
  }

  private initBox2DWorld(): void {
    console.log('=== 初始化 Box2D 世界 ===');
    console.log(`场景对象总数: ${this.objects.length}`);
    
    // 首先清空旧的映射（如果有）
    this.box2dBodies.clear();
    this.box2dJoints.clear();
    console.log('已清空旧的 Box2D 映射');
    
    // 使用旧版 Box2D Flash API
    const b2AABB = (window as any).b2AABB;
    const b2World = (window as any).b2World;
    const b2Vec2 = (window as any).b2Vec2;
    
    // 创建世界边界（AABB）
    const worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-1000, -1000);
    worldAABB.maxVertex.Set(1000, 1000);
    
    // 创建重力（Y 向下为正，像素单位）
    // 注意：我们的坐标系 Y 向上，Box2D 旧版 Y 向下
    const gravity = new b2Vec2(0, 300); // 约 300 pixels/s² 向下
    const doSleep = true;
    
    // 创建世界
    this.box2dWorld = new b2World(worldAABB, gravity, doSleep);
    console.log('Box2D 世界已创建');
    
    // 统计物体和关节数量
    const bodies = this.objects.filter(o => o.type === 'body');
    const joints = this.objects.filter(o => o.type === 'joint');
    console.log(`准备创建: ${bodies.length} 个物体, ${joints.length} 个关节`);
    
    // 创建所有刚体
    let bodySuccessCount = 0;
    let bodyFailCount = 0;
    for (const obj of this.objects) {
      if (obj.type === 'body') {
        const body = obj as Body;
        const b2Body = this.createBox2DBody(body);
        if (b2Body) {
          this.box2dBodies.set(body.id, b2Body);
          bodySuccessCount++;
        } else {
          bodyFailCount++;
        }
      }
    }
    
    console.log(`物体创建完成: ${bodySuccessCount} 成功, ${bodyFailCount} 失败`);
    console.log(`当前 box2dBodies Map 大小: ${this.box2dBodies.size}`);
    console.log(`box2dBodies 的 keys:`, Array.from(this.box2dBodies.keys()));
    
    // 创建所有关节
    let jointSuccessCount = 0;
    let jointFailCount = 0;
    for (const obj of this.objects) {
      if (obj.type === 'joint') {
        const joint = obj as Joint;
        const b2Joint = this.createBox2DJoint(joint);
        if (b2Joint) {
          this.box2dJoints.set(joint.id, b2Joint);
          jointSuccessCount++;
        } else {
          jointFailCount++;
        }
      }
    }
    
    console.log(`关节创建完成: ${jointSuccessCount} 成功, ${jointFailCount} 失败`);
    console.log(`=== Box2D 世界初始化完成 ===`);
    console.log(`最终结果: ${this.box2dBodies.size} 个物体, ${this.box2dJoints.size} 个关节`);
  }

  private createBox2DBody(body: Body): any {
    console.log(`创建 Box2D Body: id=${body.id}, type=${body.bodyType}, shape=${body.shapeType}`);
    
    // 使用旧版 Box2D Flash API
    const b2BodyDef = (window as any).b2BodyDef;
    const b2BoxDef = (window as any).b2BoxDef;
    const b2CircleDef = (window as any).b2CircleDef;
    const b2PolyDef = (window as any).b2PolyDef;
    
    const bodyDef = new b2BodyDef();
    
    // 创建形状定义
    let shapeDef: any = null;
    
    if (body.shapeType === 'box' && body.width && body.height) {
      shapeDef = new b2BoxDef();
      // extents 是半宽和半高（像素）
      // 重要：使用保存的 PPM 参数
      const halfWidth = body.width * this.previewPPM / 2;
      const halfHeight = body.height * this.previewPPM / 2;
      shapeDef.extents.Set(halfWidth, halfHeight);
      console.log(`  - 矩形: 半宽=${halfWidth.toFixed(2)}px, 半高=${halfHeight.toFixed(2)}px [使用保存的 PPM=${this.previewPPM}]`);
    } else if (body.shapeType === 'circle' && body.radius) {
      shapeDef = new b2CircleDef();
      // 重要：使用保存的 PPM 参数
      shapeDef.radius = body.radius * this.previewPPM;
      console.log(`  - 圆形: 半径=${shapeDef.radius.toFixed(2)}px [使用保存的 PPM=${this.previewPPM}]`);
    } else if (body.shapeType === 'polygon' && body.vertices && body.vertices.length >= 3) {
      shapeDef = new b2PolyDef();
      shapeDef.vertexCount = body.vertices.length;
      
      console.log(`  - 准备创建多边形: ${body.vertices.length} 个顶点`);
      
      // 多边形顶点（相对于物体中心）
      // 重要：使用保存的 PPM 参数
      // 注意：旧版 Box2D 需要使用 .Set() 方法设置顶点！
      for (let i = 0; i < body.vertices.length; i++) {
        const v = body.vertices[i];
        
        const vx = v.x * this.previewPPM;
        const vy = -v.y * this.previewPPM;  // Y 轴翻转（我们的 Y 向上，Box2D 旧版 Y 向下）
        
        // 使用 Set() 方法（旧版 API 要求）
        shapeDef.vertices[i].Set(vx, vy);
        console.log(`    顶点[${i}]: 局部(${v.x.toFixed(2)}, ${v.y.toFixed(2)}) -> Box2D(${vx.toFixed(2)}, ${vy.toFixed(2)})`);
      }
      
      console.log(`  - 多边形顶点已设置 [使用保存的 PPM=${this.previewPPM}]`);
    }
    
    if (!shapeDef) {
      console.error(`❌ 无法创建形状: ${body.shapeType}, width=${body.width}, height=${body.height}, radius=${body.radius}`);
      return null;
    }
    
    // 设置物理属性
    shapeDef.density = body.bodyType === 'static' ? 0 : body.density;
    shapeDef.friction = body.friction;
    shapeDef.restitution = body.restitution;
    console.log(`  - 物理属性: density=${shapeDef.density}, friction=${shapeDef.friction}, restitution=${shapeDef.restitution}`);
    
    // 添加形状到 body 定义（旧版必须先添加形状）
    bodyDef.AddShape(shapeDef);
    
    // 设置位置（像素单位，Y 轴翻转）
    // 重要：使用保存的坐标系参数，确保创建和同步使用相同的参数
    const canvasX = (body.position.x - this.previewOriginOffsetX) * this.previewPPM + this.canvas.width / 2;
    const canvasY = -(body.position.y - this.previewOriginOffsetY) * this.previewPPM + this.canvas.height / 2;
    bodyDef.position.Set(canvasX, canvasY);
    console.log(`  - 位置: 世界(${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)}) -> 画布(${canvasX.toFixed(0)}, ${canvasY.toFixed(0)}) [使用保存的坐标系]`);
    
    // 设置旋转（旧版使用 rotation 属性）
    bodyDef.rotation = -body.angle; // Y 轴翻转导致角度也要反向
    console.log(`  - 角度: ${(body.angle * 180 / Math.PI).toFixed(1)}° -> Box2D ${(bodyDef.rotation * 180 / Math.PI).toFixed(1)}°`);
    
    // 创建刚体
    const b2Body = this.box2dWorld.CreateBody(bodyDef);
    
    if (b2Body) {
      console.log(`✅ Body ${body.id} 创建成功`);
    } else {
      console.error(`❌ Body ${body.id} 创建失败！CreateBody 返回 null`);
      console.error(`  - 详细信息: type=${body.bodyType}, shape=${body.shapeType}`);
      console.error(`  - bodyDef:`, bodyDef);
      console.error(`  - shapeDef:`, shapeDef);
    }
    
    return b2Body;
  }

  private createBox2DJoint(joint: Joint): any {
    console.log(`创建 Box2D Joint: id=${joint.id}, type=${joint.jointType}, bodyA=${joint.bodyAId}, bodyB=${joint.bodyBId}`);
    
    // 使用旧版 Box2D Flash API
    const b2RevoluteJointDef = (window as any).b2RevoluteJointDef;
    
    const bodyA = this.box2dBodies.get(joint.bodyAId);
    const bodyB = this.box2dBodies.get(joint.bodyBId);
    
    if (!bodyA) {
      console.error(`❌ 关节 ${joint.id} 的 bodyA (${joint.bodyAId}) 未找到！`);
      console.log(`  - 可用的 bodies:`, Array.from(this.box2dBodies.keys()));
      return null;
    }
    
    if (!bodyB) {
      console.error(`❌ 关节 ${joint.id} 的 bodyB (${joint.bodyBId}) 未找到！`);
      console.log(`  - 可用的 bodies:`, Array.from(this.box2dBodies.keys()));
      return null;
    }
    
    console.log(`  - bodyA 和 bodyB 都已找到`);
    
    if (joint.jointType === 'revolute') {
      // 找到对应的 Body 对象
      const bodyAObj = this.objects.find(o => o.id === joint.bodyAId) as Body;
      const bodyBObj = this.objects.find(o => o.id === joint.bodyBId) as Body;
      
      if (!bodyAObj || !bodyBObj) {
        console.error(`❌ 关节 ${joint.id} 对应的 Body 对象未找到！bodyAObj=${!!bodyAObj}, bodyBObj=${!!bodyBObj}`);
        return null;
      }
      
      console.log(`  - Body 对象: bodyA pos=(${bodyAObj.position.x.toFixed(2)}, ${bodyAObj.position.y.toFixed(2)}), bodyB pos=(${bodyBObj.position.x.toFixed(2)}, ${bodyBObj.position.y.toFixed(2)})`);
      
      // 创建旋转关节定义
      const jointDef = new b2RevoluteJointDef();
      jointDef.body1 = bodyA;
      jointDef.body2 = bodyB;
      
      // 将局部锚点转换为世界坐标（我们的坐标系，米）
      const anchorAWorld = localToWorld(
        joint.anchorALocal.x,
        joint.anchorALocal.y,
        bodyAObj.position.x,
        bodyAObj.position.y,
        bodyAObj.angle
      );
      
      // 将世界坐标转换为画布坐标（像素）
      // 重要：使用保存的坐标系参数，确保与物体创建时使用相同的参数
      const anchorCanvasX = (anchorAWorld.x - this.previewOriginOffsetX) * this.previewPPM + this.canvas.width / 2;
      const anchorCanvasY = -(anchorAWorld.y - this.previewOriginOffsetY) * this.previewPPM + this.canvas.height / 2;
      
      // 设置锚点（旧版使用 anchorPoint，画布坐标）
      jointDef.anchorPoint.Set(anchorCanvasX, anchorCanvasY);
      
      console.log(`  - 锚点: 局部(${joint.anchorALocal.x.toFixed(2)}, ${joint.anchorALocal.y.toFixed(2)}) -> 世界(${anchorAWorld.x.toFixed(2)}, ${anchorAWorld.y.toFixed(2)}) -> 画布(${anchorCanvasX.toFixed(0)}, ${anchorCanvasY.toFixed(0)}) [使用保存的坐标系]`);      
      // 角度限制（旧版 API 完全支持！）
      if (joint.enableLimit) {
        jointDef.enableLimit = true;
        jointDef.lowerAngle = joint.lowerAngle || -Math.PI / 2;
        jointDef.upperAngle = joint.upperAngle || Math.PI / 2;
        console.log(`  - 角度限制: ${(jointDef.lowerAngle * 180 / Math.PI).toFixed(0)}° 到 ${(jointDef.upperAngle * 180 / Math.PI).toFixed(0)}°`);
      }
      
      // 马达功能（旧版 API 完全支持！）
      if (joint.enableMotor) {
        jointDef.enableMotor = true;
        jointDef.motorSpeed = joint.motorSpeed || 0;
        jointDef.motorTorque = joint.maxMotorTorque || 1000; // 旧版使用 motorTorque 而非 maxMotorTorque
        console.log(`  - 马达: 速度=${jointDef.motorSpeed.toFixed(2)} rad/s, 扭矩=${jointDef.motorTorque}`);
      }
      
      // 碰撞连接
      jointDef.collideConnected = joint.collideConnected || false;
      console.log(`  - 碰撞连接: ${jointDef.collideConnected}`);
      
      // 创建关节
      try {
        const b2Joint = this.box2dWorld.CreateJoint(jointDef);
        if (b2Joint) {
          console.log(`✅ Joint ${joint.id} 创建成功`);
          return b2Joint;
        } else {
          console.error(`❌ Joint ${joint.id} 创建失败！CreateJoint 返回 null`);
          return null;
        }
      } catch (error) {
        console.error(`❌ Joint ${joint.id} 创建异常:`, error);
        return null;
      }
    }
    
    console.warn(`⚠️ 不支持的关节类型: ${joint.jointType}`);
    return null;
  }

  private startPreviewAnimation(): void {
    const animate = () => {
      if (!this.isPreviewMode) return;
      
      if (!this.previewPaused) {
        // 步进物理模拟（旧版 API）
        // 参数：timeStep, iterations（旧版只有一个迭代参数）
        this.box2dWorld.Step(1 / 60, 10);
        
        // 同步 Box2D 状态到我们的对象
        this.syncBox2DToObjects();
      }
      
      // 渲染
      this.render();
      
      // 继续动画
      this.previewAnimationId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  private syncBox2DToObjects(): void {
    for (const [id, b2Body] of this.box2dBodies.entries()) {
      const body = this.objects.find(o => o.id === id) as Body;
      if (body) {
        // 旧版 API：直接访问 m_position 和 m_rotation
        const pos = b2Body.m_position;
        const angle = b2Body.m_rotation;
        
        // 从画布坐标转回世界坐标（像素 -> 米，Y 轴翻转）
        // 重要：使用保存的坐标系参数，而不是当前的参数
        // 这样即使用户在预览时拖动或缩放视图，Box2D 同步也是正确的
        const canvasX = pos.x;
        const canvasY = pos.y;
        
        // 使用保存的坐标系参数进行转换
        const worldX = (canvasX - this.canvas.width / 2) / this.previewPPM + this.previewOriginOffsetX;
        const worldY = -(canvasY - this.canvas.height / 2) / this.previewPPM + this.previewOriginOffsetY;
        
        body.position.x = worldX;
        body.position.y = worldY;
        body.angle = -angle; // Y 轴翻转导致角度反向
      }
    }
  }

  private pausePreview(): void {
    this.previewPaused = true;
    document.getElementById('btn-preview-play')!.style.display = 'inline-block';
    document.getElementById('btn-preview-pause')!.style.display = 'none';
  }

  private resumePreview(): void {
    this.previewPaused = false;
    document.getElementById('btn-preview-play')!.style.display = 'none';
    document.getElementById('btn-preview-pause')!.style.display = 'inline-block';
  }

  private rebuildBox2DWorldWithNewScale(): void {
    console.log('=== 缩放变化，重建 Box2D 世界 ===');
    console.log(`新的 PPM: ${PPM}, 新的 ORIGIN_OFFSET: (${ORIGIN_OFFSET_X.toFixed(2)}, ${ORIGIN_OFFSET_Y.toFixed(2)})`);
    
    // 暂停模拟（不停止动画循环）
    const wasPaused = this.previewPaused;
    this.previewPaused = true;
    
    // 保存当前所有物体的物理状态（位置、角度、速度）
    const currentStates: Array<{
      id: string;
      position: Vector2;
      angle: number;
      linearVelocity?: { x: number; y: number };
      angularVelocity?: number;
    }> = [];
    
    for (const [id, b2Body] of this.box2dBodies.entries()) {
      const body = this.objects.find(o => o.id === id) as Body;
      if (body) {
        // 保存当前的位置和角度（已经从 Box2D 同步到 objects）
        const state: any = {
          id: body.id,
          position: { x: body.position.x, y: body.position.y },
          angle: body.angle
        };
        
        // 保存速度（如果是动态物体）
        if (body.bodyType === 'dynamic' && b2Body.m_linearVelocity) {
          state.linearVelocity = {
            x: b2Body.m_linearVelocity.x,
            y: b2Body.m_linearVelocity.y
          };
          state.angularVelocity = b2Body.m_angularVelocity || 0;
        }
        
        currentStates.push(state);
      }
    }
    
    console.log(`已保存 ${currentStates.length} 个物体的当前状态`);
    
    // 销毁旧的 Box2D 世界
    if (this.box2dWorld) {
      this.box2dWorld = null;
    }
    
    // 更新坐标系快照为新的值
    this.previewPPM = PPM;
    this.previewOriginOffsetX = ORIGIN_OFFSET_X;
    this.previewOriginOffsetY = ORIGIN_OFFSET_Y;
    console.log(`更新坐标系快照: PPM=${this.previewPPM}, OriginX=${this.previewOriginOffsetX.toFixed(2)}, OriginY=${this.previewOriginOffsetY.toFixed(2)}`);
    
    // 重新初始化 Box2D 世界（使用新的坐标系参数）
    this.initBox2DWorld();
    
    // 恢复物体的速度（如果有）
    for (const state of currentStates) {
      const b2Body = this.box2dBodies.get(state.id);
      if (b2Body && state.linearVelocity) {
        // 速度单位是画布像素/秒，不需要根据 PPM 缩放
        b2Body.m_linearVelocity.Set(state.linearVelocity.x, state.linearVelocity.y);
        b2Body.m_angularVelocity = state.angularVelocity || 0;
        console.log(`恢复物体 ${state.id} 的速度: (${state.linearVelocity.x.toFixed(2)}, ${state.linearVelocity.y.toFixed(2)}), 角速度: ${state.angularVelocity}`);
      }
    }
    
    // 恢复暂停状态
    this.previewPaused = wasPaused;
    
    // 渲染新的状态
    this.render();
    
    console.log('=== Box2D 世界重建完成 ===');
  }

  private resetPreview(): void {
    console.log('=== 重置物理预览 ===');
    
    // 停止当前模拟
    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
      console.log('动画循环已停止');
    }
    
    // 销毁旧的 Box2D 世界
    if (this.box2dWorld) {
      console.log('销毁旧的 Box2D 世界');
      this.box2dWorld = null; // 让 GC 处理
    }
    
    console.log('恢复物体到原始状态...');
    // 恢复所有物体的原始状态
    let restoredCount = 0;
    for (const savedState of this.previewOriginalState) {
      const body = this.objects.find(o => o.id === savedState.id) as Body;
      if (body) {
        body.position.x = savedState.position.x;
        body.position.y = savedState.position.y;
        body.angle = savedState.angle;
        restoredCount++;
      }
    }
    console.log(`已恢复 ${restoredCount} 个物体的状态`);
    
    // 重新初始化世界（会清空并重建 box2dBodies 和 box2dJoints）
    this.initBox2DWorld();
    this.previewPaused = false;
    
    // 重置按钮状态为播放中
    document.getElementById('btn-preview-play')!.style.display = 'none';
    document.getElementById('btn-preview-pause')!.style.display = 'inline-block';
    
    // 重新启动动画循环
    this.startPreviewAnimation();
    
    console.log('=== 重置完成 ===');
    this.updateStatus('物理预览已重置');
  }

  private exitPreview(): void {
    console.log('退出物理预览');
    
    this.isPreviewMode = false;
    
    // 停止动画
    if (this.previewAnimationId) {
      cancelAnimationFrame(this.previewAnimationId);
      this.previewAnimationId = null;
    }
    
    // 销毁 Box2D 世界
    if (this.box2dWorld) {
      this.box2dWorld = null;
    }
    
    this.box2dBodies.clear();
    this.box2dJoints.clear();
    
    // 恢复所有物体的原始状态
    for (const savedState of this.previewOriginalState) {
      const body = this.objects.find(o => o.id === savedState.id) as Body;
      if (body) {
        body.position.x = savedState.position.x;
        body.position.y = savedState.position.y;
        body.angle = savedState.angle;
      }
    }
    
    // 清空保存的状态
    this.previewOriginalState = [];
    
    // 恢复UI
    document.getElementById('preview-controls')!.style.display = 'none';
    document.getElementById('property-panel')!.style.display = 'flex';
    this.canvas.style.cursor = 'crosshair';
    
    // 重新启用所有工具栏按钮和文件操作按钮
    this.disableToolbar(false);
    
    // 重置按钮状态（为下次预览做准备）
    document.getElementById('btn-preview-play')!.style.display = 'none';
    document.getElementById('btn-preview-pause')!.style.display = 'none';
    
    // 重新渲染（使用原始状态）
    this.render();
    
    this.updateStatus('已退出预览模式');
  }
}

// ==================== 初始化 ====================

window.addEventListener('DOMContentLoaded', () => {
  new MapDesigner('design-canvas');
});
