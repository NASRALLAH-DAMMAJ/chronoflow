import { MINUTES_IN_DAY } from '../store/constants'

/**
 * Checks if two blocks overlap.
 * Handles midnight wrapping correctly.
 * @param {object} block1
 * @param {object} block2
 * @returns {boolean}
 */
function doBlocksOverlap(block1, block2) {
  const normalize = (start, end) => {
    if (end <= start) return [{ start, end: MINUTES_IN_DAY }, { start: 0, end }]
    return [{ start, end }]
  }

  const ranges1 = normalize(block1.start, block1.end)
  const ranges2 = normalize(block2.start, block2.end)

  for (const r1 of ranges1) {
    for (const r2 of ranges2) {
      if (Math.max(r1.start, r2.start) < Math.min(r1.end, r2.end)) {
        return true
      }
    }
  }
  return false
}

/**
 * Detects all overlaps for a given block within a list of all blocks.
 * @param {object} targetBlock
 * @param {Array<object>} allBlocks
 * @returns {Array<object>}
 */
export function getOverlappingBlocks(targetBlock, allBlocks) {
  return allBlocks.filter(block => {
    if (block.id === targetBlock.id) return false
    return doBlocksOverlap(targetBlock, block)
  })
}

/**
 * Computes overlap metadata for all blocks in a list.
 * Adds `overlapGroupIds` (array of IDs), `overlapCount`, `overlapIndex` to each block.
 * @param {Array<object>} blocks
 * @returns {Array<object>}
 */
export function computeOverlapMetadata(blocks) {
  const blocksWithOverlap = blocks.map(b => ({ ...b, overlapGroupIds: [], overlapCount: 0, overlapIndex: 0 }))

  for (let i = 0; i < blocksWithOverlap.length; i++) {
    for (let j = i + 1; j < blocksWithOverlap.length; j++) {
      const block1 = blocksWithOverlap[i]
      const block2 = blocksWithOverlap[j]

      if (doBlocksOverlap(block1, block2)) {
        if (!block1.overlapGroupIds.includes(block2.id)) block1.overlapGroupIds.push(block2.id)
        if (!block2.overlapGroupIds.includes(block1.id)) block2.overlapGroupIds.push(block1.id)
      }
    }
  }

  const finalBlocks = blocksWithOverlap.map(b => ({
    ...b,
    overlapCount: b.overlapGroupIds.length,
  }))

  // Determine overlapIndex for rendering lanes
  const sortedOverlaps = []
  for (const block of finalBlocks) {
    if (block.overlapCount > 0) {
      let placed = false
      for (let i = 0; i < sortedOverlaps.length; i++) {
        const currentLaneBlocks = sortedOverlaps[i]
        // Check if block can fit in this lane without overlapping existing blocks in the lane
        let canFit = true
        for (const laneBlock of currentLaneBlocks) {
          if (doBlocksOverlap(block, laneBlock)) {
            canFit = false
            break
          }
        }
        if (canFit) {
          currentLaneBlocks.push(block)
          block.overlapIndex = i // This is the lane index
          placed = true
          break
        }
      }
      if (!placed) {
        sortedOverlaps.push([block])
        block.overlapIndex = sortedOverlaps.length - 1
      }
    }
  }
  
  // After determining overlapIndex, normalize overlapCount to be the max index + 1 for each group
  for (const block of finalBlocks) {
    if (block.overlapCount > 0) {
      let maxIndex = block.overlapIndex
      for (const id of block.overlapGroupIds) {
        const overlappingBlock = finalBlocks.find(b => b.id === id)
        if (overlappingBlock) {
          maxIndex = Math.max(maxIndex, overlappingBlock.overlapIndex)
        }
      }
      block.overlapCount = maxIndex + 1
    }
  }

  return finalBlocks
}
