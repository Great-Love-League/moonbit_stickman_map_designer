/**
 * 撤销/重做系统 - 命令模式实现
 */

// 使用any类型避免循环依赖，在main.ts中会有正确的类型
type MapObject = any;
type Body = any;

// 命令接口
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

// 添加对象命令
export class AddObjectCommand implements Command {
  constructor(
    private objects: MapObject[],
    private object: MapObject,
    private onUpdate: () => void
  ) {}

  execute(): void {
    this.objects.push(this.object);
    this.onUpdate();
  }

  undo(): void {
    const index = this.objects.indexOf(this.object);
    if (index > -1) {
      this.objects.splice(index, 1);
    }
    this.onUpdate();
  }

  redo(): void {
    this.execute();
  }
}

// 删除对象命令
export class DeleteObjectCommand implements Command {
  private index: number = -1;

  constructor(
    private objects: MapObject[],
    private object: MapObject,
    private onUpdate: () => void
  ) {
    this.index = objects.indexOf(object);
  }

  execute(): void {
    if (this.index > -1) {
      this.objects.splice(this.index, 1);
    }
    this.onUpdate();
  }

  undo(): void {
    if (this.index > -1) {
      this.objects.splice(this.index, 0, this.object);
    }
    this.onUpdate();
  }

  redo(): void {
    this.execute();
  }
}

// 移动对象命令
export class MoveObjectCommand implements Command {
  private oldX: number;
  private oldY: number;
  private newX: number;
  private newY: number;

  constructor(
    private body: Body,
    oldX: number,
    oldY: number,
    newX: number,
    newY: number,
    private onUpdate: () => void
  ) {
    this.oldX = oldX;
    this.oldY = oldY;
    this.newX = newX;
    this.newY = newY;
  }

  execute(): void {
    this.body.position.x = this.newX;
    this.body.position.y = this.newY;
    this.onUpdate();
  }

  undo(): void {
    this.body.position.x = this.oldX;
    this.body.position.y = this.oldY;
    this.onUpdate();
  }

  redo(): void {
    this.execute();
  }
}

// 修改属性命令
export class ModifyPropertyCommand implements Command {
  private oldValue: any;
  private newValue: any;

  constructor(
    private object: any,
    private property: string,
    oldValue: any,
    newValue: any,
    private onUpdate: () => void
  ) {
    this.oldValue = oldValue;
    this.newValue = newValue;
  }

  execute(): void {
    this.object[this.property] = this.newValue;
    this.onUpdate();
  }

  undo(): void {
    this.object[this.property] = this.oldValue;
    this.onUpdate();
  }

  redo(): void {
    this.execute();
  }
}

// 批量命令（用于组合多个操作）
export class BatchCommand implements Command {
  constructor(
    private commands: Command[]
  ) {}

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // 反向执行撤销
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  redo(): void {
    this.execute();
  }
}

// 历史管理器
export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  execute(command: Command): void {
    command.execute();
    
    // 清除当前位置之后的历史
    this.history.splice(this.currentIndex + 1);
    
    // 添加新命令
    this.history.push(command);
    this.currentIndex++;
    
    // 限制历史大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): void {
    if (this.canUndo()) {
      this.history[this.currentIndex].undo();
      this.currentIndex--;
    }
  }

  redo(): void {
    if (this.canRedo()) {
      this.currentIndex++;
      this.history[this.currentIndex].redo();
    }
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }

  getHistorySize(): number {
    return this.history.length;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }
}
