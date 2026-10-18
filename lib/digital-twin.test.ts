import assert from "node:assert/strict";
import test from "node:test";
import { PerspectiveCamera, Vector3 } from "three";
import {
  adjustCameraForKey,
  MOTOR_COMPONENTS,
  MOTOR_SCENE_LIGHTING,
  getViewerMode,
} from "./digital-twin.ts";

test("the local motor illustration exposes a unique, inspectable component list", () => {
  assert.equal(MOTOR_COMPONENTS.length, 7);
  assert.equal(
    new Set(MOTOR_COMPONENTS.map(({ id }) => id)).size,
    MOTOR_COMPONENTS.length,
  );
  assert.ok(MOTOR_COMPONENTS.some(({ id }) => id === "terminal-box"));
});

test("the digital twin selects a text fallback when WebGL 2 is unavailable", () => {
  assert.equal(getViewerMode(true), "interactive");
  assert.equal(getViewerMode(false), "fallback");
});

test("the procedural motor uses the requested balanced lighting intensities", () => {
  assert.deepEqual(MOTOR_SCENE_LIGHTING, {
    ambient: 0.8,
    hemisphere: 0.6,
    key: 2,
    rim: 1.2,
    fill: 0.8,
  });
});

test("keyboard camera controls orbit and zoom the motor without accepting other keys", () => {
  const camera = new PerspectiveCamera();
  const target = new Vector3(0, 0, 0);
  camera.position.set(4.9, 3.2, 6.3);
  const initialPosition = camera.position.clone();
  const initialDistance = camera.position.distanceTo(target);

  assert.equal(adjustCameraForKey(camera, target, "ArrowLeft"), true);
  assert.notDeepEqual(camera.position.toArray(), initialPosition.toArray());
  assert.equal(adjustCameraForKey(camera, target, "+"), true);
  assert.ok(camera.position.distanceTo(target) < initialDistance);
  assert.equal(adjustCameraForKey(camera, target, "Enter"), false);
});
