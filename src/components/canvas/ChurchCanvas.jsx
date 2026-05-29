import React, {
  useRef, useEffect, useState,
  useCallback, useMemo, memo,
} from 'react'
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
import { PlusIcon, MinusIcon} from 'lucide-react'
import useImage from 'use-image';
import { Popover, PopoverTrigger } from "@/components/ui/popover";

// Logical canvas dimensions
const CANVAS_W  = 1500
const CANVAS_H  = 800
const MIN_SCALE = 0.12
const MAX_SCALE = 4.0

const SEAT_FILL = {
  M: '#bfdbfe',  // blue-200
  W: '#fbcfe8',  // pink-200
  C: '#fef08a',  // yellow-200
}
const SEAT_TEXT = {
  M: '#1d4ed8',  // blue-700
  W: '#be185d',  // pink-700
  C: '#a16207',  // yellow-700
}

// ── Individual seat shape ────────────────────────────────────────────────────
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

// ── Main canvas ──────────────────────────────────────────────────────────────
export default function ChurchCanvas() {
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const [size, setSize] = useState({w: 900, h: 600})
  const [popupInfo, setPopupInfo] = useState(null)
  // { seatId, screenX, screenY }

  const seats = useChurchStore(s => s.seats)

  const scale = useUiStore(s => s.scale)
  const stagePos = useUiStore(s => s.stagePos)
  const setScale = useUiStore(s => s.setScale)
  const setStagePos = useUiStore(s => s.setStagePos)
  const zoomIn = useUiStore(s => s.zoomIn)
  const zoomOut = useUiStore(s => s.zoomOut)

  const scaleRef = useRef(scale);
  scaleRef.current = scale
  const stagePosRef = useRef(stagePos);
  stagePosRef.current = stagePos

  const [cameraImage] = useImage('/camera.png');
  const [keyboardImage] = useImage('/keyboard.png');

  // Observe container size
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const {width, height} = entries[0].contentRect
      setSize({w: width, h: height})
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Auto-centre on first load
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

  // Close popup when zooming
  useEffect(() => {
    setPopupInfo(null)
  }, [scale])

  // Wheel zoom around pointer
  const handleWheel = useCallback(e => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const ptr = stage.getPointerPosition()
    const s = scaleRef.current
    const sp = stagePosRef.current
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

  const handleStageClick = useCallback(() => setPopupInfo(null), [])

  const handleSeatClick = useCallback((seat) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const s = scaleRef.current
    const sp = stagePosRef.current
    setPopupInfo({
      seatId: seat.id,
      screenX: rect.left + sp.x + (seat.x + SEAT_W / 2) * s,
      screenY: rect.top + sp.y + seat.y * s,
    })
  }, [])

  // Reset zoom and re-centre
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
            onClick={handleStageClick}
            onTap={handleStageClick}
            onDragEnd={e => setStagePos({x: e.target.x(), y: e.target.y()})}
        >
          {/* Static non-interactive layer */}
          <Layer listening={false} perfectDrawEnabled={false}>

            {/* Outer hall border */}
            <Rect x={40} y={40} width={1380} height={710} cornerRadius={10}
                  fill="#ffffff" stroke="#111827" strokeWidth={2}/>

            {/* Altar */}
            <Rect x={500} y={70} width={600} height={130}
                  fill="#f9fafb" stroke="#111827" strokeWidth={3}/>
            <Text text="ALTAR" x={720} y={118}
                  fontSize={38} fontStyle="bold"
                  fontFamily="Inter, system-ui, sans-serif" fill="#374151"/>

            {/* Keyboard */}
            <Rect x={1320} y={50} width={70} height={180}
                  fill="#f9fafb" stroke="#111827" strokeWidth={0}/>
            <Image x={1230} y={180} alt={"Keyboard"} rotationDeg={270}
                   image={keyboardImage} width={100}  height={75}/>

            {/* PT's Office */}
            <Rect x={1320} y={42} width={100} height={185} cornerRadius={5}
                  fill="#A9A9A9 " stroke="#111827" strokeWidth={0}/>
            <Text text="PT's Office" x={1360} y={190} rotation={-90}
                  fontSize={24} fontFamily="Inter, system-ui, sans-serif" fill="#6b7280"/>

            {/* Left Box */}
            <Rect x={25} y={390} width={30} height={80}
                  fill="#f9fafb" stroke="#111827" strokeWidth={2}/>
            <Text text="Door" x={33} y={453} rotation={-90}
                  fontSize={18} fontFamily="Inter, system-ui, sans-serif" fill="#6b7280"/>

            {/* Decorative tables */}
            {TABLES.map(t => (
                <Circle key={t.id} x={t.x} y={t.y}
                        radius={12} fill="#d1d5db" stroke="#111827" strokeWidth={1}/>
            ))}

            {/* Media desk */}
            <Rect x={740} y={630} width={180} height={40}
                  fill="#f9fafb" stroke="#111827" strokeWidth={2}/>
            <Text text="Media" x={800} y={640}
                  fontSize={22} fontFamily="Inter, system-ui, sans-serif" fill="#374151"/>

            {/* Camera Platform */}
            <Rect x={680} y={698} width={50} height={50} cornerRadius={5}
                  fill="#f9fafb" stroke="#111827" strokeWidth={1}/>
            <Image x={680} y={698} alt={"Camera"} image={cameraImage} width={40}  height={40}/>

            {/* Entrance */}
            <Rect x={570} y={740} width={90} height={25}
                  fill="#f9fafb" stroke="#111827" strokeWidth={2}/>
            <Text text="Entrance" x={575} y={743}
                  fontSize={18} fontFamily="Inter, system-ui, sans-serif" fill="#374151"/>

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

        {/* Seat assignment popup */}
        {popupInfo && (
            <SeatPopup
                seatId={popupInfo.seatId}
                anchorX={popupInfo.screenX}
                anchorY={popupInfo.screenY}
                onClose={() => setPopupInfo(null)}
            />
        )}

        {/* Zoom controls — shadcn Buttons */}
        <TooltipProvider delayDuration={400}>
          <div
              className="absolute bottom-4 right-4 z-10 flex flex-col rounded-lg overflow-hidden border bg-background shadow-md">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none border-b"
                    onClick={zoomIn}
                    aria-label="Zoom in"
                >
                  <PlusIcon className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Zoom in</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 rounded-none border-b px-0 font-mono text-[11px] text-muted-foreground"
                    onClick={handleResetZoom}
                    aria-label="Reset zoom"
                >
                  {Math.round(scale * 100)}%
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Reset zoom</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-none"
                    onClick={zoomOut}
                    aria-label="Zoom out"
                >
                  <MinusIcon className="h-4 w-4"/>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">Zoom out</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Pan/zoom hint at low zoom */}
        {scale < 0.35 && (
            <div
                className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none select-none backdrop-blur-sm">
              Scroll to zoom · Drag to pan
            </div>
        )}
      </div>
  )
}