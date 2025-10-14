// ==================== 重写的渲染函数（Box2D坐标系统）====================

  private render(): void {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 绘制网格（Box2D 坐标系，每格 GRID_SIZE 米）
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // 计算 Box2D 坐标范围
    const worldMinX = -(width / 2) / PPM;
    const worldMaxX = (width / 2) / PPM;
    const worldMinY = 0;
    const worldMaxY = height / PPM;
    
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
        const canvasPos = box2DToCanvas(x, 0, width, height);
        ctx.fillText(`${x}m`, canvasPos.x + 2, height - 5);
      }
    }
    
    // Y 轴标记（每 5米）
    for (let y = Math.ceil(worldMinY); y <= Math.floor(worldMaxY); y++) {
      if (y % 5 === 0 && y > 0) {
        const canvasPos = box2DToCanvas(0, y, width, height);
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
    ctx.font = '12px monospace';
    ctx.fillText('O(0,0)', origin.x + 12, origin.y - 5);

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
      ctx.fillText(`(${this.mousePos.x.toFixed(2)}, ${this.mousePos.y.toFixed(2)})`, 
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
      const firstCanvas = { x: box2DToCanvasScale(firstVertex.x), y: box2DToCanvasScale(firstVertex.y) };
      ctx.moveTo(firstCanvas.x, -firstCanvas.y);  // Y 翻转
      
      for (let i = 1; i < body.vertices.length; i++) {
        const v = body.vertices[i];
        const vCanvas = { x: box2DToCanvasScale(v.x), y: box2DToCanvasScale(v.y) };
        ctx.lineTo(vCanvas.x, -vCanvas.y);  // Y 翻转
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