import { arcadeAudio } from './arcade-audio.js';
import { useEffect, useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { cabinetButtons, cabinetKeyActions, cabinetKeyDirections, joystickDirection } from './cabinet-input.js';

export default function CabinetControls({ scene, input, keyboardDocument }) {
  const invalidate = useThree(state => state.invalidate);
  const controls = useMemo(() => [
    ...cabinetButtons,
    { node: 'Cylinder005', joystick: true, label: 'Joystick: drag to move' },
  ].map(control => {
    const mesh = scene.getObjectByName(control.node);
    const pressMesh = mesh.getObjectByName(control.node + 'Cap') || mesh;
    const anchor = mesh.position.clone().add(new Vector3(0, control.joystick ? 0.225 : 0.025, 0).applyEuler(mesh.rotation));
    return { ...control, mesh, pressMesh, anchor, position: mesh.position.clone(), pressPosition: pressMesh.position.clone(), rotation: mesh.rotation.clone(), screen: new Vector3() };
  }), [scene]);
  const elements = useRef(new Map());
  const pointers = useRef(new Map());
  const heldKeys = useRef(new Set());
  const keyboardDirections = useRef(new Map());
  const keyboardActions = useRef(new Map());
  const reducedMotion = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)'), []);

  useEffect(() => {
    const reset = () => {
      input.reset();
      pointers.current.clear();
      heldKeys.current.clear();
      keyboardDirections.current.clear();
      keyboardActions.current.clear();
      for (const control of controls) {
        control.mesh.position.copy(control.position);
        control.pressMesh.position.copy(control.pressPosition);
        control.mesh.rotation.copy(control.rotation);
        elements.current.get(control.node)?.removeAttribute('data-pressed');
        elements.current.get(control.node)?.removeAttribute('data-direction');
      }
      invalidate();
    };
    const hide = () => { if (document.hidden) reset(); };
    // Focusing the iframe is still focus inside this page, including during capture.
    const blur = () => { if (!document.hasFocus()) reset(); };
    const keydown = event => {
      if (event.target.closest?.('.cabinet-control') && [' ', 'Enter'].includes(event.key) && !(input.setButton && event.key === 'Enter')) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const source = event.code || key;
      const direction = cabinetKeyDirections[key];
      const mappedAction = cabinetKeyActions[key] || (input.setButton && { Enter: 'start', Shift: 'select', p: 'pause', Escape: 'pause' }[key]);
      const action = controls.filter(control => control.action && (control.action === mappedAction ||
        (mappedAction === 'start' && control.action === 'menu') ||
        (mappedAction === 'select' && ['read', 'open'].includes(control.action))));
      if (input.setButton && (direction || mappedAction)) {
        event.preventDefault();
        if (event.repeat) return;
        if (direction) input.setDirection('keyboard:' + source, direction);
        if (mappedAction) input.setButton('keyboard:' + source, mappedAction, true);
      }
      let changed = false;
      if (direction && keyboardDirections.current.get(source) !== direction) {
        arcadeAudio.play('joystick');
        keyboardDirections.current.delete(source);
        keyboardDirections.current.set(source, direction);
        changed = true;
      }
      if (action.length && !keyboardActions.current.has(source)) {
        arcadeAudio.play(action[0].action);
        keyboardActions.current.set(source, action.map(control => control.node));
        changed = true;
      }
      if (changed) invalidate();
    };
    const keyup = event => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const source = event.code || key;
      if (input.setButton) {
        input.setDirection('keyboard:' + source, null);
        const action = cabinetKeyActions[key] || { Enter: 'start', Shift: 'select', p: 'pause', Escape: 'pause' }[key];
        if (action) input.setButton('keyboard:' + source, action, false);
      }
      const direction = keyboardDirections.current.delete(source);
      const action = keyboardActions.current.delete(source);
      let released = false;
      if (key === ' ' && input.setButton) for (const control of controls) {
        if (!heldKeys.current.delete(control.node)) continue;
        if (control.action) input.setButton('key:' + control.node, control.action, false);
        released = true;
      }
      if (direction || action || released) invalidate();
    };
    const documents = new Set([document, keyboardDocument].filter(Boolean));
    const removeUnlock = keyboardDocument ? arcadeAudio.listen(keyboardDocument) : () => {};
    for (const target of documents) {
      target.addEventListener('keydown', keydown);
      target.addEventListener('keyup', keyup);
    }
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', reset);
    return () => {
      reset();
      removeUnlock();
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', reset);
      for (const target of documents) {
        target.removeEventListener('keydown', keydown);
        target.removeEventListener('keyup', keyup);
      }
    };
  }, [controls, input, invalidate, keyboardDocument]);

  useFrame(({ camera, size }, delta) => {
    for (const control of controls) {
      control.screen.copy(control.anchor);
      scene.localToWorld(control.screen);
      control.screen.project(camera);
      control.screen.x *= size.width / 2;
      control.screen.y *= size.height / 2;
    }
    for (const control of controls) {
      const element = elements.current.get(control.node);
      const nearest = Math.min(...controls.filter(other => other !== control).map(other =>
        Math.hypot(control.screen.x - other.screen.x, control.screen.y - other.screen.y)));
      if (element) {
        const edge = Math.min(size.width / 2 - Math.abs(control.screen.x), size.height / 2 - Math.abs(control.screen.y));
        const targetSize = Math.max(24, Math.min(control.joystick ? 52 : 44, nearest - 2, edge * 2 - 2));
        element.style.setProperty('--target-size', `${targetSize}px`);
        // Keep the minimum target on the visible portion of hardware at viewport edges.
        const limitX = size.width / 2 - targetSize / 2 - 1;
        const limitY = size.height / 2 - targetSize / 2 - 1;
        const shiftX = Math.max(-limitX, Math.min(limitX, control.screen.x)) - control.screen.x;
        const shiftY = control.screen.y - Math.max(-limitY, Math.min(limitY, control.screen.y));
        element.style.translate = `${shiftX}px ${shiftY}px`;
      }
      const active = [...pointers.current.values()].find(pointer => pointer.control === control);
      const keyboardDirection = [...keyboardDirections.current.values()].at(-1);
      const direction = active?.direction || (control.joystick ? keyboardDirection : null);
      const pressed = Boolean(active || heldKeys.current.has(control.node) ||
        [...keyboardActions.current.values()].flat().includes(control.node) || (control.joystick && keyboardDirection));
      element?.toggleAttribute('data-pressed', pressed);
      if (control.joystick) element?.setAttribute('data-direction', direction || '');
      const factor = reducedMotion.matches ? 1 : 1 - Math.exp(-30 * delta);
      const y = control.pressPosition.y - (!control.joystick && pressed ? 0.018 / control.mesh.scale.y : 0);
      const rx = control.rotation.x + (direction === 'down' ? 0.25 : direction === 'up' ? -0.25 : 0);
      const rz = control.rotation.z + (direction === 'left' ? 0.25 : direction === 'right' ? -0.25 : 0);
      control.pressMesh.position.y += (y - control.pressMesh.position.y) * factor;
      control.mesh.rotation.x += (rx - control.mesh.rotation.x) * factor;
      control.mesh.rotation.z += (rz - control.mesh.rotation.z) * factor;
      if (Math.abs(y - control.pressMesh.position.y) + Math.abs(rx - control.mesh.rotation.x) + Math.abs(rz - control.mesh.rotation.z) > 0.0001) invalidate();
    }
  });

  function release(event, control, cancelled = false) {
    const pointer = pointers.current.get(event.pointerId);
    if (!pointer || pointer.control !== control) return;
    pointers.current.delete(event.pointerId);
    if (control.action && input.setButton) input.setButton('pointer:' + event.pointerId, control.action, false, cancelled);
    input.setDirection('pointer:' + event.pointerId, null);
    if (cancelled && input.setButton) {
      input.reset();
      pointers.current.clear();
      keyboardDirections.current.clear();
      keyboardActions.current.clear();
      heldKeys.current.clear();
    }
    event.currentTarget.removeAttribute('data-pressed');
    invalidate();
  }

  return controls.map(control => (
    <Html key={control.node} center position={control.anchor} zIndexRange={[5, 3]}>
      <button
        ref={element => { if (element) elements.current.set(control.node, element); }}
        className="cabinet-control"
        data-action={control.action}
        data-input-page={keyboardDocument && new URL(keyboardDocument.URL).pathname}
        aria-label={`Cabinet: ${control.label}`}
        title={control.label}
        onPointerDown={event => {
          if (event.button !== 0 || [...pointers.current.values()].some(pointer => pointer.control === control)) return;
          event.preventDefault();
          event.stopPropagation();
          arcadeAudio.unlock();
          if (control.action) arcadeAudio.play(control.action);
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { control, x: event.clientX, y: event.clientY, direction: null });
          if (control.action && input.setButton) input.setButton('pointer:' + event.pointerId, control.action, true);
          event.currentTarget.setAttribute('data-pressed', '');
          invalidate();
        }}
        onPointerMove={event => {
          const pointer = pointers.current.get(event.pointerId);
          if (!pointer || !control.joystick) return;
          const direction = joystickDirection(event.clientX - pointer.x, event.clientY - pointer.y);
          if (direction && direction !== pointer.direction) arcadeAudio.play('joystick');
          pointer.direction = direction;
          input.setDirection('pointer:' + event.pointerId, pointer.direction);
          invalidate();
        }}
        onPointerUp={event => {
          const pointer = pointers.current.get(event.pointerId);
          if (pointer?.control === control && control.action && !input.setButton) input.action(control.action);
          release(event, control);
        }}
        onPointerCancel={event => release(event, control, true)}
        onLostPointerCapture={event => release(event, control, true)}
        onKeyDown={event => {
          if (![' ', 'Enter'].includes(event.key)) return;
          event.preventDefault();
          if (input.setButton && event.key === 'Enter') return;
          if (event.repeat) return;
          if (control.action) arcadeAudio.play(control.action);
          heldKeys.current.add(control.node);
          event.currentTarget.setAttribute('data-pressed', '');
          if (control.action) {
            if (input.setButton) input.setButton('key:' + control.node, control.action, true);
            else input.action(control.action);
          }
          invalidate();
        }}
        onKeyUp={event => {
          if (![' ', 'Enter'].includes(event.key)) return;
          event.preventDefault();
          if (input.setButton && event.key === 'Enter') return;
          heldKeys.current.delete(control.node);
          if (control.action && input.setButton) input.setButton('key:' + control.node, control.action, false);
          input.setDirection('key:' + control.node, null);
          event.currentTarget.removeAttribute('data-pressed');
          invalidate();
        }}
        onBlur={event => {
          // Automatic emulator focus stays inside the cabinet; its keyup is forwarded back here.
          if (input.setButton && document.hasFocus()) return;
          heldKeys.current.delete(control.node);
          if (control.action && input.setButton) input.setButton('key:' + control.node, control.action, false, true);
          input.setDirection('key:' + control.node, null);
          event.currentTarget.removeAttribute('data-pressed');
          invalidate();
        }}
        onClick={event => {
          // Assistive technology activates native buttons without pointer events.
          if (event.detail === 0 && control.action) {
            arcadeAudio.play(control.action);
            input.action(control.action);
          }
        }}
      />
    </Html>
  ));
}
