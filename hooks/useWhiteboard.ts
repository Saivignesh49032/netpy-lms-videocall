import { useState, useEffect, useRef, useCallback, useMemo, type MouseEvent, type TouchEvent } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Point = { x: number; y: number };

export type Stroke = {
  id: string;
  userId: string;
  tool: 'pen' | 'eraser';
  color: string;
  size: number;
  points: Point[];
};

type WhiteboardEvent =
  | { type: 'stroke'; payload: Stroke }
  | { type: 'clear'; payload: {} }
  | { type: 'undo'; payload: { strokeId: string; userId: string } }
  | { type: 'permission_update'; payload: { userId: string; canDraw: boolean } };

export const useWhiteboard = (meetingId: string, isHost: boolean, currentUserId: string) => {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [canDraw, setCanDraw] = useState(isHost); // Host can always draw by default
  const [drawPermissions, setDrawPermissions] = useState<Record<string, boolean>>({});
  
  const [currentTool, setCurrentTool] = useState<'pen' | 'eraser'>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(4);

  const channelRef = useRef<any>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    setCanDraw(isHost);
  }, [isHost]);

  useEffect(() => {
    if (!meetingId) return;

    const channel = supabase.channel(`whiteboard:${meetingId}`);

    channel
      .on('broadcast', { event: 'whiteboard' }, ({ payload }: { payload: WhiteboardEvent }) => {
        if (payload.type === 'stroke') {
          setStrokes((prev) => [...prev, payload.payload]);
        } else if (payload.type === 'clear') {
          setStrokes([]);
        } else if (payload.type === 'undo') {
          setStrokes((prev) => prev.filter((s) => s.id !== payload.payload.strokeId));
        } else if (payload.type === 'permission_update') {
          if (isHost) {
            // Keep track of all permissions as host
            setDrawPermissions(prev => ({ ...prev, [payload.payload.userId]: payload.payload.canDraw }));
          }
          if (payload.payload.userId === currentUserId) {
            setCanDraw(payload.payload.canDraw);
            // If permission is revoked mid-stroke, cancel it
            if (!payload.payload.canDraw && isDrawingRef.current) {
              isDrawingRef.current = false;
              currentStrokeRef.current = null;
            }
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, currentUserId, isHost, supabase]);

  const broadcastEvent = useCallback((event: WhiteboardEvent) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'whiteboard',
        payload: event,
      });
    }
  }, []);

  const getCoordinates = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement): Point => {
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = (e.touches && e.touches.length > 0 ? e.touches[0] : e.changedTouches?.[0]);
      if (!touch) {
        return { x: 0, y: 0 };
      }

      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startStroke = useCallback(
    (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      if (!canDraw) return;
      isDrawingRef.current = true;
      const point = getCoordinates(e, canvas);
      
      currentStrokeRef.current = {
        id: crypto.randomUUID(),
        userId: currentUserId,
        tool: currentTool,
        color: currentTool === 'eraser' ? '#ffffff' : currentColor,
        size: currentSize,
        points: [point],
      };
    },
    [canDraw, currentTool, currentColor, currentSize, currentUserId]
  );

  const continueStroke = useCallback(
    (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      if (!isDrawingRef.current || !currentStrokeRef.current || !canDraw) return null;
      
      const point = getCoordinates(e, canvas);
      currentStrokeRef.current.points.push(point);
      
      // Return the current stroke so the component can draw it optimistically
      return currentStrokeRef.current;
    },
    [canDraw]
  );

  const endStroke = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current || !canDraw) return;
    
    isDrawingRef.current = false;
    
    // Only save and broadcast if it has points
    if (currentStrokeRef.current.points.length > 0) {
      const finalStroke = { ...currentStrokeRef.current };
      setStrokes((prev) => [...prev, finalStroke]);
      broadcastEvent({ type: 'stroke', payload: finalStroke });
    }
    
    currentStrokeRef.current = null;
  }, [canDraw, broadcastEvent]);

  const undo = useCallback(() => {
    const userStrokes = strokes.filter(s => s.userId === currentUserId);
    if (userStrokes.length === 0) return;
    
    const lastStrokeId = userStrokes[userStrokes.length - 1].id;
    setStrokes((prev) => prev.filter(s => s.id !== lastStrokeId));
    
    broadcastEvent({ type: 'undo', payload: { strokeId: lastStrokeId, userId: currentUserId } });
  }, [strokes, currentUserId, broadcastEvent]);

  const clear = useCallback(() => {
    if (!isHost) return;
    setStrokes([]);
    broadcastEvent({ type: 'clear', payload: {} });
  }, [isHost, broadcastEvent]);

  const setPermission = useCallback((userId: string, allowDraw: boolean) => {
    if (!isHost) return;
    setDrawPermissions(prev => ({ ...prev, [userId]: allowDraw }));
    broadcastEvent({ type: 'permission_update', payload: { userId, canDraw: allowDraw } });
  }, [isHost, broadcastEvent]);

  return {
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
  };
};
