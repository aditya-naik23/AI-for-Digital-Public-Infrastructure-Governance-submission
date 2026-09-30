// @ts-nocheck
"use client";
import React, { createContext, useContext, useEffect, useRef, useState, useMemo, Suspense, Component, lazy } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Euler,
  MathUtils,
  Quaternion,
  Vector3,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  SkinnedMesh,
  Bone,
  Texture,
  FrontSide,
  AnimationClip,
  AnimationMixer,
  LoopRepeat,
  NumberKeyframeTrack,
  QuaternionKeyframeTrack,
  VectorKeyframeTrack
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Motion utilities
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const damp = (value, target, lambda, dt) => value + (target - value) * (1 - Math.exp(-lambda * dt));
const smoothstep = (value, min, max) => {
  const t = clamp((value - min) / (max - min), 0, 1);
  return t * t * (3 - 2 * t);
};
const GAIT_DISTANCE = 0.44;

function createMotion() {
  return {
    planetAngle: 0,
    planetVelocity: 0,
    dragTarget: 0,
    characterTarget: 0,
    characterAngle: 0,
    characterVelocity: 0,
    phase: 0,
    activity: 0,
    direction: 1,
    time: 0,
    dragging: false,
    lastInteraction: 0,
    pitchAngle: 0,
    pitchVelocity: 0,
    pitchTarget: 0
  };
}

function stepPlanet(m, dt, auto, reduced, autoRoll = -0.032) {
  m.time += dt;
  if (!auto) {
    m.dragging = false;
    m.planetVelocity = m.pitchVelocity = 0;
    m.dragTarget = m.planetAngle;
    m.pitchTarget = m.pitchAngle;
    return;
  }
  if (m.dragging) {
    const acceleration = 90 * (m.dragTarget - m.planetAngle) - 18 * m.planetVelocity;
    m.planetVelocity += acceleration * dt;
  } else {
    const desired = auto && !reduced && m.time - m.lastInteraction > 3.5 ? autoRoll : 0;
    m.planetVelocity = damp(m.planetVelocity, desired, reduced ? 12 : 5, dt);
  }
  m.planetVelocity = clamp(m.planetVelocity, -1.15, 1.15);
  m.planetAngle += m.planetVelocity * dt;
}

function createGlobeMotion() {
  return { delta: new Quaternion(), orientation: new Quaternion().setFromEuler(new Euler(0.1, 0.5, 0)), angular: new Vector3(), route: 0 };
}

function stepGlobeMotion(globe, m, dt, auto, reduced) {
  const roaming = auto && !reduced && !m.dragging && m.time - m.lastInteraction > 3.5;
  if (roaming) globe.route += 0.24 * dt;
  stepPlanet(m, dt, auto, reduced, -0.24 * Math.cos(globe.route));
  if (!auto) {
    globe.angular.set(0, 0, 0);
    return;
  }
  if (m.dragging) m.pitchVelocity += (70 * (m.pitchTarget - m.pitchAngle) - 17 * m.pitchVelocity) * dt;
  else m.pitchVelocity = MathUtils.damp(m.pitchVelocity, roaming ? 0.24 * Math.sin(globe.route) : 0, 6, dt);
  m.pitchVelocity = MathUtils.clamp(m.pitchVelocity, -0.55, 0.55);
  m.pitchAngle += m.pitchVelocity * dt;
  globe.angular.set(m.pitchVelocity, m.planetVelocity * 0.45, -m.planetVelocity);
  const speed = globe.angular.length();
  if (speed > 1e-8) {
    globe.delta.setFromAxisAngle(globe.angular.multiplyScalar(1 / speed), speed * dt);
    globe.orientation.premultiply(globe.delta).normalize();
  }
}

function createSurfaceMotion() {
  return {
    current: new Vector3(0, 1, 0),
    target: new Vector3(0, 1, 0),
    velocity: new Vector3(),
    error: new Vector3(),
    worldNormal: new Vector3(),
    worldVelocity: new Vector3(),
    inverse: new Quaternion(),
    initialized: false
  };
}

function stepSurface(s, m, rotation, screenUp, dt, reduced, paused = false) {
  s.inverse.copy(rotation).invert();
  s.target.copy(screenUp).applyQuaternion(s.inverse).normalize();
  if (!s.initialized) {
    s.current.copy(s.target);
    s.initialized = true;
  }
  if (paused) {
    s.velocity.set(0, 0, 0);
    s.worldVelocity.set(0, 0, 0);
    s.worldNormal.copy(s.current).applyQuaternion(rotation);
    m.characterVelocity = 0;
    m.activity = MathUtils.damp(m.activity, 0, 10, dt);
    return;
  }
  const cosine = MathUtils.clamp(s.current.dot(s.target), -1, 1);
  const angle = Math.acos(cosine);
  s.error.copy(s.target).addScaledVector(s.current, -cosine);
  if (s.error.lengthSq() > 1e-12) s.error.normalize().multiplyScalar(angle);
  const stiffness = reduced ? 110 : 48, damping = reduced ? 21 : 11;
  s.velocity.addScaledVector(s.error, stiffness * dt).multiplyScalar(Math.exp(-damping * dt));
  s.velocity.addScaledVector(s.current, -s.velocity.dot(s.current));
  s.current.addScaledVector(s.velocity, dt).normalize();
  s.velocity.addScaledVector(s.current, -s.velocity.dot(s.current));
  s.worldNormal.copy(s.current).applyQuaternion(rotation);
  s.worldVelocity.copy(s.velocity).applyQuaternion(rotation);
  const speed = s.velocity.length();
  m.characterTarget = Math.atan2(s.target.x, s.target.y);
  m.characterAngle = Math.atan2(s.current.x, s.current.y);
  if (Math.abs(s.worldVelocity.x) > 0.012) m.direction = Math.sign(s.worldVelocity.x);
  m.characterVelocity = speed * m.direction;
  m.activity = MathUtils.damp(m.activity, MathUtils.smoothstep(speed, 4e-3, 0.022), 9, dt);
  m.phase += speed * 2.25 / GAIT_DISTANCE * Math.PI * 2 * dt;
}

const AssetBaseContext = createContext("");

function disposeScene(scene) {
  const textures = new Set();
  const materials = new Set();
  const geometries = new Set();
  const skeletons = new Set();
  scene.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    geometries.add(node.geometry);
    if (node instanceof SkinnedMesh) skeletons.add(node.skeleton);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof Texture) textures.add(value);
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  skeletons.forEach((skeleton) => skeleton.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => {
    texture.dispose();
    if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) texture.image.close();
  });
}

const defaultSurface = { width: 128, height: 65, radii: new Array(128 * 65).fill(0.9355) };

function usePlanetAsset(onReady) {
  const base = useContext(AssetBaseContext);
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    const abort = new AbortController();
    const draco = new DRACOLoader().setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/").setDecoderConfig({ type: "wasm" }).setWorkerLimit(2);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    let disposed = false;
    let scene;
    const fetchChecked = async (path) => {
      const response = await fetch(path, { signal: abort.signal });
      if (!response.ok) throw new Error(`Planet asset could not load (${response.status})`);
      return response;
    };
    onReady?.(false);
    Promise.all([
      fetchChecked(`${base}models/whimsical-world.glb`).then((response) => response.arrayBuffer()),
      Promise.resolve(defaultSurface)
    ]).then(async ([buffer, surface2]) => {
      if (disposed) return;
      const gltf = await loader.parseAsync(buffer, `${base}models/`);
      scene = gltf.scene;
      if (disposed) {
        disposeScene(scene);
        return;
      }
      scene.traverse((node) => {
        node.updateMatrix();
        node.matrixAutoUpdate = false;
        if (!(node instanceof Mesh)) return;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        for (const mat of materials) if (mat instanceof MeshStandardMaterial) {
          mat.side = FrontSide;
          mat.metalness = 0;
          mat.roughness = 0.86;
          mat.normalScale.setScalar(0.65);
          if (mat.map) mat.map.anisotropy = 4;
        }
      });
      setAsset({ scene, surface: surface2 });
      onReady?.(true);
    }).catch((reason) => {
      if (!disposed) setError(reason instanceof Error ? reason : new Error(String(reason)));
    }).finally(() => {
      if (!disposed) draco.dispose();
    });
    return () => {
      disposed = true;
      abort.abort();
      draco.dispose();
      if (scene) disposeScene(scene);
    };
  }, [onReady, base]);
  if (error) throw error;
  return asset;
}

function surfaceRadius(surface2, x, y, z) {
  const u = (Math.atan2(x, z) / (2 * Math.PI) % 1 + 1) % 1 * surface2.width;
  const v = Math.acos(Math.max(-1, Math.min(1, y))) / Math.PI * (surface2.height - 1);
  const x0 = Math.floor(u), x1 = (x0 + 1) % surface2.width;
  const y0 = Math.floor(v), y1 = Math.min(y0 + 1, surface2.height - 1);
  const tx = u - x0, ty = v - y0;
  const a = surface2.radii[y0 * surface2.width + x0] * (1 - tx) + surface2.radii[y0 * surface2.width + x1] * tx;
  const b = surface2.radii[y1 * surface2.width + x0] * (1 - tx) + surface2.radii[y1 * surface2.width + x1] * tx;
  return a * (1 - ty) + b * ty;
}

function makeSeamlessRun(source) {
  const reference = source.tracks.reduce((best, track) => track.times.length > best.times.length ? track : best);
  const start = reference.times[0];
  const last = reference.times[reference.times.length - 1];
  const intervals = Array.from(reference.times).slice(1).map((time, i) => time - reference.times[i]).sort((a, b) => a - b);
  const step = intervals.length ? intervals[Math.floor(intervals.length / 2)] : 1 / 24;
  const period = Math.max(step, last - start + step);
  const frames = Math.max(40, Math.ceil(period * 120));
  const quaternion = new Quaternion();
  const tracks = source.tracks.map((track) => {
    const count = track.times.length, size = track.getValueSize();
    const knots = Array.from(track.times, (time) => time - start);
    const samples = Array.from(track.values);
    const isRotation = track.name.endsWith(".quaternion");
    const isMorph = track.name.endsWith(".morphTargetInfluences");
    if (isRotation) for (let i = 1; i < count; i++) {
      let dot = 0;
      for (let c = 0; c < 4; c++) dot += samples[(i - 1) * 4 + c] * samples[i * 4 + c];
      if (dot < 0) for (let c = 0; c < 4; c++) samples[i * 4 + c] *= -1;
    }
    const times = [], values = [];
    for (let frame = 0; frame <= frames; frame++) {
      const time = frame === frames ? 0 : frame / frames * period;
      times.push(frame / frames * period);
      let index = 0;
      while (index < count - 1 && knots[index + 1] <= time) index++;
      const previous = (index - 1 + count) % count, next = (index + 1) % count, after = (index + 2) % count;
      const t1 = knots[index], t2 = next === 0 ? period + knots[0] : knots[next];
      const t0 = previous > index ? knots[previous] - period : knots[previous];
      const t3 = after <= next ? knots[after] + period : knots[after];
      const afterTime = t3 <= t2 ? t3 + period : t3;
      const length = Math.max(t2 - t1, 1e-6), u = Math.max(0, Math.min(1, (time - t1) / length));
      for (let c = 0; c < size; c++) {
        const p0 = samples[previous * size + c], p1 = samples[index * size + c], p2 = samples[next * size + c], p3 = samples[after * size + c];
        const a = count < 3 ? 0 : (p2 - p0) / Math.max(t2 - t0, 1e-6) * length;
        const b = count < 3 ? 0 : (p3 - p1) / Math.max(afterTime - t1, 1e-6) * length;
        values.push(count === 1 ? p1 : isMorph ? p1 + (p2 - p1) * u : (2 * u ** 3 - 3 * u ** 2 + 1) * p1 + (u ** 3 - 2 * u ** 2 + u) * a + (-2 * u ** 3 + 3 * u ** 2) * p2 + (u ** 3 - u ** 2) * b);
      }
      if (isRotation) {
        quaternion.fromArray(values, values.length - 4).normalize();
        quaternion.toArray(values, values.length - 4);
      }
    }
    const result = track.clone();
    result.times = new Float32Array(times);
    result.values = new Float32Array(values);
    return result;
  });
  return new AnimationClip("Courier_Run_Seamless", period, tracks);
}

class BagSuspension {
  constructor(scene) {
    this.scene = scene;
    const bone = scene.getObjectByName("CourierBag");
    if (!(bone instanceof Bone)) throw new Error("Courier bag attachment is missing.");
    this.bone = bone;
    scene.updateWorldMatrix(true, true);
    scene.getWorldQuaternion(this.sceneOrientation);
    bone.getWorldQuaternion(this.restOrientation);
    this.restOrientation.premultiply(this.sceneOrientation.invert());
    this.inverseRest.copy(this.restOrientation).invert();
  }
  bone;
  restOrientation = new Quaternion();
  animatedOrientation = new Quaternion();
  animatedPosition = new Vector3();
  localAnchor = new Vector3();
  gravityTilt = new Quaternion();
  pelvisYaw = new Quaternion();
  inverseRest = new Quaternion();
  xAxis = new Vector3(1, 0, 0);
  hangingOrientation = new Quaternion();
  sceneOrientation = new Quaternion();
  parentOrientation = new Quaternion();
  swing = new Quaternion();
  angles = new Euler();
  inverseScene = new Matrix4();
  anchor = new Vector3();
  previousAnchor = new Vector3();
  velocity = new Vector3();
  previousVelocity = new Vector3();
  acceleration = new Vector3();
  initialized = false;
  applied = false;
  pitch = 0;
  roll = 8e-3;
  pitchVelocity = 0;
  rollVelocity = 0;
  restore() {
    if (!this.applied) return;
    this.bone.position.copy(this.animatedPosition);
    this.bone.quaternion.copy(this.animatedOrientation);
    this.applied = false;
  }
  update(dt, activity, _phase, turnRate, reduced, bodyLean = 0) {
    if (dt <= 0 || !this.bone.parent) return;
    this.animatedPosition.copy(this.bone.position);
    this.animatedOrientation.copy(this.bone.quaternion);
    this.inverseScene.copy(this.scene.matrixWorld).invert();
    this.bone.getWorldPosition(this.anchor).applyMatrix4(this.inverseScene);
    if (!this.initialized) {
      this.previousAnchor.copy(this.anchor);
      this.initialized = true;
    }
    this.velocity.copy(this.anchor).sub(this.previousAnchor).divideScalar(dt);
    this.acceleration.copy(this.velocity).sub(this.previousVelocity).divideScalar(dt);
    this.previousVelocity.lerp(this.velocity, 1 - Math.exp(-14 * dt));
    this.previousAnchor.copy(this.anchor);
    const gravity = Math.max(4, 9.81 + this.acceleration.y);
    const targetPitch = reduced ? 0 : MathUtils.clamp(
      Math.atan2(this.acceleration.z, gravity),
      -0.1,
      0.1
    );
    const targetRoll = reduced ? 0 : MathUtils.clamp(
      Math.atan2(-this.acceleration.x, gravity) + Math.abs(turnRate) * 1e-3,
      -0.012,
      0.045
    );
    const steps = Math.ceil(dt / (1 / 120)), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.pitchVelocity += ((targetPitch - this.pitch) * 72 - this.pitchVelocity * 11) * h;
      this.rollVelocity += ((targetRoll - this.roll) * 64 - this.rollVelocity * 10) * h;
      this.pitch = MathUtils.clamp(this.pitch + this.pitchVelocity * h, -0.12, 0.12);
      this.roll = MathUtils.clamp(this.roll + this.rollVelocity * h, -0.012, 0.05);
    }
    this.scene.getWorldQuaternion(this.sceneOrientation);
    this.bone.getWorldQuaternion(this.pelvisYaw).premultiply(this.parentOrientation.copy(this.sceneOrientation).invert()).multiply(this.inverseRest);
    this.pelvisYaw.set(0, this.pelvisYaw.y, 0, this.pelvisYaw.w).normalize();
    this.bone.parent.getWorldQuaternion(this.parentOrientation).invert();
    this.swing.setFromEuler(this.angles.set(this.pitch, 0, this.roll));
    this.gravityTilt.setFromAxisAngle(this.xAxis, -bodyLean);
    this.hangingOrientation.copy(this.parentOrientation).multiply(this.sceneOrientation).multiply(this.gravityTilt).multiply(this.pelvisYaw).multiply(this.swing).multiply(this.restOrientation);
    this.bone.quaternion.copy(this.animatedOrientation).slerp(this.hangingOrientation, 1 - activity * 0.3);
    this.localAnchor.copy(this.anchor).addScaledVector(this.xAxis, -9e-3 * (1 - activity * 0.5));
    this.localAnchor.y -= 0.027;
    this.localAnchor.applyMatrix4(this.scene.matrixWorld);
    this.bone.parent.worldToLocal(this.localAnchor);
    this.bone.position.copy(this.localAnchor);
    this.bone.updateWorldMatrix(false, true);
    this.applied = true;
  }
}

const up_greeting = new Vector3(0, 1, 0);

class CourierGreeting {
  constructor(scene) {
    this.scene = scene;
    scene.updateWorldMatrix(true, true);
    const inverseScene = scene.getWorldQuaternion(new Quaternion()).invert();
    this.joints = ["RightArm", "RightForeArm", "RightHand"].map((name) => {
      const bone = scene.getObjectByName(name);
      if (!(bone instanceof Bone)) throw new Error(`Greeting joint ${name} is missing.`);
      const rest = bone.getWorldQuaternion(new Quaternion()).premultiply(inverseScene);
      const direction = up_greeting.clone().applyQuaternion(rest).normalize();
      const palm = new Vector3(1, 0, 0).addScaledVector(direction, -direction.x).normalize();
      return { bone, rest, direction, palm, animated: bone.quaternion.clone() };
    });
    this.restBendNormal.crossVectors(this.joints[0].direction, this.joints[1].direction).normalize();
  }
  joints;
  sceneRotation = new Quaternion();
  inverseParent = new Quaternion();
  aim = new Quaternion();
  twist = new Quaternion();
  target = new Quaternion();
  direction = new Vector3();
  palm = new Vector3();
  wantedPalm = new Vector3();
  cross = new Vector3();
  restBendNormal = new Vector3();
  bendNormal = new Vector3();
  upperDirection = new Vector3(-0.55, -0.65, 0.52).normalize();
  forearmDirection = new Vector3();
  phase = 0;
  applied = false;
  weight = 0;
  restore() {
    if (!this.applied) return;
    for (const joint of this.joints) joint.bone.quaternion.copy(joint.animated);
    this.applied = false;
  }
  step(dt, ready, reduced) {
    this.weight = MathUtils.damp(this.weight, ready ? 1 : 0, ready ? 4 : 9, dt);
    if (this.weight < 1e-4) {
      this.weight = 0;
      this.phase = 0;
    }
    if (ready && this.weight > 0.85 && !reduced) this.phase += dt * Math.PI * 2 * 0.9;
  }
  apply(reduced) {
    if (this.weight === 0) return;
    this.scene.getWorldQuaternion(this.sceneRotation);
    const wave = Math.sin(this.phase) * (reduced ? 0 : 0.12) * MathUtils.smoothstep(this.weight, 0.85, 0.99);
    this.forearmDirection.set(-0.08 + wave * 0.35, 0.94, 0.33).normalize();
    this.bendNormal.crossVectors(this.upperDirection, this.forearmDirection).normalize();
    this.joints.forEach((joint, index) => {
      joint.animated.copy(joint.bone.quaternion);
      if (index === 0) this.direction.copy(this.upperDirection);
      else if (index === 1) this.direction.copy(this.forearmDirection);
      else this.direction.set(-0.06 + wave, 0.97, 0.22);
      this.direction.normalize();
      this.aim.setFromUnitVectors(joint.direction, this.direction);
      this.target.copy(this.aim).multiply(joint.rest);
      this.palm.copy(this.restBendNormal).addScaledVector(joint.direction, -this.restBendNormal.dot(joint.direction)).normalize().applyQuaternion(this.aim);
      this.wantedPalm.copy(this.bendNormal).addScaledVector(this.direction, -this.bendNormal.dot(this.direction)).normalize();
      const angle = Math.atan2(this.direction.dot(this.cross.crossVectors(this.palm, this.wantedPalm)), this.palm.dot(this.wantedPalm));
      this.twist.setFromAxisAngle(this.direction, angle);
      this.target.premultiply(this.twist);
      joint.bone.parent.getWorldQuaternion(this.inverseParent).invert();
      this.target.premultiply(this.sceneRotation).premultiply(this.inverseParent);
      joint.bone.quaternion.slerp(this.target, this.weight);
      joint.bone.updateWorldMatrix(false, true);
    });
    this.applied = true;
  }
}

function optimizeRigidBag(scene) {
  scene.updateWorldMatrix(true, true);
  const candidates = [];
  scene.traverse((node) => {
    if (node instanceof SkinnedMesh && node.name.startsWith("Delivery_Bag")) candidates.push(node);
  });
  for (const mesh of candidates) {
    if (Object.keys(mesh.geometry.morphAttributes).length) continue;
    const weights = mesh.geometry.getAttribute("skinWeight");
    const indices = mesh.geometry.getAttribute("skinIndex");
    if (!weights || !indices) continue;
    let joint = -1, rigid = true;
    for (let vertex = 0; vertex < weights.count && rigid; vertex++) {
      let total = 0;
      for (let channel = 0; channel < 4; channel++) {
        const weight = weights.getComponent(vertex, channel);
        if (weight < 1e-6) continue;
        const index = indices.getComponent(vertex, channel);
        if (joint < 0) joint = index;
        if (index !== joint) {
          rigid = false;
          break;
        }
        total += weight;
      }
      if (Math.abs(total - 1) > 1e-4) rigid = false;
    }
    if (!rigid || joint < 0) continue;
    const bone = mesh.skeleton.bones[joint];
    const bind = new Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[joint], mesh.bindMatrix);
    const geometry = mesh.geometry.clone().applyMatrix4(bind);
    geometry.deleteAttribute("skinIndex");
    geometry.deleteAttribute("skinWeight");
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const bag = new Mesh(geometry, mesh.material);
    bag.name = mesh.name;
    bag.castShadow = mesh.castShadow;
    bag.receiveShadow = mesh.receiveShadow;
    bag.renderOrder = mesh.renderOrder;
    bag.matrixAutoUpdate = false;
    mesh.removeFromParent();
    bone.add(bag);
    let shared = false;
    scene.traverse((node) => {
      if (node instanceof Mesh && node.geometry === mesh.geometry) shared = true;
    });
    if (!shared) mesh.geometry.dispose();
  }
}

const MODEL_SCALE = 0.76 / 1.7;

function makeIdle(scene) {
  const tracks = [];
  const breath = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 9e-3);
  scene.traverse((node) => {
    if (node instanceof Mesh && node.morphTargetInfluences?.length) {
      const zeros = new Array(node.morphTargetInfluences.length).fill(0);
      tracks.push(new NumberKeyframeTrack(`${node.name}.morphTargetInfluences`, [0, 3], [...zeros, ...zeros]));
    }
    if (!(node instanceof Bone)) return;
    const q = node.quaternion.clone(), middle = q.clone();
    if (node.name === "Spine02" || node.name === "neck") middle.multiply(breath);
    tracks.push(new QuaternionKeyframeTrack(`${node.name}.quaternion`, [0, 1.5, 3], [...q.toArray(), ...middle.toArray(), ...q.toArray()]));
    const p = node.position.clone(), inhale = p.clone();
    if (node.name === "Hips") inhale.y += 4e-3;
    tracks.push(new VectorKeyframeTrack(`${node.name}.position`, [0, 1.5, 3], [...p.toArray(), ...inhale.toArray(), ...p.toArray()]));
    tracks.push(new VectorKeyframeTrack(`${node.name}.scale`, [0, 3], [...node.scale.toArray(), ...node.scale.toArray()]));
  });
  return new AnimationClip("Courier_Idle", 3, tracks);
}

function Courier({ motion, paused, reduced, onReady }) {
  const base = useContext(AssetBaseContext);
  const facing = useRef(null), lean = useRef(null);
  const greetingTurn = useRef(false);
  const turnVelocity = useRef(0);
  const [asset, setAsset] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const abort = new AbortController();
    const draco = new DRACOLoader().setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/").setDecoderConfig({ type: "wasm" }).setWorkerLimit(1);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    let cancelled = false;
    let owned;
    onReady?.(false);
    fetch(`${base}models/courier.glb`, { signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error(`Courier could not load (${response.status})`);
      const data = await response.arrayBuffer();
      if (cancelled) return;
      const gltf = await loader.parseAsync(data, `${base}models/`);
      if (cancelled) {
        disposeScene(gltf.scene);
        return;
      }
      optimizeRigidBag(gltf.scene);
      gltf.scene.traverse((node) => {
        if (!(node instanceof Mesh)) return;
        node.morphTargetInfluences?.fill(0);
        if (node instanceof SkinnedMesh) node.frustumCulled = false;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (material instanceof MeshStandardMaterial) {
            material.metalness = 0;
            material.roughness = 0.9;
            material.roughnessMap = null;
            material.normalScale.setScalar(0.25);
            if (material.map) material.map.anisotropy = 8;
          }
        }
      });
      const clips = gltf.animations.filter((animation) => animation.duration > 0.3);
      if (!clips.length) {
        disposeScene(gltf.scene);
        throw new Error("The courier run animation is missing.");
      }
      const clip = new AnimationClip("Courier_Run_Source", -1, clips.flatMap((animation) => animation.tracks));
      const mixer = new AnimationMixer(gltf.scene);
      const bag = new BagSuspension(gltf.scene);
      const greeting = new CourierGreeting(gltf.scene);
      const idle = mixer.clipAction(makeIdle(gltf.scene)).play();
      const seamless = makeSeamlessRun(clip);
      const run = mixer.clipAction(seamless).setLoop(LoopRepeat, Infinity).play();
      run.zeroSlopeAtStart = false;
      run.zeroSlopeAtEnd = false;
      run.setEffectiveTimeScale(0);
      run.setEffectiveWeight(0);
      mixer.update(0);
      owned = { scene: gltf.scene, mixer, idle, run, duration: seamless.duration, bag, greeting };
      setAsset(owned);
      onReady?.(true);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason : new Error(String(reason)));
    }).finally(() => {
      if (!cancelled) draco.dispose();
    });
    return () => {
      cancelled = true;
      abort.abort();
      draco.dispose();
      if (owned) {
        owned.mixer.stopAllAction();
        owned.mixer.uncacheRoot(owned.scene);
        disposeScene(owned.scene);
      }
    };
  }, [onReady, base]);

  useFrame((_, delta) => {
    if (!asset) return;
    const dt = Math.min(delta, 0.05), m = motion.current;
    if (!paused) greetingTurn.current = false;
    else if (m.activity < 0.06) greetingTurn.current = true;
    const desired = paused ? greetingTurn.current ? m.cameraHeading ?? 0 : facing.current.rotation.y : (m.heading ?? 0) + Math.PI / 2;
    const turn = Math.atan2(Math.sin(desired - facing.current.rotation.y), Math.cos(desired - facing.current.rotation.y));
    if (paused) {
      const acceleration = MathUtils.clamp(18 * turn - 8.5 * turnVelocity.current, -5.5, 5.5);
      turnVelocity.current = MathUtils.clamp(turnVelocity.current + acceleration * dt, -2.2, 2.2);
      if (Math.abs(turn) < 3e-3 && Math.abs(turnVelocity.current) < 0.025) turnVelocity.current = 0;
      facing.current.rotation.y += turnVelocity.current * dt;
    } else {
      const rotation = turn * (1 - Math.exp(-12 * dt));
      facing.current.rotation.y += rotation;
      turnVelocity.current = rotation / dt;
    }
    const turning = paused && greetingTurn.current && !reduced ? MathUtils.smoothstep(Math.abs(turnVelocity.current), 0.08, 1.2) : 0;
    asset.greeting.step(dt, paused && greetingTurn.current && Math.abs(turn) < 0.055 && Math.abs(turnVelocity.current) < 0.13, reduced);
    lean.current.rotation.x = MathUtils.damp(lean.current.rotation.x, Math.min(Math.abs(m.characterVelocity) * 0.065, 0.09) * (reduced ? 0.35 : 1), 9, dt);
    const activity = Math.max(m.activity, turning * 0.3) * (1 - asset.greeting.weight);
    asset.run.setEffectiveWeight(activity);
    asset.idle.setEffectiveWeight(1 - activity);
    asset.idle.paused = reduced;
    const playback = Math.max(Math.abs(m.characterVelocity) * 2.25 / GAIT_DISTANCE * asset.duration, turning * 0.72);
    asset.run.setEffectiveTimeScale(MathUtils.damp(asset.run.timeScale, playback, 10, dt));
    asset.greeting.restore();
    asset.bag.restore();
    asset.mixer.update(dt);
    asset.scene.updateWorldMatrix(true, true);
    asset.greeting.apply(reduced);
    asset.bag.update(dt, activity, m.phase, turnVelocity.current, reduced, lean.current.rotation.x);
  });

  if (error) throw error;
  return <group ref={facing} rotation={[0, Math.PI / 2, 0]}><group ref={lean}><group scale={MODEL_SCALE}>{asset && <primitive object={asset.scene} dispose={null} />}</group></group></group>;
}

const up_prototype = new Vector3(0, 1, 0);

function World_Prototype({ motion, auto, reduced }) {
  const { size, camera } = useThree();
  useEffect(() => {
    camera.zoom = Math.min(size.width / 5.6, size.height / 6.05);
    camera.updateProjectionMatrix();
  }, [size, camera]);
  const planet = useRef(null);
  const runner = useRef(null);
  const left = useRef(null);
  const right = useRef(null);
  const inverse = useRef(new Quaternion());
  const localTop = useRef(new Vector3());
  useFrame(({ camera: camera2 }, delta) => {
    const m = motion.current;
    const elapsed = Math.min(delta, 0.05);
    const count = Math.ceil(elapsed / (1 / 120));
    for (let i = 0; i < count; i++) {
      const dt = elapsed / count;
      stepPlanet(m, dt, auto, reduced);
      planet.current.rotation.z = -m.planetAngle;
      inverse.current.copy(planet.current.quaternion).invert();
      localTop.current.copy(up_prototype).applyQuaternion(camera2.quaternion).applyQuaternion(inverse.current);
      stepRunner(m, dt, Math.atan2(localTop.current.x, localTop.current.y), reduced);
    }
    const angle = m.planetAngle + m.characterAngle;
    runner.current.position.set(Math.sin(angle) * 2.25, Math.cos(angle) * 2.25, 0);
    runner.current.rotation.z = -angle;
    left.current.rotation.z = Math.sin(m.phase) * 0.7 * m.activity;
    right.current.rotation.z = -Math.sin(m.phase) * 0.7 * m.activity;
  });
  return <>
    <group ref={planet}>
      <mesh><sphereGeometry args={[2.25, 48, 32]} /><meshStandardMaterial color="#779eac" roughness={0.7} /></mesh>
      {[0, 1, 2, 3].map((i) => <mesh key={i} position={[Math.sin(i * 1.5) * 1.8, Math.cos(i * 1.5) * 1.8, 1.38]}><sphereGeometry args={[0.1, 8, 8]} /><meshStandardMaterial color="#e4edcf" /></mesh>)}
    </group>
    <group ref={runner}>
      <mesh position={[0, 0.31, 0]}><boxGeometry args={[0.19, 0.26, 0.16]} /><meshStandardMaterial color="#e7763d" /></mesh>
      <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.13, 16, 12]} /><meshStandardMaterial color="#fff5df" /></mesh>
      <group ref={left} position={[-0.06, 0.21, 0]}><mesh position={[0, -0.1, 0]}><boxGeometry args={[0.055, 0.2, 0.06]} /><meshStandardMaterial color="#343f42" /></mesh></group>
      <group ref={right} position={[0.06, 0.21, 0]}><mesh position={[0, -0.1, 0]}><boxGeometry args={[0.055, 0.2, 0.06]} /><meshStandardMaterial color="#343f42" /></mesh></group>
    </group>
  </>;
}

function PlanetScene_Prototype(props) {
  return <Canvas orthographic camera={{ position: [0, 0, 9], zoom: 100, near: 0.1, far: 30 }} dpr={[1, 1.5]} frameloop={props.active ? "always" : "never" } gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={1.4} /><directionalLight position={[-3, 5, 6]} intensity={3} />
    <World_Prototype {...props} />
  </Canvas>;
}

function chooseRenderQuality() {
  if (typeof navigator === "undefined") return "low";
  const device = navigator;
  const mobile = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;
  const limited = (device.hardwareConcurrency || 4) <= 4 || (device.deviceMemory !== undefined && device.deviceMemory <= 4);
  return mobile || limited ? "low" : "high";
}

const renderQuality = chooseRenderQuality();

function AdaptiveResolution({ active }) {
  const setDpr = useThree((state) => state.setDpr);
  const maximum = Math.min((typeof window !== "undefined" ? window.devicePixelRatio : 1) || 1, renderQuality === "low" ? 1.25 : 2);
  const minimum = Math.min(maximum, renderQuality === "low" ? 1 : 1.25);
  const sample = useRef({ warmup: 3, time: 0, frames: 0, goodWindows: 0, dpr: maximum });
  useEffect(() => {
    sample.current.warmup = 3;
    sample.current.time = 0;
    sample.current.frames = 0;
    sample.current.goodWindows = 0;
  }, [active]);
  useFrame((state, delta) => {
    const s = sample.current;
    if (!active || delta <= 0) return;
    if (s.warmup > 0) {
      s.warmup -= Math.min(delta, 0.1);
      return;
    }
    if (delta > 0.12) {
      s.time = 0;
      s.frames = 0;
      return;
    }
    s.time += delta;
    s.frames++;
    if (s.time < 2) return;
    const frameTime = s.time / s.frames;
    s.dpr = state.viewport.dpr;
    let next = s.dpr;
    if (frameTime > 1 / 48) {
      next = Math.max(minimum, s.dpr - 0.25);
      s.goodWindows = 0;
    } else if (frameTime < 1 / 57) {
      if (++s.goodWindows >= 4) {
        next = Math.min(maximum, s.dpr + 0.25);
        s.goodWindows = 0;
      }
    } else s.goodWindows = 0;
    s.time = 0;
    s.frames = 0;
    if (next !== s.dpr) {
      s.dpr = next;
      setDpr(next);
      s.warmup = 1;
    }
  });
  return null;
}

const up_world2 = new Vector3(0, 1, 0);

function ResponsiveCamera() {
  const { size, camera } = useThree();
  useEffect(() => {
    const ortho = camera;
    ortho.zoom = size.width / (size.width < 700 ? 5.65 : 5.25);
    ortho.updateProjectionMatrix();
  }, [size.width, size.height, camera]);
  return null;
}

function World2({ motion, auto, reduced, onReady }) {
  const planet = useRef(null), runner = useRef(null);
  const asset = usePlanetAsset();
  const [courierReady, setCourierReady] = useState(false);
  useEffect(() => {
    onReady?.(!!asset && courierReady);
  }, [asset, courierReady, onReady]);
  const radius = useRef(2.2);
  const surface2 = useRef(createSurfaceMotion());
  const globe = useMemo(createGlobeMotion, []);
  const frame = useMemo(() => ({ screenUp: new Vector3(), localVelocity: new Vector3(), cameraFront: new Vector3(), inverseRunner: new Quaternion() }), []);
  const size = useThree((state) => state.size);
  const small = size.width < 700;
  const zoom = size.width / (small ? 5.65 : 5.25);
  const centerY = size.height / zoom * (small ? 0.08 : 0.19) - 2.17;
  useFrame(({ camera }, delta) => {
    if (!asset || !courierReady) return;
    const m = motion.current;
    const elapsed = Math.min(delta, 0.05), count = Math.ceil(elapsed / (1 / 120));
    frame.screenUp.copy(up_world2).applyQuaternion(camera.quaternion);
    for (let i = 0; i < count; i++) {
      const dt = elapsed / count;
      stepGlobeMotion(globe, m, dt, auto, reduced);
      stepSurface(surface2.current, m, globe.orientation, frame.screenUp, dt, reduced, !auto);
    }
    planet.current.quaternion.copy(globe.orientation);
    const s = surface2.current;
    const r = surfaceRadius(asset.surface, s.current.x, s.current.y, s.current.z) * 2.25;
    radius.current = MathUtils.damp(radius.current, r + 8e-3, 25, elapsed);
    runner.current.position.copy(s.worldNormal).multiplyScalar(radius.current);
    runner.current.quaternion.setFromUnitVectors(up_world2, s.worldNormal);
    frame.inverseRunner.copy(runner.current.quaternion).invert();
    frame.cameraFront.set(0, 0, 1).applyQuaternion(camera.quaternion).applyQuaternion(frame.inverseRunner);
    m.cameraHeading = Math.atan2(frame.cameraFront.x, frame.cameraFront.z);
    if (s.velocity.lengthSq() > 1e-4) {
      frame.localVelocity.copy(s.worldVelocity).applyQuaternion(frame.inverseRunner);
      m.heading = Math.atan2(-frame.localVelocity.z, frame.localVelocity.x);
    }
  }, -1);
  return <group position={[0, centerY, 0]}>
    <group ref={planet} scale={2.25}>{asset && <primitive object={asset.scene} dispose={null} />}</group>
    <group ref={runner} visible={!!asset && courierReady}><Courier motion={motion} paused={!auto} reduced={reduced} onReady={setCourierReady} /></group>
  </group>;
}

function PlanetScene2(props) {
  const lowPower = renderQuality === "low";
  useEffect(() => {
    if (props.prototype) props.onReady?.(true);
  }, [props.prototype, props.onReady]);
  if (props.prototype) return <PlanetScene_Prototype {...props} />;
  return <Canvas orthographic camera={{ position: [0, 0, 9], zoom: 150, near: 0.1, far: 30 }} dpr={lowPower ? [1, 1.25] : [1, 2]} frameloop={props.active ? "always" : "never"} gl={{ antialias: true, alpha: true, powerPreference: lowPower ? "low-power" : "high-performance" }}>
    <ResponsiveCamera />
    <AdaptiveResolution active={props.active} />
    <ambientLight intensity={0.9} /><hemisphereLight args={["#f1f5ff", "#8aabc5", 1.4]} />
    <directionalLight position={[-3, 5, 5]} intensity={2.6} color="#fff8f1" />
    <directionalLight position={[3, 2, -2]} intensity={1.8} color="#c5deff" />
    <World2 {...props} />
  </Canvas>;
}

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error, _info) {
    console.error("3D scene failed:", error);
  }
  render() {
    return this.state.failed ? <div className="scene-fallback"><p>We couldn’t load this little world.</p><button onClick={() => location.reload()}>Try again</button></div> : this.props.children;
  }
}

const stories = {
  "How it works": { title: "From your doorstep to theirs.", paragraphs: ["Every delivery begins with something worth sending. Pack it with care, choose its destination, and let the journey begin.", "Our little courier brings that journey to life. Turn the globe and watch him find his way."] },
  "For business": { title: "Your business. On the move.", paragraphs: ["Orders heading out. Supplies coming in. A thoughtful delivery experience connects both sides of your business.", "Orbit Delivery puts the people behind every parcel at the heart of the journey."] },
  "Our story": { title: "Every parcel brings us closer.", paragraphs: ["A gift for someone far away. An order someone has been waiting for. An everyday essential, right at the door.", "Orbit Delivery is built around a simple idea: what we carry matters, and so does how we get it there."] }
};

function App() {
  const motion = useRef(createMotion());
  const interaction = useRef(null);
  const drag = useRef(null);
  const [visible, setVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [sceneMounted, setSceneMounted] = useState(false);
  const [auto, setAuto] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  const [story, setStory] = useState(null);
  const [prototype, setPrototype] = useState(false);

  useEffect(() => {
    setTabVisible(!document.hidden);
    setPrototype(typeof location !== "undefined" && new URLSearchParams(location.search).has("prototype"));
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(query.matches);
    change();
    query.addEventListener("change", change);
    const onVisibility = () => {
      setTabVisible(!document.hidden);
      if (document.hidden) {
        motion.current.dragging = false;
        drag.current = null;
        setDragging(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
    if (interaction.current) observer.observe(interaction.current);
    return () => {
      query.removeEventListener("change", change);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let frame = 0, timeout = 0;
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        timeout = window.setTimeout(() => setSceneMounted(true), 100);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, []);

  const release = (id) => {
    if (drag.current?.id !== id) return;
    drag.current = null;
    motion.current.dragging = false;
    motion.current.lastInteraction = motion.current.time;
    setDragging(false);
  };

  const toggleMotion = () => {
    const next = !auto;
    setAuto(next);
    const m = motion.current;
    m.dragging = false;
    if (drag.current && interaction.current?.hasPointerCapture(drag.current.id)) interaction.current.releasePointerCapture(drag.current.id);
    drag.current = null;
    setDragging(false);
    m.planetVelocity = m.pitchVelocity = 0;
    m.dragTarget = m.planetAngle;
    m.pitchTarget = m.pitchAngle;
    if (next) m.lastInteraction = m.time - 4;
  };

  const nudge = (direction) => {
    if (!auto) return;
    motion.current.planetVelocity += direction * 0.65;
    motion.current.lastInteraction = motion.current.time;
  };

  const explore = () => {
    interaction.current?.focus({ preventScroll: true });
    if (window.innerWidth < 760) interaction.current?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "center" });
    if (!reduced) nudge(1);
  };

  return (
    <div className={`orbit-saas-page ${prototype ? "prototype" : ""}`}>
      {/* 1. COMPACT HEADER */}
      <header className="saas-header">
        <div className="saas-header-inner">
          <a href="./" className="saas-brand" aria-label="Orbit Delivery Home">
            <svg className="saas-brand-icon" viewBox="0 0 32 32" aria-hidden="true" fill="none">
              <circle cx="16" cy="16" r="14" fill="#2563eb" fillOpacity="0.1" stroke="#2563eb" strokeWidth="2" />
              <circle cx="16" cy="16" r="6" fill="#2563eb" />
              <path d="M7 21C11.5 24 20.5 24 25 11" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="saas-brand-text">
              <span className="saas-brand-title">orbit</span>
              <span className="saas-brand-badge">delivery</span>
            </div>
          </a>

          <nav className="saas-nav" aria-label="Main Navigation">
            <button type="button" className="saas-nav-link" onClick={explore}>Delivery</button>
            {["How it works", "For business", "Our story"].map((item) => (
              <button key={item} type="button" className="saas-nav-link" onClick={() => setStory(item)}>
                {item}
              </button>
            ))}
          </nav>

          <div className="saas-header-actions">
            <button
              type="button"
              className="saas-btn-primary"
              onClick={() => setStory("How it works")}
            >
              Meet your courier
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="saas-main">
        {/* 2. HERO SECTION */}
        <section className="saas-hero" aria-labelledby="hero-title">
          <div className="saas-hero-inner">
            {/* Left Column: Headline, Supporting text, CTAs */}
            <div className="saas-hero-copy">
              <div className="saas-eyebrow">
                <span className="saas-eyebrow-dot" />
                <span>Next-Gen Autonomous Logistics</span>
              </div>

              <h1 id="hero-title" className="saas-h1">
                Good things.<br />
                Delivered <span className="saas-h1-accent">with care.</span>
              </h1>

              <p className="saas-hero-desc">
                Parcels, packages, and genuine peace of mind. We pair continuous 3D spatial navigation with an attentive ground fleet to ensure every delivery arrives intact, predictable, and right on time.
              </p>

              <div className="saas-hero-actions">
                <button
                  type="button"
                  className="saas-btn-primary saas-btn-lg"
                  onClick={() => setStory("How it works")}
                >
                  <span>Meet your courier</span>
                  <Arrow />
                </button>
                <button
                  type="button"
                  className="saas-btn-secondary saas-btn-lg"
                  onClick={explore}
                >
                  Explore orbit network
                </button>
              </div>

              {/* Restrained Key Highlights */}
              <div className="saas-hero-stats">
                <div className="saas-stat-item">
                  <span className="saas-stat-val">99.98%</span>
                  <span className="saas-stat-label">On-time predictability</span>
                </div>
                <div className="saas-stat-item">
                  <span className="saas-stat-val">14 min</span>
                  <span className="saas-stat-label">Avg neighborhood transit</span>
                </div>
                <div className="saas-stat-item">
                  <span className="saas-stat-val">Zero</span>
                  <span className="saas-stat-label">Net carbon emissions</span>
                </div>
              </div>
            </div>

            {/* Right Column: Controlled 3D Hero Visual */}
            <div className="saas-hero-visual">
              <div className="saas-visual-card">
                <div className="saas-card-header">
                  <div className="saas-card-status">
                    <span className="saas-status-dot" />
                    <span>Live Telemetry • Orbit 01</span>
                  </div>
                  <span className="saas-card-tag">120 Hz Spatial</span>
                </div>

                <div
                  ref={interaction}
                  id="planet"
                  className={`saas-planet-canvas ${dragging ? "dragging" : ""}`}
                  tabIndex={0}
                  role="group"
                  aria-roledescription="interactive 3D planet"
                  aria-label="Rotate the planet"
                  aria-describedby="planet-instructions"
                  onPointerDown={(event) => {
                    if (!auto || !event.isPrimary || event.button !== 0) return;
                    event.currentTarget.setPointerCapture(event.pointerId);
                    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
                    const m = motion.current;
                    m.dragTarget = m.planetAngle;
                    m.pitchTarget = m.pitchAngle;
                    m.dragging = true;
                    m.lastInteraction = m.time;
                    setDragging(true);
                  }}
                  onPointerMove={(event) => {
                    if (!auto || drag.current?.id !== event.pointerId) return;
                    const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
                    const sensitivity = 5 / Math.max(360, event.currentTarget.clientWidth);
                    const m = motion.current;
                    m.dragTarget = Math.max(m.planetAngle - 0.5, Math.min(m.planetAngle + 0.5, m.dragTarget + dx * sensitivity));
                    m.pitchTarget = Math.max(m.pitchAngle - 0.4, Math.min(m.pitchAngle + 0.4, m.pitchTarget + dy * sensitivity * 0.7));
                    drag.current.x = event.clientX;
                    drag.current.y = event.clientY;
                    m.lastInteraction = m.time;
                  }}
                  onPointerUp={(event) => release(event.pointerId)}
                  onPointerCancel={(event) => release(event.pointerId)}
                  onLostPointerCapture={(event) => release(event.pointerId)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                      event.preventDefault();
                      nudge(event.key === "ArrowRight" ? 1 : -1);
                    }
                    if (auto && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
                      event.preventDefault();
                      motion.current.pitchVelocity += event.key === "ArrowDown" ? 0.4 : -0.4;
                      motion.current.lastInteraction = motion.current.time;
                    }
                    if (event.key === " ") {
                      event.preventDefault();
                      if (!event.repeat) toggleMotion();
                    }
                  }}
                >
                  {sceneMounted && (
                    <SceneBoundary>
                      <Suspense fallback={null}>
                        <PlanetScene2
                          motion={motion}
                          active={visible && tabVisible && !story}
                          auto={auto}
                          reduced={reduced}
                          prototype={prototype}
                          onReady={setReady}
                        />
                      </Suspense>
                    </SceneBoundary>
                  )}
                  {!ready && (
                    <div className="saas-loading" role="status">
                      <span className="saas-spinner" />
                      <span>Initializing spatial orbit…</span>
                    </div>
                  )}
                </div>

                <div className="saas-card-footer">
                  <div className="saas-card-hint">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="saas-hint-icon">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
                      <path d="M8 5v6m-3-3h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <span>{dragging ? "Rotating trajectory…" : "Click & drag to explore world"}</span>
                  </div>

                  <button
                    type="button"
                    className="saas-motion-toggle"
                    onClick={toggleMotion}
                    aria-pressed={!auto}
                    aria-label={auto ? "Pause planet rotation" : "Resume planet rotation"}
                  >
                    {auto ? (
                      <svg viewBox="0 0 16 16" fill="currentColor" className="saas-toggle-icon">
                        <rect x="4" y="3" width="2.5" height="10" rx="1" />
                        <rect x="9.5" y="3" width="2.5" height="10" rx="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 16 16" fill="currentColor" className="saas-toggle-icon">
                        <path d="M4.5 3.5v9l8-4.5-8-4.5z" />
                      </svg>
                    )}
                    <span>{auto ? "Pause" : "Resume"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <p id="planet-instructions" className="sr-only">
            Drag in any direction, or use arrow keys, to rotate the 3D planet. Press Space to pause the courier.
          </p>
        </section>

        {/* 3. SUPPORTING CONTENT (Cards & Capabilities) */}
        <section className="saas-features-section" aria-labelledby="features-title">
          <div className="saas-section-container">
            <div className="saas-section-header">
              <span className="saas-section-tag">System Capabilities</span>
              <h2 id="features-title" className="saas-section-title">
                Engineered for predictable, transparent logistics
              </h2>
              <p className="saas-section-desc">
                A purpose-built infrastructure connecting shippers and receivers with continuous spatial routing, isolated cargo protection, and live telemetry.
              </p>
            </div>

            <div className="saas-cards-grid">
              {/* Feature Card 1 */}
              <div className="saas-card">
                <div>
                  <div className="saas-card-index">01 / ROUTING</div>
                  <h3 className="saas-card-title">Adaptive Orbital Navigation</h3>
                  <p className="saas-card-body">
                    Dynamic pathing continuously recalculates optimal delivery corridors in real time, actively bypassing congested choke points and inclement local conditions.
                  </p>
                </div>
                <div className="saas-card-meta">
                  <span>Routing reliability</span>
                  <strong className="saas-meta-accent">99.98% verified</strong>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="saas-card">
                <div>
                  <div className="saas-card-index">02 / CARGO CARE</div>
                  <h3 className="saas-card-title">Inertia-Damped Cargo Enclosure</h3>
                  <p className="saas-card-body">
                    Specialized mechanical dampeners cradle fragile biopharma, high-value electronics, and delicate consignments against rotational and terrain shocks.
                  </p>
                </div>
                <div className="saas-card-meta">
                  <span>Damage incident rate</span>
                  <strong className="saas-meta-accent">&lt; 0.01% fleetwide</strong>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="saas-card">
                <div>
                  <div className="saas-card-index">03 / TELEMETRY</div>
                  <h3 className="saas-card-title">Cryptographic Custody Handshake</h3>
                  <p className="saas-card-body">
                    Every handoff checkpoint produces a signed cryptographic record with timestamped telemetry, giving both dispatchers and recipients verifiable truth.
                  </p>
                </div>
                <div className="saas-card-meta">
                  <span>Audit verification</span>
                  <strong className="saas-meta-accent">SHA-256 Ledger</strong>
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="saas-workflow-block">
              <h3 className="saas-workflow-title">Dispatch lifecycle in four simple phases</h3>
              <div className="saas-workflow-grid">
                <div className="saas-step">
                  <span className="saas-step-num">Step 1</span>
                  <h4 className="saas-step-name">Intake & Induction</h4>
                  <p className="saas-step-desc">Instant manifest assignment and sensor calibration at the departure node.</p>
                </div>
                <div className="saas-step">
                  <span className="saas-step-num">Step 2</span>
                  <h4 className="saas-step-name">Geodesic Pathing</h4>
                  <p className="saas-step-desc">Optimal transit vector computed with real-time velocity and weather balancing.</p>
                </div>
                <div className="saas-step">
                  <span className="saas-step-num">Step 3</span>
                  <h4 className="saas-step-name">Autonomous Transit</h4>
                  <p className="saas-step-desc">Attentive courier traversal with uninterrupted 120 Hz spatial positioning.</p>
                </div>
                <div className="saas-step">
                  <span className="saas-step-num">Step 4</span>
                  <h4 className="saas-step-name">Doorstep Signoff</h4>
                  <p className="saas-step-desc">Contactless receipt confirmation with immediate status broadcast.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 4. CLEAN, MINIMAL FOOTER */}
      <footer className="saas-footer">
        <div className="saas-footer-container">
          <div className="saas-footer-top">
            <div className="saas-footer-brand">
              <div className="saas-brand-text">
                <span className="saas-brand-title">orbit</span>
                <span className="saas-brand-badge">delivery</span>
              </div>
              <p className="saas-footer-motto">
                Sovereign public-grade autonomous parcel logistics for modern commerce.
              </p>
            </div>

            <div className="saas-footer-links">
              <button type="button" className="saas-footer-link" onClick={() => setStory("How it works")}>
                How it works
              </button>
              <button type="button" className="saas-footer-link" onClick={() => setStory("For business")}>
                For business
              </button>
              <button type="button" className="saas-footer-link" onClick={() => setStory("Our story")}>
                Our story
              </button>
              <a href="#planet" className="saas-footer-link" onClick={explore}>
                Interactive 3D
              </a>
            </div>
          </div>

          <div className="saas-footer-bottom">
            <div className="saas-footer-copy">
              © {new Date().getFullYear()} Orbit Delivery Inc. All rights reserved.
            </div>
            <div className="saas-footer-controls">
              <span className="saas-footer-tip">Keyboard: Space (Pause) • Left/Right (Rotate)</span>
            </div>
          </div>
        </div>
      </footer>

      {story && <StoryDialog story={story} onClose={() => setStory(null)} />}
    </div>
  );
}

function StoryDialog({ story, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const node = dialog.current;
    node?.showModal();
    return () => node?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="saas-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="saas-dialog-content">
        <button type="button" className="saas-dialog-close" aria-label="Close dialog" onClick={onClose}>
          ✕
        </button>
        <span className="saas-dialog-eyebrow">{story}</span>
        <h2 className="saas-dialog-title">{stories[story].title}</h2>
        <div className="saas-dialog-body">
          {stories[story].paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <div className="saas-dialog-footer">
          <button type="button" className="saas-btn-primary" onClick={onClose}>
            <span>Continue exploring</span>
            <Arrow />
          </button>
        </div>
      </div>
    </dialog>
  );
}

const css = `
/* Modern, Clean, Minimal SaaS Theme for Orbit Delivery */
.orbit-delivery {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #0f172a;
  background-color: #f8fafc;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
  margin: 0;
  padding: 0;
}

.orbit-delivery * {
  box-sizing: border-box;
}

.orbit-delivery button,
.orbit-delivery a {
  font: inherit;
  color: inherit;
  cursor: pointer;
  border: 0;
  background: none;
  text-decoration: none;
  transition: all 0.15s ease-in-out;
}

.orbit-delivery button:focus-visible,
.orbit-delivery a:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.orbit-saas-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

/* 1. COMPACT HEADER */
.saas-header {
  height: 64px;
  background-color: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 40;
}

.saas-header-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.saas-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.saas-brand-icon {
  width: 28px;
  height: 28px;
}

.saas-brand-text {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.saas-brand-title {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.saas-brand-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 1px 6px;
  border-radius: 4px;
}

.saas-nav {
  display: flex;
  align-items: center;
  gap: 32px;
}

@media (max-width: 768px) {
  .saas-nav {
    display: none;
  }
}

.saas-nav-link {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  padding: 6px 0;
}

.saas-nav-link:hover {
  color: #0f172a;
}

.saas-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff !important;
  background-color: #2563eb;
  padding: 8px 18px;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.saas-btn-primary:hover {
  background-color: #1d4ed8;
}

.saas-btn-primary:active {
  background-color: #1e40af;
}

.saas-btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #334155 !important;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 8px 18px;
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.saas-btn-secondary:hover {
  background-color: #f8fafc;
  color: #0f172a !important;
  border-color: #94a3b8;
}

.saas-btn-lg {
  padding: 11px 22px;
  font-size: 15px;
}

/* 2. HERO SECTION */
.saas-main {
  flex: 1;
}

.saas-hero {
  padding: 64px 24px 80px;
  max-width: 1280px;
  margin: 0 auto;
}

.saas-hero-inner {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 64px;
  align-items: center;
}

@media (max-width: 960px) {
  .saas-hero {
    padding: 40px 20px 60px;
  }
  .saas-hero-inner {
    grid-template-columns: 1fr;
    gap: 48px;
  }
}

.saas-hero-copy {
  display: flex;
  flex-direction: column;
}

.saas-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2563eb;
  margin-bottom: 16px;
}

.saas-eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #2563eb;
}

.saas-h1 {
  font-size: 52px;
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.12;
  color: #0f172a;
  margin: 0 0 20px;
}

@media (max-width: 640px) {
  .saas-h1 {
    font-size: 38px;
  }
}

.saas-h1-accent {
  color: #2563eb;
}

.saas-hero-desc {
  font-size: 17px;
  line-height: 1.6;
  color: #64748b;
  margin: 0 0 32px;
  max-width: 520px;
}

.saas-hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  margin-bottom: 40px;
}

.saas-hero-actions svg {
  width: 16px;
  height: 16px;
}

.saas-hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding-top: 32px;
  border-top: 1px solid #e2e8f0;
}

@media (max-width: 540px) {
  .saas-hero-stats {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.saas-stat-item {
  display: flex;
  flex-direction: column;
}

.saas-stat-val {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.saas-stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* Controlled 3D Hero Visual */
.saas-hero-visual {
  display: flex;
  justify-content: center;
}

.saas-visual-card {
  width: 100%;
  max-width: 480px;
  height: 480px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

@media (max-width: 640px) {
  .saas-visual-card {
    height: 380px;
  }
}

.saas-card-header {
  padding: 12px 16px;
  background-color: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.saas-card-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.saas-status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
}

.saas-card-tag {
  font-size: 11px;
  color: #94a3b8;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.saas-planet-canvas {
  flex: 1;
  width: 100%;
  height: 100%;
  position: relative;
  touch-action: none;
  user-select: none;
  outline: none;
  cursor: grab;
  background: radial-gradient(circle at 50% 50%, #ffffff 0%, #f8fafc 100%);
}

.saas-planet-canvas.dragging {
  cursor: grabbing;
}

.saas-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 13px;
  color: #64748b;
  background-color: rgba(255, 255, 255, 0.85);
  z-index: 5;
}

.saas-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: saas-spin 0.8s linear infinite;
}

@keyframes saas-spin {
  to { transform: rotate(360deg); }
}

.saas-card-footer {
  padding: 10px 16px;
  background-color: #fafbfc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}

.saas-card-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.saas-hint-icon {
  width: 14px;
  height: 14px;
  color: #2563eb;
}

.saas-motion-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #475569;
  background-color: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 4px 10px;
  border-radius: 6px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.saas-motion-toggle:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.saas-toggle-icon {
  width: 12px;
  height: 12px;
}

/* 3. SUPPORTING CONTENT */
.saas-features-section {
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 96px 24px;
}

@media (max-width: 640px) {
  .saas-features-section {
    padding: 64px 20px;
  }
}

.saas-section-container {
  max-width: 1280px;
  margin: 0 auto;
}

.saas-section-header {
  max-width: 640px;
  margin-bottom: 48px;
}

.saas-section-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2563eb;
  margin-bottom: 12px;
}

.saas-section-title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: #0f172a;
  line-height: 1.25;
  margin: 0 0 16px;
}

.saas-section-desc {
  font-size: 16px;
  line-height: 1.6;
  color: #64748b;
  margin: 0;
}

.saas-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

@media (max-width: 880px) {
  .saas-cards-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.saas-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.saas-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
}

.saas-card-index {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: #2563eb;
  background-color: #eff6ff;
  border: 1px solid #dbeafe;
  padding: 2px 8px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.saas-card-title {
  font-size: 18px;
  font-weight: 650;
  color: #0f172a;
  margin: 0 0 12px;
  letter-spacing: -0.015em;
}

.saas-card-body {
  font-size: 14px;
  line-height: 1.65;
  color: #64748b;
  margin: 0 0 24px;
}

.saas-card-meta {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}

.saas-meta-accent {
  font-weight: 600;
  color: #0f172a;
}

/* Workflow Block */
.saas-workflow-block {
  margin-top: 64px;
  padding-top: 48px;
  border-top: 1px solid #f1f5f9;
}

.saas-workflow-title {
  font-size: 18px;
  font-weight: 650;
  color: #0f172a;
  margin: 0 0 32px;
}

.saas-workflow-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

@media (max-width: 880px) {
  .saas-workflow-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 540px) {
  .saas-workflow-grid {
    grid-template-columns: 1fr;
  }
}

.saas-step {
  display: flex;
  flex-direction: column;
}

.saas-step-num {
  font-size: 12px;
  font-weight: 600;
  color: #2563eb;
  margin-bottom: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.saas-step-name {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 6px;
}

.saas-step-desc {
  font-size: 13px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}

/* 4. FOOTER */
.saas-footer {
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
  padding: 48px 24px;
}

.saas-footer-container {
  max-width: 1280px;
  margin: 0 auto;
}

.saas-footer-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 32px;
}

@media (max-width: 640px) {
  .saas-footer-top {
    flex-direction: column;
  }
}

.saas-footer-brand {
  max-width: 320px;
}

.saas-footer-motto {
  font-size: 13px;
  color: #64748b;
  margin-top: 8px;
  line-height: 1.5;
}

.saas-footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}

.saas-footer-link {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.saas-footer-link:hover {
  color: #0f172a;
}

.saas-footer-bottom {
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  gap: 16px;
  flex-wrap: wrap;
}

.saas-footer-tip {
  color: #94a3b8;
}

/* Story Dialog */
.saas-dialog {
  border: 0;
  padding: 0;
  background: transparent;
  max-width: 520px;
  width: calc(100% - 32px);
  margin: auto;
}

.saas-dialog::backdrop {
  background-color: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
}

.saas-dialog-content {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  padding: 32px;
  position: relative;
}

.saas-dialog-close {
  position: absolute;
  top: 18px;
  right: 18px;
  font-size: 16px;
  color: #94a3b8;
  padding: 4px;
}

.saas-dialog-close:hover {
  color: #0f172a;
}

.saas-dialog-eyebrow {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #2563eb;
  margin-bottom: 8px;
}

.saas-dialog-title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  margin: 0 0 16px;
}

.saas-dialog-body {
  font-size: 14px;
  line-height: 1.65;
  color: #64748b;
  margin-bottom: 24px;
}

.saas-dialog-body p {
  margin: 0 0 12px;
}

.saas-dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
`;

export function OrbitDeliveryHero({ theme = "auto", assetBaseUrl = "https://cdn.jsdelivr.net/gh/fadeichev2121/planet@b3f70fbf4b577845b1d9d5947c9410fb4d925dae" }) {
  return (
    <AssetBaseContext.Provider value={assetBaseUrl.replace(/\/$/, "") + "/"}>
      <div className="orbit-delivery" data-theme={theme}>
        <style>{css}</style>
        <App />
      </div>
    </AssetBaseContext.Provider>
  );
}

export default OrbitDeliveryHero;

