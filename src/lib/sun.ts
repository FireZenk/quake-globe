import { Vector3 } from 'three'

/** Fixed world-space direction towards the sun; lights and shaders share it. */
export const SUN_DIRECTION = new Vector3(5, 2, 4).normalize()
