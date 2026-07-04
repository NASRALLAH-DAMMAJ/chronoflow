import { RAD_PER_MINUTE } from '../../../store/constants'

const PI = Math.PI
const TAU = 2 * PI

export { PI, TAU }

export function renderMinuteToRadians(rm) {
  return rm * RAD_PER_MINUTE - PI / 2
}
