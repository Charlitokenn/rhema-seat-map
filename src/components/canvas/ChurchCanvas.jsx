import React, {
  useRef, useEffect, useState,
  useCallback, useMemo, memo,
} from 'react'
import Konva from 'konva'
import { Stage, Layer, Rect, Text, Circle, Group, Image } from 'react-konva'
import { useChurchStore } from '@/store/churchStore.js'
import { useUiStore } from '@/store/uiStore.js'
import { TABLES, SEAT_W, SEAT_H } from '@/data/churchLayout.js'
import SeatPopup from '../ui/SeatPopup.jsx'
import { Button } from '@/components/ui/button'
import {
  Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { PlusIcon, MinusIcon } from 'lucide-react'
import useImage from 'use-image'

// ── OFFICIAL DOCS FIX 1 ───────────────────────────────────────────────────────
// "by default Konva prevents some events when a node is dragging.
//  We need to enable all events on Konva, even when dragging a node,
//  so it triggers touchmove correctly."
//  https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html
Konva.hitOnDragEnabled = true

// ── Constants ─────────────────────────────────────────────────────────────────
const CANVAS_W  = 1500
const CANVAS_H  = 800
const MIN_SCALE = 0.12
const MAX_SCALE = 4.0

const SEAT_FILL = { M: '#bfdbfe', W: '#fbcfe8', C: '#fef08a' }
const SEAT_TEXT = { M: '#1d4ed8', W: '#be185d', C: '#a16207' }

// ── Geometry helpers (mirrors official Konva docs naming) ────────────────────
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
}
function getCenter(p1, p2) {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
}

// ── Individual seat shape ─────────────────────────────────────────────────────
const SeatShape = memo(function SeatShape({ seat, isSelected, onSeatClick }) {
  const empty  = !seat.occupantType
  const fill   = empty ? '#ffffff' : SEAT_FILL[seat.occupantType]
  const stroke = isSelected ? '#7c3aed' : (empty ? '#374151' : '#9ca3af')

  const handleClick = useCallback(e => {
    e.cancelBubble = true
    onSeatClick(seat, e)
  }, [seat, onSeatClick])

  return (
      <Group
          x={seat.x}
          y={seat.y}
          onClick={handleClick}
          onTap={handleClick}
          perfectDrawEnabled={false}
      >
        <Rect
            width={SEAT_W}
            height={SEAT_H}
            fill={fill}
            stroke={stroke}
            strokeWidth={isSelected ? 2.5 : 1.5}
            cornerRadius={2}
            shadowForStrokeEnabled={false}
        />
        {seat.occupantType && (
            <Text
                width={SEAT_W}
                height={SEAT_H}
                text={seat.occupantType}
                fontSize={12}
                fontStyle="bold"
                fontFamily="Inter, system-ui, sans-serif"
                fill={SEAT_TEXT[seat.occupantType]}
                align="center"
                verticalAlign="middle"
                listening={false}
                perfectDrawEnabled={false}
            />
        )}
        {isSelected && (
            <Rect
                x={-2} y={-2}
                width={SEAT_W + 4}
                height={SEAT_H + 4}
                stroke="#7c3aed"
                strokeWidth={2}
                cornerRadius={4}
                fill="transparent"
                listening={false}
                perfectDrawEnabled={false}
            />
        )}
      </Group>
  )
})

// ── Main canvas ───────────────────────────────────────────────────────────────
export default function ChurchCanvas() {
  const containerRef = useRef(null)
  const stageRef     = useRef(null)
  const [size, setSize]           = useState({ w: 900, h: 600 })
  const [popupInfo, setPopupInfo] = useState(null)

  const seats = useChurchStore(s => s.seats)

  const scale       = useUiStore(s => s.scale)
  const stagePos    = useUiStore(s => s.stagePos)
  const setScale    = useUiStore(s => s.setScale)
  const setStagePos = useUiStore(s => s.setStagePos)
  const zoomIn      = useUiStore(s => s.zoomIn)
  const zoomOut     = useUiStore(s => s.zoomOut)

  const scaleRef    = useRef(scale);    scaleRef.current    = scale
  const stagePosRef = useRef(stagePos); stagePosRef.current = stagePos

  // ── OFFICIAL DOCS FIX 2 ─────────────────────────────────────────────────────
  // Track lastCenter (midpoint) as well as lastDist.
  // Without lastCenter the stage can't pan simultaneously during a pinch.
  // The official docs track both and apply the delta (dx, dy) of the midpoint
  // as a pan offset on top of the scale transform.
  const lastDistRef   = useRef(0)
  const lastCenterRef = useRef(null)

  // ── OFFICIAL DOCS FIX 3 ─────────────────────────────────────────────────────
  // Track whether Konva's drag was stopped by a pinch so we can restore it
  // when the user lifts one finger and continues with a single-finger pan.
  // The official docs use a `dragStopped` boolean for exactly this.
  const dragStoppedRef = useRef(false)

  // Guard: suppress seat onTap that fires at the moment fingers are lifted
  const isPinchingRef  = useRef(false)

  const [cameraImage]   = useImage('/camera.png')
  const [keyboardImage] = useImage('/keyboard.png')

  // ── Container resize observer ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Auto-centre on first load ───────────────────────────────────────────────
  const centred = useRef(false)
  useEffect(() => {
    if (!size.w || centred.current) return
    centred.current = true
    const s = Math.min(
        (size.w * 0.95) / CANVAS_W,
        (size.h * 0.95) / CANVAS_H,
        1
    )
    setScale(s)
    setStagePos({
      x: (size.w - CANVAS_W * s) / 2,
      y: (size.h - CANVAS_H * s) / 2,
    })
  }, [size.w, size.h, setScale, setStagePos])

  // Close popup on any zoom change
  useEffect(() => { setPopupInfo(null) }, [scale])

  // ── Wheel zoom (desktop / trackpad) ────────────────────────────────────────
  const handleWheel = useCallback(e => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const ptr = stage.getPointerPosition()
    const s   = scaleRef.current
    const sp  = stagePosRef.current
    const dir = e.evt.deltaY > 0 ? -1 : 1
    const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
        s * (1 + dir * 0.001 * Math.abs(e.evt.deltaY))
    ))
    setScale(newScale)
    setStagePos({
      x: ptr.x - (ptr.x - sp.x) * (newScale / s),
      y: ptr.y - (ptr.y - sp.y) * (newScale / s),
    })
  }, [setScale, setStagePos])

  // ── OFFICIAL DOCS FIX 4 ─────────────────────────────────────────────────────
  // Pinch-to-zoom following the exact official Konva docs algorithm:
  // https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html
  //
  // Key differences from a naive implementation:
  //
  //   a) e.evt.preventDefault() is called INSIDE the Konva touchmove handler,
  //      not via a separate native DOM listener. Konva's own listeners are
  //      non-passive, so preventDefault() works without a separate useEffect.
  //
  //   b) The position formula accounts for BOTH zoom-toward-center AND
  //      simultaneous pan by tracking the delta (dx, dy) of the midpoint:
  //        newPos.x = newCenter.x - pointTo.x * newScale + dx
  //        newPos.y = newCenter.y - pointTo.y * newScale + dy
  //      Without dx/dy the canvas jumps when the fingers pan while pinching.
  //
  //   c) When going from 2 fingers → 1 finger, stage.startDrag() is called
  //      to restore Konva's built-in drag seamlessly. Without this the user
  //      must lift all fingers and re-touch to resume panning.
  const handleTouchMove = useCallback(e => {
    e.evt.preventDefault()

    const touch1 = e.evt.touches[0]
    const touch2 = e.evt.touches[1]
    const stage  = stageRef.current
    if (!stage) return

    // Restore single-finger drag after a pinch ends (2 fingers → 1 finger)
    if (touch1 && !touch2 && !stage.isDragging() && dragStoppedRef.current) {
      stage.startDrag()
      dragStoppedRef.current = false
    }

    if (touch1 && touch2) {
      isPinchingRef.current = true
      setPopupInfo(null)

      // Pause Konva's built-in drag while we handle two-pointer pan+zoom
      if (stage.isDragging()) {
        dragStoppedRef.current = true
        stage.stopDrag()
      }

      const rect = stage.container().getBoundingClientRect()
      const p1 = { x: touch1.clientX - rect.left, y: touch1.clientY - rect.top }
      const p2 = { x: touch2.clientX - rect.left, y: touch2.clientY - rect.top }

      // First frame — record center and return; no transform yet
      if (!lastCenterRef.current) {
        lastCenterRef.current = getCenter(p1, p2)
        return
      }

      const newCenter = getCenter(p1, p2)
      const dist      = getDistance(p1, p2)

      if (!lastDistRef.current) {
        lastDistRef.current = dist
        return
      }

      const s  = scaleRef.current
      const sp = stagePosRef.current

      // Convert the pinch midpoint from screen → canvas-local coordinates
      const pointTo = {
        x: (newCenter.x - sp.x) / s,
        y: (newCenter.y - sp.y) / s,
      }

      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE,
          s * (dist / lastDistRef.current)
      ))

      // Delta of the midpoint between frames = simultaneous pan
      const dx = newCenter.x - lastCenterRef.current.x
      const dy = newCenter.y - lastCenterRef.current.y

      const newPos = {
        x: newCenter.x - pointTo.x * newScale + dx,
        y: newCenter.y - pointTo.y * newScale + dy,
      }

      setScale(newScale)
      setStagePos(newPos)

      lastDistRef.current   = dist
      lastCenterRef.current = newCenter
    }
  }, [setScale, setStagePos])

  const handleTouchEnd = useCallback(() => {
    // Reset both refs — docs reset both lastDist and lastCenter on touchend
    lastDistRef.current   = 0
    lastCenterRef.current = null
    // Short delay prevents the trailing tap from opening a seat popup
    setTimeout(() => { isPinchingRef.current = false }, 60)
  }, [])

  // ── Stage background tap → close popup ─────────────────────────────────────
  const handleStageClick = useCallback(() => setPopupInfo(null), [])

  // ── Seat tap → open popup ───────────────────────────────────────────────────
  const handleSeatClick = useCallback(seat => {
    if (isPinchingRef.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const s  = scaleRef.current
    const sp = stagePosRef.current
    setPopupInfo({
      seatId:  seat.id,
      screenX: rect.left + sp.x + (seat.x + SEAT_W / 2) * s,
      screenY: rect.top  + sp.y + seat.y * s,
    })
  }, [])

  // ── Reset zoom + re-centre ──────────────────────────────────────────────────
  function handleResetZoom() {
    centred.current = false
    const s = Math.min(
        (size.w * 0.95) / CANVAS_W,
        (size.h * 0.95) / CANVAS_H,
        1
    )
    setScale(s)
    setStagePos({
      x: (size.w - CANVAS_W * s) / 2,
      y: (size.h - CANVAS_H * s) / 2,
    })
  }

  const seatsArray = useMemo(() => Object.values(seats), [seats])

  return (
      <div
          ref={containerRef}
          className="w-full h-full overflow-hidden touch-none relative select-none bg-muted"
      >
        <Stage
            ref={stageRef}
            width={size.w}
            height={size.h}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            draggable
            onWheel={handleWheel}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDragEnd={e => setStagePos({ x: e.target.x(), y: e.target.y() })}
        >
          {/* Static non-interactive layer */}
          <Layer listening={false} perfectDrawEnabled={false}>

            <Rect x={40} y={40} width={1380} height={710} cornerRadius={10}
                  fill="#ffffff" stroke="#111827" strokeWidth={2} />

            <Rect x={500} y={70} width={600} height={130}
                  fill="#f9fafb" stroke="#111827" strokeWidth={3} />
            <Text text="ALTAR" x={720} y={118}
                  fontSize={38} fontStyle="bold"
                  fontFamily="Inter, system-ui, sans-serif" fill="#374151" />

            <Rect x={1320} y={50} width={70} height={180}
                  fill="#f9fafb" stroke="#111827" strokeWidth={0} />
            <Image x={1230} y={180} alt="Keyboard" rotationDeg={270}
                   image={keyboardImage} width={100} height={75} />

            <Rect x={1320} y={42} width={100} height={185} cornerRadius={5}
                  fill="#A9A9A9" stroke="#111827" strokeWidth={0} />
            <Text text="PT's Office" x={1360} y={190} rotation={-90}
                  fontSize={24} fontFamily="Inter, system-ui, sans-serif" fill="#6b7280" />

            <Rect x={25} y={390} width={30} height={80}
                  fill="#f9fafb" stroke="#111827" strokeWidth={2} />
            <Text text="Door" x={33} y={453} rotation={-90}
                  fontSize={18} fontFamily="Inter, system-ui, sans-serif" fill="#6b7280" />

            {TABLES.map(t => (
                <Circle key={t.id} x={t.x} y={t.y}
                        radius={12} fill="#d1d5db" stroke="#111827" strokeWidth={1} />
            ))}

            <Rect x={740} y={630} width={180} height={40}
                  fill="#f9fafb" stroke="#111827" strokeWidth={2} />
            <Text text="Media" x={800} y={640}
                  fontSize={22} fontFamily="Inter, system-ui, sans-serif" fill="#374151" />

            <Rect x={680} y={698} width={50} height={50} cornerRadius={5}
                  fill="#f9fafb" stroke="#111827" strokeWidth={1} />
            <Image x={680} y={698} alt="Camera"
                   image={cameraImage} width={40} height={40} />

            <Rect x={570} y={740} width={90} height={25}
                  fill="#f9fafb" stroke="#111827" strokeWidth={2} />
            <Text text="Entrance" x={575} y={743}
                  fontSize={18} fontFamily="Inter, system-ui, sans-serif" fill="#374151" />

          </Layer>

          {/* Interactive seat layer */}
          <Layer>
            {seatsArray.map(seat => (
                <SeatShape
                    key={seat.id}
                    seat={seat}
                    isSelected={popupInfo?.seatId === seat.id}
                    onSeatClick={handleSeatClick}
                />
            ))}
          </Layer>
        </Stage>

        {popupInfo && (
            <SeatPopup
                seatId={popupInfo.seatId}
                anchorX={popupInfo.screenX}
                anchorY={popupInfo.screenY}
                onClose={() => setPopupInfo(null)}
            />
        )}

        <TooltipProvider delayDuration={400}>
          <div className="absolute bottom-4 right-4 z-10 flex flex-col rounded-lg overflow-hidden border bg-background shadow-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none border-b"
                        onClick={zoomIn} aria-label="Zoom in">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Zoom in</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm"
                        className="h-9 w-9 rounded-none border-b px-0 font-mono text-[11px] text-muted-foreground"
                        onClick={handleResetZoom} aria-label="Reset zoom">
                  {Math.round(scale * 100)}%
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Reset zoom</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-none"
                        onClick={zoomOut} aria-label="Zoom out">
                  <MinusIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Zoom out</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {scale < 0.35 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none select-none backdrop-blur-sm">
              Pinch to zoom · Drag to pan
            </div>
        )}
      </div>
  )
}