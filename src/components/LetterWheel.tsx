import { useEffect, useRef, useState } from 'react'

type LetterWheelProps = {
  letters: string[]
  status: 'idle' | 'success' | 'bonus' | 'error'
  onSubmit: (word: string) => void
  onWordChange: (word: string) => void
}

export function LetterWheel({
  letters,
  status,
  onSubmit,
  onWordChange,
}: LetterWheelProps) {
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const wheelRef = useRef<HTMLDivElement | null>(null)
  const selectedRef = useRef<number[]>([])
  const movedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    selectedRef.current = selectedIndexes
    onWordChange(selectedIndexes.map((index) => letters[index]).join(''))
  }, [letters, onWordChange, selectedIndexes])

  useEffect(() => {
    setSelectedIndexes([])
  }, [letters])

  const addIndex = (index: number) => {
    setSelectedIndexes((current) =>
      current.includes(index) ? current : [...current, index],
    )
  }

  const toggleIndex = (index: number) => {
    setSelectedIndexes((current) =>
      current.includes(index)
        ? current.filter((selectedIndex) => selectedIndex !== index)
        : [...current, index],
    )
  }

  const submitSelected = () => {
    const word = selectedRef.current.map((index) => letters[index]).join('')

    if (word.length > 0) {
      onSubmit(word)
    }

    setSelectedIndexes([])
  }

  const handlePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    index: number,
  ) => {
    event.preventDefault()
    wheelRef.current?.setPointerCapture(event.pointerId)
    startRef.current = { x: event.clientX, y: event.clientY }
    movedRef.current = false
    setIsDragging(true)
    toggleIndex(index)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return
    }

    const dx = event.clientX - startRef.current.x
    const dy = event.clientY - startRef.current.y

    if (Math.hypot(dx, dy) > 8) {
      movedRef.current = true
    }

    const element = document.elementFromPoint(event.clientX, event.clientY)
    const letterButton = element?.closest<HTMLButtonElement>('[data-wheel-index]')

    if (letterButton?.dataset.wheelIndex) {
      addIndex(Number(letterButton.dataset.wheelIndex))
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return
    }

    if (wheelRef.current?.hasPointerCapture(event.pointerId)) {
      wheelRef.current.releasePointerCapture(event.pointerId)
    }

    setIsDragging(false)

    if (movedRef.current && selectedRef.current.length > 1) {
      submitSelected()
    }
  }

  const selectedWord = selectedIndexes.map((index) => letters[index]).join('')

  return (
    <section className={`wheel-panel ${status}`} aria-label="Letter wheel">
      <div className="selected-word" aria-live="polite">
        {selectedWord || 'Connect letters'}
      </div>

      <div
        className="letter-wheel"
        ref={wheelRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="wheel-orbit" aria-hidden="true" />
        {letters.map((letter, index) => {
          const angle = (Math.PI * 2 * index) / letters.length - Math.PI / 2
          const radius = 42
          const x = 50 + Math.cos(angle) * radius
          const y = 50 + Math.sin(angle) * radius
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
        <button type="button" onClick={() => setSelectedIndexes([])}>
          Clear
        </button>
        <button type="button" onClick={submitSelected}>
          Enter
        </button>
      </div>
    </section>
  )
}
