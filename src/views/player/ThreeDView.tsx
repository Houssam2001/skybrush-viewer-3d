/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import config from 'config';

import type { Entity } from 'aframe';
import type React from 'react';
import { useEffect, useState } from 'react';
import { connect } from 'react-redux';

import '~/aframe';

import { objectToString } from '@skybrush/aframe-components';
import type {
  ThreeJsPositionTuple,
  ThreeJsRotationTuple,
} from '@skybrush/aframe-components/spatial';

import { getDroneModel } from '~/features/settings/selectors';
import type { DroneModelType, CustomEnvironmentSettings } from '~/features/settings/types';
import {
  getLoadedShowId,
  getNumberOfDronesInShow,
} from '~/features/show/selectors';
import {
  getEffectiveDroneRadius,
  getEffectiveScenery,
  getInitialThreeJsCameraConfiguration,
} from '~/features/three-d/selectors';
import type { RootState } from '~/store';

import { SCENE_CAMERA_ID, SELECTABLE_OBJECT_CLASS } from './constants';
import CoordinateSystemAxes from './CoordinateSystemAxes';
import Scenery, { type SceneryType } from './Scenery';
import SelectionMarkers from './SelectionMarkers';

import flapperDroneModel from '~/../assets/models/flapper-drone.obj';
import quadcopterModel from '~/../assets/models/quadcopter.obj';

type ThreeDViewProps = {
  readonly axes: boolean;
  readonly cameraConfiguration: {
    position: ThreeJsPositionTuple;
    rotation: ThreeJsRotationTuple;
  };
  readonly cameraRef: React.RefObject<Entity | null>;
  readonly customEnvironment?: CustomEnvironmentSettings;
  readonly droneModel: DroneModelType;
  readonly customDroneModelUrl?: string;
  readonly droneRadius: number;
  readonly grid: boolean | string;
  readonly navigation: {
    mode: 'walk' | 'fly';
    parameters: any;
  };
  readonly numDrones: number;
  readonly ref?: React.Ref<HTMLElement>;
  readonly scaleLabels: boolean;
  readonly scenery: SceneryType;
  readonly showId: number;
  readonly showLabels: boolean;
  readonly showStatistics: boolean;
  readonly showYaw: boolean;
  readonly vrEnabled?: boolean;
};

const DEFAULT_CAMERA_CONFIGURATION = {
  position: [0, 1111000, 0],
  rotation: [-45, 0, 0], // Looking up at the sky
};

const ThreeDView = (props: ThreeDViewProps) => {
  const {
    axes,
    cameraConfiguration = DEFAULT_CAMERA_CONFIGURATION,
    cameraRef,
    customEnvironment,
    droneModel,
    customDroneModelUrl,
    droneRadius,
    grid,
    navigation,
    numDrones,
    ref,
    scaleLabels,
    scenery,
    showId,
    showLabels,
    showStatistics,
    showYaw,
    vrEnabled,
  } = props;

  const [cameraId, setCameraId] = useState(0);
  const [sceneLoaded, setSceneLoaded] = useState(false);
  const isGoogleMaps =
    (customEnvironment?.useGoogleMaps && !!customEnvironment?.googleApiKey) ||
    !!customEnvironment?.testMode;

  const extraCameraProps = {
    'look-controls': objectToString({
      enabled: false,
    }),
    'wasd-controls': objectToString({
      enabled: false,
    }),
    'advanced-camera-controls': objectToString({
      acceptsKeyboardEvent: 'notEditable',
      fly: navigation && navigation.mode === 'fly',
      minAltitude: 0.5,
      reverseMouseDrag: true,
    }),
  };

  useEffect(() => {
    const scene = document.querySelector('a-scene');
    if (scene) {
      if ((scene as any).hasLoaded) {
        setSceneLoaded(true);
      } else {
        const onLoaded = () => setSceneLoaded(true);
        scene.addEventListener('loaded', onLoaded);
        return () => scene.removeEventListener('loaded', onLoaded);
      }
    }
  }, []);

  const extraSceneProps: Record<string, string> = {};
  const isLightScenery = scenery === 'day';
  const isSceneryEnabled = scenery !== 'disabled';

  if (showStatistics) {
    extraSceneProps.stats = 'true';
  }

  // `xr-mode-ui` relies on WebXR session internals. Some viewer environments
  // crash here (e.g. `Cannot read properties of undefined (reading
  // 'isPresenting')`), which prevents rendering. Since Google Maps 3D tiles
  // and the normal viewer flow don't require WebXR UI, disable it.
  extraSceneProps['xr-mode-ui'] = 'enabled: false';

  if (!isSceneryEnabled) {
    extraSceneProps.background = 'color: black';
  }

  // Updating the camera is tricky. We need to reset the camera position and
  // rotation to the one prescribed by its props whenever the user loads a
  // new show. The easiest way to achieve this is to assign a new key to the
  // camera whenever a new show is loaded because this would unmount the old
  // camera and mount a new one. However, we must _not_ unmount the camera
  // when the scene is still loading, because it would cause the loading screen
  // of the scene to get stuck. This is easy to trigger in Firefox, a bit harder
  // in Chrome, but it's still a problem in both cases. That's why we need a
  // separate cameraId and sceneLoaded state
  useEffect(() => {
    if (showId !== cameraId && sceneLoaded) {
      setCameraId(showId);
    }
  }, [cameraId, sceneLoaded, showId]);

  return (
    <a-scene
      ref={ref}
      // `@skybrush/aframe-components/deallocate` calls
      // `renderer.forceContextLoss()`, which isn't available on all three.js
      // renderer builds. When using Google Maps 3D Tiles, keeping deallocate
      // disabled avoids the crash.
      deallocate={false}
      keyboard-shortcuts={objectToString({ enterVR: vrEnabled })}
      loading-screen='backgroundColor: #444; dotsColor: #888'
      renderer='antialias: true; logarithmicDepthBuffer: true'
      shadow={customEnvironment?.shadows ? 'type: pcfsoft' : ''}
      {...extraSceneProps}
    >
      <a-assets>
        <a-asset-item id='flapper-drone' src={flapperDroneModel} />
        <a-asset-item id='quadcopter' src={quadcopterModel} />
        {customDroneModelUrl && (
          <a-asset-item 
            id={`custom-drone-model-${customDroneModelUrl.substring(customDroneModelUrl.length - 8)}`} 
            src={customDroneModelUrl} 
          />
        )}
      </a-assets>

      {sceneLoaded && (
        <a-camera
          key={`camera-${cameraId}-${isGoogleMaps}`}
          ref={cameraRef}
          id={SCENE_CAMERA_ID}
          near={isGoogleMaps ? '0.1' : '0.1'}
          far={isGoogleMaps ? '10000' : '1000'}
          position={
            scenery === 'custom' && customEnvironment?.cameraPosition
              ? customEnvironment.cameraPosition.join(' ')
              : (cameraConfiguration?.position || [0, 0, 0]).join(' ')
          }
          rotation={(cameraConfiguration?.rotation || [0, 0, 0]).join(' ')}
          {...extraCameraProps}
        >
          <a-entity
            cursor='rayOrigin: mouse'
            raycaster={`objects: .${SELECTABLE_OBJECT_CLASS}; interval: 100`}
          />
        </a-camera>
      )}

      <a-entity rotation='-90 0 90'>
        {axes && <CoordinateSystemAxes length={10} lineWidth={10} />}
        {/* Watch out for the handling of Boolean props below: they need to be
         * passed to AFrame components as strings! */}
        <a-drone-flock
          drone-model={droneModel}
          custom-model-url={customDroneModelUrl ? `#custom-drone-model-${customDroneModelUrl.substring(customDroneModelUrl.length - 8)}` : ''}
          drone-radius={droneRadius}
          label-color={isLightScenery ? 'black' : 'white'}
          scale-labels={String(!!scaleLabels)}
          show-glow={String(!isLightScenery)}
          show-labels={String(!!showLabels)}
          show-yaw={String(!!showYaw)}
          size={numDrones}
        />
        <SelectionMarkers />
        {/* <VelocityArrows /> */}
      </a-entity>

      <Scenery
        type={scenery}
        grid={grid}
        customSettings={customEnvironment}
        sceneLoaded={sceneLoaded}
      />
    </a-scene>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    cameraConfiguration: getInitialThreeJsCameraConfiguration(state),
    numDrones: getNumberOfDronesInShow(state),
    showId: getLoadedShowId(state),
    ...state.settings.threeD,
    ...state.threeD,
    droneModel: getDroneModel(state),
    customDroneModelUrl: state.settings.threeD.customDroneModelUrl,
    droneRadius: getEffectiveDroneRadius(state),
    scenery: getEffectiveScenery(state),
    customEnvironment: state.settings.threeD.customEnvironment,
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  { forwardRef: true }
)(ThreeDView);
