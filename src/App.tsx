import { useState } from 'react'
import './App.css'

type Model = {
  done: boolean
  board: boolean[]
  pickOptions: number[]
  pick: number | undefined
  moveOptions: number[]
}

const init: Model = {
  done: false,
  board: [false].concat(Array(14).fill(true)),
  pickOptions: [3, 5],
  pick: undefined,
  moveOptions: [],
}

function range(size: number) {
  return new Array(size).fill(0).map((_, i) => i)
}

const rowCount = 5
const rowRange = range(rowCount)

function makeIndex(row: number, col: number): number {
  return col + (row ? makeIndex(row - 1, 0) + row : 0)
}

type Path = { src: number; victim: number; out: number }

const pathways: [number, number, number][] = [
  [0, 1, 3],
  [0, 2, 5],
  [1, 3, 6],
  [1, 4, 8],
  [2, 4, 7],
  [2, 5, 9],
  [3, 1, 0],
  [3, 4, 5],
  [3, 7, 12],
  [3, 6, 10],
  [4, 7, 11],
  [4, 8, 13],
  [5, 2, 0],
  [5, 9, 14],
  [5, 4, 3],
  [5, 8, 12],
  [6, 3, 1],
  [6, 7, 8],
  [7, 4, 2],
  [7, 8, 9],
  [8, 7, 6],
  [8, 4, 1],
  [9, 5, 2],
  [9, 8, 7],
  [10, 11, 12],
  [10, 6, 3],
  [11, 7, 4],
  [11, 12, 13],
  [12, 11, 10],
  [12, 13, 14],
  [12, 7, 3],
  [12, 8, 5],
  [13, 12, 11],
  [13, 8, 4],
  [14, 13, 12],
  [14, 9, 5],
]

function getPaths(board: boolean[]): Path[] {
  return pathways
    .filter(([src, victim, out]) => board[src] && board[victim] && !board[out])
    .map(([src, victim, out]) => ({ src, victim, out }))
}

function placePick(model: Model, placeIndex: number): Model {
  const pickIndex = model.pick
  if (pickIndex === placeIndex) {
    return { ...model, pick: undefined, moveOptions: [] }
  }

  const paths = getPaths(model.board)
  if (pickIndex === undefined) {
    const moveOptions = paths
      .filter((p) => p.src === placeIndex)
      .map((p) => p.out)
    if (moveOptions.length > 1) {
      return { ...model, pick: placeIndex, moveOptions }
    }

    return placePick(
      { ...model, pick: placeIndex, moveOptions },
      moveOptions[0],
    )
  }

  const match = paths.find((p) => p.src === pickIndex && p.out === placeIndex)
  if (!match) {
    throw new Error('should not have been able to click here')
  }

  const board = [...model.board]
  board[match.src] = false
  board[match.victim] = false
  board[match.out] = true

  const pickOptions = Array.from(new Set(getPaths(board).map((p) => p.src)))
  const done = pickOptions.length === 0

  return {
    ...model,
    done,
    board,
    pick: undefined,
    pickOptions,
    moveOptions: [],
  }
}

function App() {
  const [model, setModel] = useState<Model>(init)

  function handleClick(index: number) {
    setModel(placePick(model, index))
  }

  return (
    <>
      <main>
        <div className="triangle-area">
          <div className="triangle-up"></div>
          <div className="triangle-board">
            {rowRange.map((r) => {
              const colRange = range(r + 1)

              return (
                <div key={r} className="peg-row">
                  {colRange.map((c) => {
                    const index = makeIndex(r, c)

                    let child = <div className="peg-hole" />
                    let onClick = undefined
                    const hasPeg = model.board[index]
                    if (hasPeg) {
                      const picked = model.pick === index
                      const isPickOption = model.pickOptions.includes(index)
                      onClick =
                        isPickOption || picked
                          ? handleClick.bind(null, index)
                          : undefined

                      let className = 'peg-hole'
                      if (picked) {
                        className += ' peg-hole--picked'
                      }
                      if (isPickOption) {
                        className += ' peg-hole--pick-option'
                      }

                      child = (
                        <div className={className}>
                          <Peg {...{ picked, isPickOption }} />
                        </div>
                      )
                    } else {
                      const isPlaceToMove = model.moveOptions.includes(index)
                      if (isPlaceToMove) {
                        onClick = handleClick.bind(null, index)
                        child = <div className="peg-hole peg-hole--option" />
                      }
                    }

                    return (
                      <div
                        key={c}
                        {...{
                          className: onClick
                            ? 'peg-slot peg-slot--active'
                            : 'peg-slot',
                          onClick,
                        }}
                      >
                        {child}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
        <div className="triangle-bottom"></div>
      </main>
      {model.done && (
        <GameOver
          {...{
            model,
            onReset() {
              setModel(init)
            },
          }}
        />
      )}
    </>
  )
}

function GameOver({ model, onReset }: { model: Model; onReset: () => void }) {
  const score = model.board.reduce((a, b) => a + (b ? 1 : 0), 0)
  const scoreMsg =
    {
      1: 'You are a genius.',
      2: 'You are pretty smart.',
      3: 'You are dumb.',
      4: 'You are an EQ-NO-RA-MOOOSE.',
    }[score] || 'You are impressive in your own way.'

  return (
    <div className="game-over">
      <div className="game-over-toast">
        <p>
          <b>{score} remaining.</b> {scoreMsg}
        </p>
        <button onClick={() => onReset()}>Reset</button>
      </div>
    </div>
  )
}

function Peg({
  picked,
  isPickOption,
}: {
  picked: boolean
  isPickOption: boolean
}) {
  let className = 'peg-container'
  if (picked) {
    className += ' peg-container--picked'
  }
  if (isPickOption) {
    className += ' peg-container--moveable'
  }

  return (
    <div {...{ className }}>
      <div className="peg-top"></div>
      <div className="peg-rod"></div>
      <div className="peg-rod-bottom"></div>
    </div>
  )
}

export default App
