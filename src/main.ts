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
      if (e.key === 'Delete' && this.selectedObject) {
        this.deleteSelected();
      } else if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      } else if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
    });

    // 视图设置控件
    this.setupViewControls();
  }

  private setupViewControls(): void {
    const ppmSlider = document.getElementById('ppm-slider') as HTMLInputElement;
    const ppmValue = document.getElementById('ppm-value') as HTMLSpanElement;
    const originXSlider = document.getElementById('origin-x-slider') as HTMLInputElement;
    const originXValue = document.getElementById('origin-x-value') as HTMLSpanElement;
    const originYSlider = document.getElementById('origin-y-slider') as HTMLInputElement;
    const originYValue = document.getElementById('origin-y-value') as HTMLSpanElement;
    const resetBtn = document.getElementById('btn-reset-view') as HTMLButtonElement;

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
    });
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
    
    const pos = this.getMousePos(e);
    this.mousePos = pos; // 保存当前鼠标位置（Box2D坐标）
    this.updateStatus(`工具: ${this.currentTool}`, `坐标: (${pos.x.toFixed(2)}m, ${pos.y.toFixed(2)}m)`);

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
      this.canvas.style.cursor = 'default';
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

  private onDoubleClick(_e: MouseEvent): void {
    if (this.currentTool === 'polygon' && this.polygonVertices.length >= 3) {
      this.finalizePolygon();
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
    this.render();
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
      this.updateStatus('', '', '请点击一个刚体');
      return;
    }

    if (!this.jointBodyA) {
      this.jointBodyA = body as Body;
      this.jointAnchorA = pos;
      this.updateStatus('', '', '请选择第二个刚体');
    } else {
      this.createJoint(this.jointBodyA, body as Body, this.jointAnchorA!, pos);
      this.jointBodyA = null;
      this.jointAnchorA = null;
      this.updateStatus('', '', '关节已创建');
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
      if (y % 5 === 0 && y > 0) {
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
}

// ==================== 初始化 ====================

window.addEventListener('DOMContentLoaded', () => {
  new MapDesigner('design-canvas');
});
