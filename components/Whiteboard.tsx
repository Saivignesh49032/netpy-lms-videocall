import React, { useEffect, useRef, useState } from 'react';
import { useWhiteboard, Stroke } from '@/hooks/useWhiteboard';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { PenTool, Eraser, Undo, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper to draw a single stroke onto a canvas context
const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
  if (stroke.points.length === 0) return;
  
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  // If using eraser, we use destination-out to actually make it transparent
  // But wait, the background is white, so drawing white on top is functionally erasing
  // The plan specified using white color for eraser to keep it simple.
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

interface WhiteboardProps {
  meetingId: string;
  isHost: boolean;
  currentUserId: string;
  currentUserName: string;
}

const COLORS = ['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

const Whiteboard: React.FC<WhiteboardProps> = ({ meetingId, isHost, currentUserId, currentUserName }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    strokes,
    canDraw,
    drawPermissions,
    currentTool,
    setCurrentTool,
    currentColor,
    setCurrentColor,
    currentSize,
    setCurrentSize,
    startStroke,
    continueStroke,
    endStroke,
    undo,
    clear,
    setPermission
  } = useWhiteboard(meetingId, isHost, currentUserId);

  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const [showPermissions, setShowPermissions] = useState(false);
  const [resizeTick, setResizeTick] = useState(0);

  // Redraw all strokes whenever they change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all completed/synced strokes
    strokes.forEach(stroke => drawStroke(ctx, stroke));
  }, [resizeTick, strokes]);

  // Resize the canvas and let the redraw effect repaint from stroke state.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = container.getBoundingClientRect();

      canvas.width = width;
      canvas.height = height;
      setResizeTick((value) => value + 1);
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !canDraw) return;
    startStroke(e, canvasRef.current);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current || !canDraw) return;
    const ongoingStroke = continueStroke(e, canvasRef.current);
    
    if (ongoingStroke) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Redraw only the latest segment of the active stroke optimistically
        const pts = ongoingStroke.points;
        if (pts.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.strokeStyle = ongoingStroke.color;
          ctx.lineWidth = ongoingStroke.size;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!canDraw) return;
    endStroke();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col items-center bg-white overflow-hidden rounded-lg">
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
        className={cn("absolute inset-0 touch-none", !canDraw && "cursor-not-allowed")}
      />

      {/* Permissions Panel (Sidebar for Host) */}
      {showPermissions && isHost && (
        <div className="absolute right-0 top-0 bottom-0 w-64 bg-dark-1 text-white border-l border-dark-3 shadow-lg z-20 flex flex-col">
          <div className="p-4 flex items-center justify-between border-b border-dark-3">
            <h3 className="font-semibold text-lg">Draw Access</h3>
            <button onClick={() => setShowPermissions(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {participants.map(p => {
              // Host always has access, don't show toggle for host themselves
              if (p.userId === currentUserId) return null;
              
              const hasAccess = drawPermissions[p.userId] || false;
              
              return (
                <div key={p.userId} className="flex items-center justify-between">
                  <span className="text-sm truncate w-32">{p.name || p.userId}</span>
                  <Button 
                    size="sm" 
                    variant="default"
                    className={hasAccess ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}
                    onClick={() => setPermission(p.userId, !hasAccess)}
                  >
                    {hasAccess ? "Revoke" : "Grant"}
                  </Button>
                </div>
              );
            })}
            {participants.length <= 1 && (
              <p className="text-gray-400 text-sm text-center">No other participants.</p>
            )}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="absolute bottom-5 bg-dark-1 p-2 rounded-full shadow-lg flex items-center gap-2 z-10 border border-dark-3">
        {/* Permission Info */}
        {!canDraw && (
          <div className="px-3 text-red-400 text-sm font-medium border-r border-dark-3 mr-2">
            Read Only
          </div>
        )}

        <Button 
          variant="default" 
          size="icon" 
          disabled={!canDraw}
          className={cn("rounded-full", currentTool === 'pen' ? "bg-blue-1 hover:bg-blue-600" : "bg-dark-3 hover:bg-dark-4")}
          onClick={() => setCurrentTool('pen')}
        >
          <PenTool size={18} className="text-white" />
        </Button>

        <Button 
          variant="default" 
          size="icon" 
          disabled={!canDraw}
          className={cn("rounded-full", currentTool === 'eraser' ? "bg-blue-1 hover:bg-blue-600" : "bg-dark-3 hover:bg-dark-4")}
          onClick={() => setCurrentTool('eraser')}
        >
          <Eraser size={18} className="text-white" />
        </Button>

        <div className="h-8 w-[1px] bg-dark-3 mx-1" />

        {/* Color picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button disabled={!canDraw || currentTool === 'eraser'} variant="default" size="icon" className="rounded-full bg-dark-3 hover:bg-dark-4 p-1">
              <div className="w-full h-full rounded-full border border-gray-600" style={{ backgroundColor: currentTool === 'eraser' ? '#ffffff' : currentColor }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-dark-1 border-dark-3 flex flex-wrap gap-2 mb-2" sideOffset={10}>
            {COLORS.map(color => (
              <div 
                key={color} 
                className={cn("w-6 h-6 rounded-full cursor-pointer border border-gray-600", currentColor === color && "ring-2 ring-white")}
                style={{ backgroundColor: color }}
                onClick={() => setCurrentColor(color)}
              />
            ))}
            <input 
              type="color" 
              value={currentColor} 
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 overflow-hidden" 
            />
          </PopoverContent>
        </Popover>

        {/* Size Controls */}
        <div className="flex items-center bg-dark-3 rounded-full px-2 h-10 ml-1">
          <button 
            disabled={!canDraw}
            className="text-white text-lg w-6 h-full flex items-center justify-center disabled:opacity-50"
            onClick={() => setCurrentSize(Math.max(2, currentSize - 2))}
          >
            -
          </button>
          <div className="w-8 text-center text-xs font-mono text-white">{currentSize}px</div>
          <button 
            disabled={!canDraw}
            className="text-white text-lg w-6 h-full flex items-center justify-center disabled:opacity-50"
            onClick={() => setCurrentSize(Math.min(32, currentSize + 2))}
          >
            +
          </button>
        </div>

        <div className="h-8 w-[1px] bg-dark-3 mx-1" />

        <Button 
          variant="default" 
          size="icon" 
          disabled={strokes.filter(s => s.userId === currentUserId).length === 0 || !canDraw}
          className="rounded-full bg-dark-3 hover:bg-dark-4"
          onClick={undo}
        >
          <Undo size={18} className="text-white" />
        </Button>

        {isHost && (
          <>
            <div className="h-8 w-[1px] bg-dark-3 mx-1" />
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full bg-red-500 hover:bg-red-600"
              onClick={clear}
              title="Clear Board for Everyone"
            >
              <Trash2 size={18} className="text-white" />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              className={cn("rounded-full ml-1", showPermissions ? "bg-blue-1" : "bg-dark-3 hover:bg-dark-4")}
              onClick={() => setShowPermissions(!showPermissions)}
              title="Manage Drawing Permissions"
            >
              <Users size={18} className="text-white" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Whiteboard;
