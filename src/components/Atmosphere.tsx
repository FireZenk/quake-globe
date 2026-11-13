import { AdditiveBlending, BackSide, Color } from 'three'
import { SUN_DIRECTION } from '../lib/sun'

const vertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vPositionW = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 glowColor;
  uniform vec3 sunDirection;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    // Back faces: the rim is where the normal is perpendicular to the view.
    float rim = pow(clamp(1.0 + dot(viewDir, vNormalW), 0.0, 1.0), 4.5);
    // Brighter on the lit limb, a faint halo on the night side.
    float lit = smoothstep(-0.6, 0.6, dot(vNormalW, sunDirection));
    gl_FragColor = vec4(glowColor, rim * mix(0.12, 1.0, lit));
  }
`

const uniforms = {
  glowColor: { value: new Color('#4da3ff') },
  sunDirection: { value: SUN_DIRECTION },
}

/** Soft fresnel halo rendered on the inside of a slightly larger sphere. */
export function Atmosphere() {
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={BackSide}
        blending={AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  )
}
