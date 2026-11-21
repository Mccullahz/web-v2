// The POS screen's glass: a thin layer over the screen that reflects the room (Fresnel: ~4%
// head-on, much more at grazing angles), softened a little like a glossy panel, plus a soft
// glare band that slides across as the viewing angle changes. Added on top of the screen's
// own light, the way a real display looks.
//
// The reflection is a cube map of the room captured once from the screen's position. The
// room is baked, so one capture stays right; the tablet only turns in place.
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BEAM_LAYER } from "./Room";

const GLASS = {
  reflect: 1.0, // × Fresnel
  glare: 0.09,
  lift: 0.0006, // metres in front of the screen
  envSize: 256,
};

const GLASS_SHADER = {
  uniforms: {
    uEnv: { value: null as THREE.Texture | null },
    uReflect: { value: GLASS.reflect },
    uGlare: { value: GLASS.glare },
  },
  vertexShader: /* glsl */ `
    varying vec3 vW;
    varying vec3 vN;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec4 w = modelMatrix * vec4(position, 1.0);
      vW = w.xyz;
      vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * w;
    }`,
  fragmentShader: /* glsl */ `
    uniform samplerCube uEnv;
    uniform float uReflect;
    uniform float uGlare;
    varying vec3 vW;
    varying vec3 vN;
    varying vec2 vUv;
    void main() {
      vec3 V = normalize(cameraPosition - vW);
      vec3 N = normalize(vN);
      if (dot(N, V) < 0.0) N = -N;
      float c = clamp(dot(N, V), 0.0, 1.0);
      float F = 0.04 + 0.96 * pow(1.0 - c, 5.0);              // Schlick, glass
      vec3 env = textureCube(uEnv, reflect(-V, N), 1.5).rgb;   // a touch soft, like a glossy panel
      // glare: a soft diagonal sheen; where it sits depends on where you look from
      vec3 up = normalize(vec3(0.0, 1.0, 0.0) - N * N.y);
      vec3 across = normalize(cross(up, N));
      float shift = dot(V, across) * 0.9 + dot(V, up) * 0.6;
      float d = (vUv.x * 0.75 + vUv.y * 0.55) - 0.62 + shift * 0.55;
      float band = exp(-d * d / 0.003) * 0.7 + exp(-d * d / 0.04) * 0.3;
      vec3 col = env * F * uReflect + vec3(1.0, 0.94, 0.88) * band * uGlare * (0.5 + 0.5 * (1.0 - c));
      gl_FragColor = vec4(col, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};

export function ScreenGlass() {
  const { scene, gl } = useThree();
  const target = useMemo(
    () =>
      new THREE.WebGLCubeRenderTarget(GLASS.envSize, {
        type: THREE.HalfFloatType,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
      }),
    [],
  );
  const cubeCam = useMemo(() => {
    const c = new THREE.CubeCamera(0.02, 30, target);
    c.layers.enable(BEAM_LAYER);
    return c;
  }, [target]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...GLASS_SHADER,
        uniforms: { ...THREE.UniformsUtils.clone(GLASS_SHADER.uniforms), uEnv: { value: target.texture } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [target],
  );
  const glass = useRef<THREE.Mesh | null>(null);
  const frames = useRef(0);

  useEffect(
    () => () => {
      glass.current?.removeFromParent();
      material.dispose();
      target.dispose();
    },
    [material, target],
  );

  useFrame(() => {
    if (glass.current && frames.current > 30) return;
    const screen = scene.getObjectByName("pos_screen") as THREE.Mesh | undefined;
    if (!screen?.isMesh) return;
    if (!glass.current) {
      const n = new THREE.Vector3().fromBufferAttribute(screen.geometry.getAttribute("normal"), 0);
      const m = new THREE.Mesh(screen.geometry, material);
      m.name = "pos_screen_glass";
      m.position.copy(n).multiplyScalar(GLASS.lift);
      m.renderOrder = 2;
      screen.add(m);
      glass.current = m;
    }
    // capture the room once everything has settled in: from just in front of the screen,
    // with the screen (and its glass) out of the shot
    if (++frames.current === 30) {
      screen.updateWorldMatrix(true, false);
      const n = new THREE.Vector3()
        .fromBufferAttribute(screen.geometry.getAttribute("normal"), 0)
        .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(screen.matrixWorld))
        .normalize();
      screen.geometry.computeBoundingBox();
      const centre = screen.geometry.boundingBox!.getCenter(new THREE.Vector3()).applyMatrix4(screen.matrixWorld);
      cubeCam.position.copy(centre).addScaledVector(n, 0.04);
      screen.visible = false;
      cubeCam.update(gl, scene);
      screen.visible = true;
    }
  });

  return null;
}
