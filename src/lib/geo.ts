import { Vector3 } from 'three'

const DEG = Math.PI / 180

/**
 * Latitude/longitude (degrees) to a point on a sphere, matching the UV layout of
 * three's SphereGeometry so markers line up with the equirectangular Earth map.
 */
export function latLonToVector3(lat: number, lon: number, radius = 1, target = new Vector3()) {
  const phi = (90 - lat) * DEG
  const theta = (lon + 180) * DEG
  return target.set(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}
