/**
 * 工具函数
 */

import { PIXEL_TO_METER, METER_TO_PIXEL } from './constants';
import type { Vector2 } from './types';

/**
 * 生成唯一ID
 */
export function generateId(prefix: string): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 像素转米
 */
export function pixelToMeter(pixel: number): number {
  return pixel / PIXEL_TO_METER;
}

/**
 * 米转像素
 */
export function meterToPixel(meter: number): number {
  return meter * PIXEL_TO_METER;
}

/**
 * 向量像素转米
 */
export function vector2PixelToMeter(v: Vector2): [number, number] {
  return [pixelToMeter(v.x), pixelToMeter(v.y)];
}

/**
 * 向量米转像素
 */
export function vector2MeterToPixel(v: [number, number]): Vector2 {
  return { x: meterToPixel(v[0]), y: meterToPixel(v[1]) };
}

/**
 * 计算两点之间的距离
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 计算两点之间的角度（弧度）
 */
export function angleFromPoints(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * 旋转点（围绕原点）
 */
export function rotatePoint(x: number, y: number, angle: number): Vector2 {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

/**
 * 将点从世界坐标转换到刚体局部坐标
 */
export function worldToLocal(
  worldX: number,
  worldY: number,
  bodyX: number,
  bodyY: number,
  bodyAngle: number
): Vector2 {
  // 平移到刚体原点
  const dx = worldX - bodyX;
  const dy = worldY - bodyY;
  
  // 旋转（反向旋转）
  const cos = Math.cos(-bodyAngle);
  const sin = Math.sin(-bodyAngle);
  
  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos,
  };
}

/**
 * 将点从刚体局部坐标转换到世界坐标
 */
export function localToWorld(
  localX: number,
  localY: number,
  bodyX: number,
  bodyY: number,
  bodyAngle: number
): Vector2 {
  // 旋转
  const rotated = rotatePoint(localX, localY, bodyAngle);
  
  // 平移
  return {
    x: rotated.x + bodyX,
    y: rotated.y + bodyY,
  };
}

/**
 * 点是否在矩形内（考虑旋转）
 */
export function pointInRotatedRect(
  px: number,
  py: number,
  rectX: number,
  rectY: number,
  width: number,
  height: number,
  angle: number
): boolean {
  // 将点转换到矩形局部坐标系
  const local = worldToLocal(px, py, rectX, rectY, angle);
  
  // 在局部坐标系中进行简单的边界检测
  const halfW = width / 2;
  const halfH = height / 2;
  
  return (
    local.x >= -halfW &&
    local.x <= halfW &&
    local.y >= -halfH &&
    local.y <= halfH
  );
}

/**
 * 点是否在圆内
 */
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  radius: number
): boolean {
  return distance(px, py, cx, cy) <= radius;
}

/**
 * 点是否在多边形内（射线法）
 */
export function pointInPolygon(px: number, py: number, vertices: Vector2[]): boolean {
  let inside = false;
  const n = vertices.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * 限制数值范围
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 角度归一化到 [-π, π]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * 弧度转角度
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 角度转弧度
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * 下载文件
 */
export function downloadFile(content: string, filename: string, mimeType = 'application/json'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 读取文件
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        resolve(e.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}
