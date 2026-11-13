import { useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Vector2 } from 'three'
import type { Mesh } from 'three'
import { SUN_DIRECTION } from '../lib/sun'
import { Atmosphere } from './Atmosphere'

// Resolved against Vite's base so the textures also load from a sub-path deploy.
const texture = (file: string) => `${import.meta.env.BASE_URL}textures/${file}`

const TEXTURES = {
  day: texture('earth_atmos_2048.jpg'),
  normal: texture('earth_normal_2048.jpg'),
  specular: texture('earth_specular_2048.jpg'),
  lights: texture('earth_lights_2048.png'),
  clouds: texture('earth_clouds_1024.png'),
}

const NORMAL_SCALE = new Vector2(0.85, -0.85)

const lightsVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lightsFragmentShader = /* glsl */ `
  uniform sampler2D lightsMap;
  uniform vec3 sunDirection;
  varying vec2 vUv;
  varying vec3 vNormalW;

  void main() {
    // Fade city lights in across the terminator, only on the night side.
    // The map is sampled as-is (display-referred), so no output conversion.
    float night = smoothstep(0.1, -0.3, dot(normalize(vNormalW), sunDirection));
    vec3 lights = texture2D(lightsMap, vUv).rgb * vec3(1.0, 0.82, 0.55);
    gl_FragColor = vec4(lights * night * 1.6, 1.0);
  }
`

/** Unit-radius Earth: day map, relief, ocean glint, city lights, clouds and halo. */
export function Earth() {
  const clouds = useRef<Mesh>(null)
  const maps = useTexture(TEXTURES)

  const lightsUniforms = useMemo(
    () => ({
      lightsMap: { value: maps.lights },
      sunDirection: { value: SUN_DIRECTION },
    }),
    [maps.lights],
  )

  useFrame((_, delta) => {
    if (clouds.current) clouds.current.rotation.y += delta * 0.006
  })

  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 96, 96]} />
        <meshPhongMaterial
          map={maps.day}
          normalMap={maps.normal}
          normalScale={NORMAL_SCALE}
          specularMap={maps.specular}
          specular="#3a4a5c"
          shininess={18}
        />
      </mesh>

      <mesh scale={1.002}>
        <sphereGeometry args={[1, 96, 96]} />
        <shaderMaterial
          vertexShader={lightsVertexShader}
          fragmentShader={lightsFragmentShader}
          uniforms={lightsUniforms}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
        />
      </mesh>

      <mesh ref={clouds} scale={1.012}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshLambertMaterial map={maps.clouds} transparent opacity={0.85} depthWrite={false} />
      </mesh>

      <Atmosphere />
    </group>
  )
}

useTexture.preload(Object.values(TEXTURES))
