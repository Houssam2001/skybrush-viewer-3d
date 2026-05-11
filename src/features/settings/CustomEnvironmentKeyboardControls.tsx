import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '~/hooks/store';
import { setCustomEnvironmentSettings } from './actions';
import { getScenery } from './selectors';

const CustomEnvironmentKeyboardControls = () => {
  const dispatch = useAppDispatch();
  const scenery = useAppSelector(getScenery);
  const customEnvironment = useAppSelector(state => state.settings.threeD.customEnvironment);

  useEffect(() => {
    if (scenery !== 'custom') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const step = e.shiftKey ? 1.0 : (e.altKey || e.metaKey ? 0.01 : 0.1);
      
      // Get latest values from state
      const pos = [...(customEnvironment?.position || [0, 0, 0])] as [number, number, number];
      const rot = [...(customEnvironment?.rotation || [0, 0, 0])] as [number, number, number];
      const cam = [...(customEnvironment?.cameraPosition || [0, 20, 50])] as [number, number, number];

      let changed = false;

      // Camera Point (Arrows for X/Z, PageUp/Down for Y)
      if (e.key === 'ArrowUp') { cam[2] -= step; changed = true; }
      if (e.key === 'ArrowDown') { cam[2] += step; changed = true; }
      if (e.key === 'ArrowLeft') { cam[0] -= step; changed = true; }
      if (e.key === 'ArrowRight') { cam[0] += step; changed = true; }
      if (e.key === 'PageUp') { cam[1] += step; changed = true; }
      if (e.key === 'PageDown') { cam[1] -= step; changed = true; }

      // Environment Offset (W, S, A, D, Q, E)
      if (e.key === 'w' || e.key === 'W') { pos[2] -= step; changed = true; }
      if (e.key === 's' || e.key === 'S') { pos[2] += step; changed = true; }
      if (e.key === 'a' || e.key === 'A') { pos[0] -= step; changed = true; }
      if (e.key === 'd' || e.key === 'D') { pos[0] += step; changed = true; }
      if (e.key === 'q' || e.key === 'Q') { pos[1] += step; changed = true; }
      if (e.key === 'e' || e.key === 'E') { pos[1] -= step; changed = true; }

      // Environment Rotation (I, K, J, L, U, O)
      if (e.key === 'i' || e.key === 'I') { rot[0] += step * 10; changed = true; }
      if (e.key === 'k' || e.key === 'K') { rot[0] -= step * 10; changed = true; }
      if (e.key === 'j' || e.key === 'J') { rot[1] += step * 10; changed = true; }
      if (e.key === 'l' || e.key === 'L') { rot[1] -= step * 10; changed = true; }
      if (e.key === 'u' || e.key === 'U') { rot[2] += step * 10; changed = true; }
      if (e.key === 'o' || e.key === 'O') { rot[2] -= step * 10; changed = true; }

      if (changed) {
        e.preventDefault();
        e.stopPropagation();
        dispatch(setCustomEnvironmentSettings({
          position: pos,
          rotation: rot,
          cameraPosition: cam
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [scenery, customEnvironment, dispatch]);

  return null;
};

export default CustomEnvironmentKeyboardControls;
