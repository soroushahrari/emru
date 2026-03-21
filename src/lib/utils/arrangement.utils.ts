import type { Block } from "@/types/block.types"

type Position = {
  x: number
  y: number
}

export type ArrangementGuide =
  | {
      kind: "line"
      axis: "x" | "y"
      position: number
      start: number
      end: number
      emphasis: "edge" | "center"
    }
  | {
      kind: "gap"
      orientation: "horizontal" | "vertical"
      x: number
      y: number
      length: number
    }

export interface ArrangementState {
  activeBlockId: string | null
  guides: ArrangementGuide[]
  relatedBlockIds: string[]
}

interface ResolveMagneticArrangementArgs {
  activeBlockId: string
  movingIds: string[]
  startPositions: Record<string, Position>
  deltaX: number
  deltaY: number
  zoom: number
  blocks: Record<string, Block>
}

interface AxisCandidate {
  target: number
  delta: number
  score: number
  referenceBlockId: string
  guides: ArrangementGuide[]
}

const ALIGN_THRESHOLD_PX = 14
const SNAP_THRESHOLD_PX = 4
const GAP_THRESHOLD_PX = 18
const DEFAULT_GAP = 28
const AXIS_REACH_PX = 132
const OVERLAP_SLACK_PX = 20

function rangeDistance(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  if (aEnd < bStart) {
    return bStart - aEnd
  }

  if (bEnd < aStart) {
    return aStart - bEnd
  }

  return 0
}

function rangeOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart))
}

function midpoint(start: number, end: number) {
  return start + (end - start) / 2
}

function chooseBestCandidate(candidates: AxisCandidate[]) {
  if (candidates.length === 0) {
    return null
  }

  return candidates.reduce((best, candidate) => {
    if (!best) {
      return candidate
    }

    if (candidate.score < best.score) {
      return candidate
    }

    return best
  }, null as AxisCandidate | null)
}

function applyMagneticPull(raw: number, target: number, threshold: number) {
  const delta = target - raw
  const distance = Math.abs(delta)

  if (distance > threshold) {
    return raw
  }

  if (distance <= SNAP_THRESHOLD_PX) {
    return target
  }

  const normalized = (threshold - distance) / Math.max(1, threshold - SNAP_THRESHOLD_PX)
  const pull = 0.28 + normalized * 0.62

  return raw + delta * pull
}

function buildLineGuide(
  axis: "x" | "y",
  position: number,
  start: number,
  end: number,
  emphasis: "edge" | "center"
): ArrangementGuide {
  return {
    kind: "line",
    axis,
    position,
    start: Math.min(start, end),
    end: Math.max(start, end),
    emphasis,
  }
}

function buildHorizontalGapGuide(
  activeX: number,
  activeWidth: number,
  activeTop: number,
  activeBottom: number,
  reference: Block,
  gap: number
): ArrangementGuide {
  const referenceRight = reference.x + reference.width
  const overlapStart = Math.max(activeTop, reference.y)
  const overlapEnd = Math.min(activeBottom, reference.y + reference.height)
  const y = midpoint(overlapStart, overlapEnd)
  const activeIsRight = activeX >= reference.x
  const x = activeIsRight ? referenceRight : activeX + activeWidth

  return {
    kind: "gap",
    orientation: "horizontal",
    x,
    y,
    length: gap,
  }
}

function buildVerticalGapGuide(
  activeY: number,
  activeHeight: number,
  activeLeft: number,
  activeRight: number,
  reference: Block,
  gap: number
): ArrangementGuide {
  const referenceBottom = reference.y + reference.height
  const overlapStart = Math.max(activeLeft, reference.x)
  const overlapEnd = Math.min(activeRight, reference.x + reference.width)
  const x = midpoint(overlapStart, overlapEnd)
  const activeIsBelow = activeY >= reference.y
  const y = activeIsBelow ? referenceBottom : activeY + activeHeight

  return {
    kind: "gap",
    orientation: "vertical",
    x,
    y,
    length: gap,
  }
}

function getXAxisCandidates(
  activeBlock: Block,
  referenceBlocks: Block[],
  rawX: number,
  rawY: number,
  zoom: number
) {
  const threshold = ALIGN_THRESHOLD_PX / zoom
  const gapThreshold = GAP_THRESHOLD_PX / zoom
  const axisReach = AXIS_REACH_PX / zoom
  const overlapSlack = OVERLAP_SLACK_PX / zoom
  const gap = DEFAULT_GAP

  const activeLeft = rawX
  const activeRight = rawX + activeBlock.width
  const activeCenter = rawX + activeBlock.width / 2
  const activeTop = rawY
  const activeBottom = rawY + activeBlock.height

  const candidates: AxisCandidate[] = []

  for (const reference of referenceBlocks) {
    const referenceTop = reference.y
    const referenceBottom = reference.y + reference.height
    const perpendicularDistance = rangeDistance(
      activeTop,
      activeBottom,
      referenceTop,
      referenceBottom
    )

    if (perpendicularDistance <= axisReach) {
      const referenceLeft = reference.x
      const referenceCenter = reference.x + reference.width / 2
      const referenceRight = reference.x + reference.width
      const guideStart = Math.min(activeTop, referenceTop)
      const guideEnd = Math.max(activeBottom, referenceBottom)

      const alignmentTargets = [
        {
          target: referenceLeft,
          line: referenceLeft,
          delta: referenceLeft - activeLeft,
          emphasis: "edge" as const,
        },
        {
          target: referenceCenter - activeBlock.width / 2,
          line: referenceCenter,
          delta: referenceCenter - activeCenter,
          emphasis: "center" as const,
        },
        {
          target: referenceRight - activeBlock.width,
          line: referenceRight,
          delta: referenceRight - activeRight,
          emphasis: "edge" as const,
        },
      ]

      for (const alignmentTarget of alignmentTargets) {
        const distance = Math.abs(alignmentTarget.delta)
        if (distance > threshold) {
          continue
        }

        candidates.push({
          target: alignmentTarget.target,
          delta: alignmentTarget.delta,
          score: distance + (alignmentTarget.emphasis === "center" ? 0.3 : 0),
          referenceBlockId: reference.id,
          guides: [
            buildLineGuide(
              "x",
              alignmentTarget.line,
              guideStart,
              guideEnd,
              alignmentTarget.emphasis
            ),
          ],
        })
      }
    }

    const overlap = rangeOverlap(activeTop, activeBottom, referenceTop, referenceBottom)
    if (overlap <= overlapSlack) {
      continue
    }

    const gapTargets = [
      {
        target: reference.x + reference.width + gap,
        delta: reference.x + reference.width + gap - activeLeft,
      },
      {
        target: reference.x - gap - activeBlock.width,
        delta: reference.x - gap - activeBlock.width - activeLeft,
      },
    ]

    for (const gapTarget of gapTargets) {
      const distance = Math.abs(gapTarget.delta)
      if (distance > gapThreshold) {
        continue
      }

      candidates.push({
        target: gapTarget.target,
        delta: gapTarget.delta,
        score: distance + 0.7,
        referenceBlockId: reference.id,
        guides: [
          buildHorizontalGapGuide(
            gapTarget.target,
            activeBlock.width,
            activeTop,
            activeBottom,
            reference,
            gap
          ),
        ],
      })
    }
  }

  return {
    candidate: chooseBestCandidate(candidates),
    threshold,
  }
}

function getYAxisCandidates(
  activeBlock: Block,
  referenceBlocks: Block[],
  rawX: number,
  rawY: number,
  zoom: number
) {
  const threshold = ALIGN_THRESHOLD_PX / zoom
  const gapThreshold = GAP_THRESHOLD_PX / zoom
  const axisReach = AXIS_REACH_PX / zoom
  const overlapSlack = OVERLAP_SLACK_PX / zoom
  const gap = DEFAULT_GAP

  const activeLeft = rawX
  const activeRight = rawX + activeBlock.width
  const activeTop = rawY
  const activeBottom = rawY + activeBlock.height
  const activeMiddle = rawY + activeBlock.height / 2

  const candidates: AxisCandidate[] = []

  for (const reference of referenceBlocks) {
    const referenceLeft = reference.x
    const referenceRight = reference.x + reference.width
    const perpendicularDistance = rangeDistance(
      activeLeft,
      activeRight,
      referenceLeft,
      referenceRight
    )

    if (perpendicularDistance <= axisReach) {
      const referenceTop = reference.y
      const referenceMiddle = reference.y + reference.height / 2
      const referenceBottom = reference.y + reference.height
      const guideStart = Math.min(activeLeft, referenceLeft)
      const guideEnd = Math.max(activeRight, referenceRight)

      const alignmentTargets = [
        {
          target: referenceTop,
          line: referenceTop,
          delta: referenceTop - activeTop,
          emphasis: "edge" as const,
        },
        {
          target: referenceMiddle - activeBlock.height / 2,
          line: referenceMiddle,
          delta: referenceMiddle - activeMiddle,
          emphasis: "center" as const,
        },
        {
          target: referenceBottom - activeBlock.height,
          line: referenceBottom,
          delta: referenceBottom - activeBottom,
          emphasis: "edge" as const,
        },
      ]

      for (const alignmentTarget of alignmentTargets) {
        const distance = Math.abs(alignmentTarget.delta)
        if (distance > threshold) {
          continue
        }

        candidates.push({
          target: alignmentTarget.target,
          delta: alignmentTarget.delta,
          score: distance + (alignmentTarget.emphasis === "center" ? 0.3 : 0),
          referenceBlockId: reference.id,
          guides: [
            buildLineGuide(
              "y",
              alignmentTarget.line,
              guideStart,
              guideEnd,
              alignmentTarget.emphasis
            ),
          ],
        })
      }
    }

    const overlap = rangeOverlap(activeLeft, activeRight, referenceLeft, referenceRight)
    if (overlap <= overlapSlack) {
      continue
    }

    const gapTargets = [
      {
        target: reference.y + reference.height + gap,
        delta: reference.y + reference.height + gap - activeTop,
      },
      {
        target: reference.y - gap - activeBlock.height,
        delta: reference.y - gap - activeBlock.height - activeTop,
      },
    ]

    for (const gapTarget of gapTargets) {
      const distance = Math.abs(gapTarget.delta)
      if (distance > gapThreshold) {
        continue
      }

      candidates.push({
        target: gapTarget.target,
        delta: gapTarget.delta,
        score: distance + 0.7,
        referenceBlockId: reference.id,
        guides: [
          buildVerticalGapGuide(
            gapTarget.target,
            activeBlock.height,
            activeLeft,
            activeRight,
            reference,
            gap
          ),
        ],
      })
    }
  }

  return {
    candidate: chooseBestCandidate(candidates),
    threshold,
  }
}

export function resolveMagneticArrangement({
  activeBlockId,
  movingIds,
  startPositions,
  deltaX,
  deltaY,
  zoom,
  blocks,
}: ResolveMagneticArrangementArgs) {
  const activeBlock = blocks[activeBlockId]
  const activeStart = startPositions[activeBlockId]

  if (!activeBlock || !activeStart) {
    return {
      positions: {} as Record<string, Position>,
      guides: [] as ArrangementGuide[],
      relatedBlockIds: [] as string[],
    }
  }

  const rawX = activeStart.x + deltaX / zoom
  const rawY = activeStart.y + deltaY / zoom
  const movingIdSet = new Set(movingIds)
  const referenceBlocks = Object.values(blocks).filter((block) => !movingIdSet.has(block.id))

  const { candidate: xCandidate, threshold: xThreshold } = getXAxisCandidates(
    activeBlock,
    referenceBlocks,
    rawX,
    rawY,
    zoom
  )
  const adjustedX = xCandidate
    ? applyMagneticPull(rawX, xCandidate.target, xThreshold)
    : rawX

  const { candidate: yCandidate, threshold: yThreshold } = getYAxisCandidates(
    activeBlock,
    referenceBlocks,
    adjustedX,
    rawY,
    zoom
  )
  const adjustedY = yCandidate
    ? applyMagneticPull(rawY, yCandidate.target, yThreshold)
    : rawY

  const appliedDeltaX = adjustedX - activeStart.x
  const appliedDeltaY = adjustedY - activeStart.y

  const positions = Object.fromEntries(
    movingIds
      .map((id) => {
        const start = startPositions[id]
        if (!start) {
          return null
        }

        return [
          id,
          {
            x: start.x + appliedDeltaX,
            y: start.y + appliedDeltaY,
          },
        ] as const
      })
      .filter((entry): entry is readonly [string, Position] => Boolean(entry))
  )

  const relatedBlockIds = Array.from(
    new Set(
      [xCandidate?.referenceBlockId, yCandidate?.referenceBlockId].filter(
        (value): value is string => Boolean(value)
      )
    )
  )

  return {
    positions,
    guides: [...(xCandidate?.guides ?? []), ...(yCandidate?.guides ?? [])],
    relatedBlockIds,
  }
}

export const arrangementConstants = {
  alignThresholdPx: ALIGN_THRESHOLD_PX,
  snapThresholdPx: SNAP_THRESHOLD_PX,
  gapThresholdPx: GAP_THRESHOLD_PX,
  defaultGap: DEFAULT_GAP,
}
