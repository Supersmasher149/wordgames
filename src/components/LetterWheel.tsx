import { useEffect, useRef, useState } from 'react'
import pawSvg from '../assets/icons/paw.svg'
import checkPawSvg from '../assets/icons/check-paw.svg'
import yarnBallSvg from '../assets/decor/yarn-ball.svg'

type LetterWheelProps = {
  letters: string[]
  status: 'idle' | 'success' | 'bonus' | 'error'
  animationKey: number
  onSubmit: (word: string) => void
  onWordChange: (word: string) => void
}

const DRAG_THRESHOLD = 8
const LETTER_RADIUS = 42

export function LetterWheel({
  letters,
  status,
  animationKey,
  onSubmit,
  onWordChange,
}: LetterWheelProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([])
  const [dragPoint, setDragPoint] = useState<{ x: number; y: number } | null>(
    null,
  )
  const wheelRef = useRef<HTMLDivElement | null>(null)
  const selectedRef = useRef<number[]>([])
  const movedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const startIndexRef = useRef<number | null>(null)
  const startedSelectedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  const getLocalPoint = (clientX: number, clientY: number) => {
    const rect = wheelRef.current?.getBoundingClientRect()
    if (!rect) return null
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }

  useEffect(() => {
    selectedRef.current = selectedIndexes
    onWordChange(selectedIndexes.map((index) => letters[index]).join(''))
  }, [letters, onWordChange, selectedIndexes])

  useEffect(
    () => () => {
      document.body.classList.remove('is-wheel-dragging')
    },
    [],
  )

  useEffect(() => {
    commitSelection([])
  }, [letters])

  const commitSelection = (indexes: number[]) => {
    selectedRef.current = indexes
    setSelectedIndexes(indexes)
  }

  const syncSelection = (indexes: number[]) => {
    selectedRef.current = indexes
    return indexes
  }

  const addIndex = (index: number) => {
    setSelectedIndexes((current) =>
      current.includes(index) ? current : syncSelection([...current, index]),
    )
  }

  const removeIndex = (index: number) => {
    setSelectedIndexes((current) =>
      syncSelection(current.filter((selectedIndex) => selectedIndex !== index)),
    )
  }

  const submitSelected = () => {
    const word = selectedRef.current.map((index) => letters[index]).join('')

    if (word.length > 0) {
      onSubmit(word)
    }

    commitSelection([])
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    event.preventDefault()
    wheelRef.current?.setPointerCapture(event.pointerId)
    document.body.classList.add('is-wheel-dragging')
    startRef.current = { x: event.clientX, y: event.clientY }
    startIndexRef.current = index
    startedSelectedRef.current = selectedRef.current.includes(index)
    movedRef.current = false
    isDraggingRef.current = true
    setDragPoint(getLocalPoint(event.clientX, event.clientY))

    if (!startedSelectedRef.current) {
      addIndex(index)
    }
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return
    }

    event.preventDefault()

    const dx = event.clientX - startRef.current.x
    const dy = event.clientY - startRef.current.y

    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      movedRef.current = true
    }

    setDragPoint(getLocalPoint(event.clientX, event.clientY))

    const element = document.elementFromPoint(event.clientX, event.clientY)
    const letterButton = element?.closest<HTMLButtonElement>('[data-wheel-index]')

    if (letterButton?.dataset.wheelIndex) {
      addIndex(Number(letterButton.dataset.wheelIndex))
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) {
      return
    }

    event.preventDefault()

    if (wheelRef.current?.hasPointerCapture(event.pointerId)) {
      wheelRef.current.releasePointerCapture(event.pointerId)
    }

    document.body.classList.remove('is-wheel-dragging')
    isDraggingRef.current = false
    setDragPoint(null)

    if (movedRef.current && selectedRef.current.length > 1) {
      submitSelected()
    } else if (startIndexRef.current !== null && startedSelectedRef.current) {
      removeIndex(startIndexRef.current)
    }

    startIndexRef.current = null
  }

  const selectedWord = selectedIndexes.map((index) => letters[index]).join('')
  const positions = letters.map((_, index) => getLetterPosition(index, letters.length))

  const pathPoints = selectedIndexes.map((index) => positions[index])
  if (dragPoint) {
    pathPoints.push(dragPoint)
  }

  const selectedPoints = pathPoints
    .map((position) => `${position.x},${position.y}`)
    .join(' ')

  return (
    <section className={`wheel-panel ${status}`} aria-label="Letter wheel">
      <div className="selected-word" aria-live="polite">
        {selectedWord || 'Connect letters'}
      </div>

      <div
        className="letter-wheel"
        key={`wheel-${animationKey}`}
        ref={wheelRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="yarn-ring-decor" aria-hidden="true" />
        <div className="wheel-orbit" aria-hidden="true" />
        <svg className="selection-path" viewBox="0 0 100 100" aria-hidden="true">
          {selectedPoints && <polyline points={selectedPoints} />}
        </svg>
        <div className="wheel-center" aria-hidden="true">
          <img src={yarnBallSvg} alt="" />
        </div>
        {letters.map((letter, index) => {
          const { x, y } = positions[index]
          const selectedOrder = selectedIndexes.indexOf(index)

          return (
            <button
              className={`wheel-letter ${selectedOrder >= 0 ? 'selected' : ''}`}
              data-wheel-index={index}
              key={`${letter}-${index}`}
              onPointerDown={(event) => handlePointerDown(event, index)}
              style={{ left: `${x}%`, top: `${y}%` }}
              type="button"
            >
              <span>{letter}</span>
              {selectedOrder >= 0 && (
                <small aria-hidden="true">{selectedOrder + 1}</small>
              )}
            </button>
          )
        })}
      </div>

      <div className="tap-actions" aria-label="Tap input actions">
        <button type="button" onClick={() => commitSelection([])} className="btn-teal">
          <img src={pawSvg} alt="" className="btn-icon" />
          <span>Clear</span>
        </button>
        <button type="button" onClick={submitSelected} className="btn-coral">
          <img src={checkPawSvg} alt="" className="btn-icon" />
          <span>Enter</span>
        </button>
      </div>
    </section>
  )
}

function getLetterPosition(index: number, total: number) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2

  return {
    x: 50 + Math.cos(angle) * LETTER_RADIUS,
    y: 50 + Math.sin(angle) * LETTER_RADIUS,
  }
}
