import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Loader3DTiles } from 'three-loader-3dtiles';

import { objectToString } from '@skybrush/aframe-components';


// Register the Google Maps 3D Tiles component if it doesn't exist
if (typeof AFRAME !== 'undefined' && !AFRAME.components['google-maps-3dtiles']) {
  AFRAME.registerComponent('google-maps-3dtiles', {
    schema: {
      googleApiKey: { type: 'string' },
      lat: { type: 'number' },
      long: { type: 'number' },
      altitude: { type: 'number', default: 0 },
      testMode: { type: 'boolean', default: false },
    },

    init: async function (this: any) {
      this._hasLoggedUpdateError = false;
      await this._loadTileset();
    },

    update: async function (this: any, oldData: any) {
      if (
        oldData.googleApiKey !== this.data.googleApiKey ||
        oldData.lat !== this.data.lat ||
        oldData.long !== this.data.long ||
        oldData.testMode !== this.data.testMode
      ) {
        if (this.runtime) {
          this.runtime.dispose();
          this.runtime = null;
        }
        await this._loadTileset();
      }
    },

    tick: function (this: any, _t: number, dt: number) {
      if (!this.runtime || !this.el.sceneEl) return;

      const sceneEl = this.el.sceneEl;
      const renderer = sceneEl.renderer;

      // sceneEl.camera is already the Three.js PerspectiveCamera
      const camera = sceneEl.camera;

      if (!renderer || !camera) return;
      if (!camera.isCamera) return;
      if (!camera.projectionMatrix?.elements) return;

      try {
        this.runtime.update(dt / 1000, renderer, camera);
        this._hasLoggedUpdateError = false;
      } catch (e) {
        if (!this._hasLoggedUpdateError) {
          console.warn('3D Tiles tick error:', e);
          this._hasLoggedUpdateError = true;
        }
      }
    },

    remove: function (this: any) {
      if (this.runtime) {
        this.runtime.dispose();
        this.runtime = null;
      }
    },

    _loadTileset: async function (this: any) {
      const isTestMode = this.data.testMode;

      if (!this.data.googleApiKey && !isTestMode) {
        console.warn('Google Maps 3D Tiles: No API Key provided');
        return;
      }

      // Remove any existing tileset
      this.el.removeObject3D('tileset');

      const url = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${this.data.googleApiKey}`;
      console.log('Google Maps 3D Tiles: Loading from', url);

      try {
        const sceneEl = this.el.sceneEl;

        const { model, runtime } = await (Loader3DTiles as any).load({
          url,
          renderer: sceneEl.renderer,
          viewport: sceneEl.canvas,
          options: {
            dracoDecoderPath: 'https://www.gstatic.com/draco/v1/decoders/',
            basisTranscoderPath: 'https://cdn.jsdelivr.net/npm/three@0.137.0/examples/js/libs/basis/',
            googleApiKey: this.data.googleApiKey,
            maximumScreenSpaceError: 48,
            maximumMemoryUsage: 128,
          },
        });

        // Store runtime and add model to scene
        this.runtime = runtime;
        this.el.setObject3D('tileset', model);

        // Orient the tileset to the chosen geographic location
        console.log('Google Maps 3D Tiles: Orienting to lat:', this.data.lat, 'lng:', this.data.long);
        runtime.orientToGeocoord({
          lat: this.data.lat,
          long: this.data.long,
          height: this.data.altitude,
        });

        console.log('Google Maps 3D Tiles: Ready!');
      } catch (err: any) {
        console.error('Google Maps 3D Tiles: Load failed:', err?.message || err);
      }
    },
  });
}

const grounds = {
  /* Minecraft-style ground texture (green) */
  default: {
    groundColor: '#8eb971',
    groundColor2: '#507a32',
    groundTexture: 'walkernoise',
    groundYScale: 24,
    /* make the "play area" larger so we have more space to fly around without
     * bumping into hills */
    playArea: 1.6,
  },
  /* Checkerboard indoor texture */
  indoor: {
    ground: 'flat',
    groundColor: '#333',
    groundColor2: '#666',
    groundTexture: 'checkerboard',
  },
};

const environments = {
  day: {
    preset: 'default',
    fog: 0.2,
    gridColor: '#fff',
    skyType: 'atmosphere',
    skyColor: '#88c',
    ...grounds.default,
  },
  night: {
    preset: 'starry',
    fog: 0.2,
    gridColor: '#39d2f2',
    skyType: 'atmosphere',
    skyColor: '#88c',
    ...grounds.default,
  },
  indoor: {
    preset: 'default',
    fog: 0.2,
    gridColor: '#888',
    skyType: 'gradient',
    skyColor: '#000',
    horizonColor: '#222',
    ...grounds.indoor,
  },
  custom: {
    disabled: true,
  },
  disabled: {
    disabled: true,
  },
};

export type SceneryType = keyof typeof environments;

export type CustomEnvironmentProps = {
  readonly modelUrl?: string;
  readonly hdrUrl?: string;
  readonly position: [number, number, number];
  readonly rotation: [number, number, number];
  readonly scale: [number, number, number];
  readonly shadows: boolean;
  readonly googleApiKey?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly altitude?: number;
  readonly useGoogleMaps?: boolean;
  readonly testMode?: boolean;
};

type SceneryProps = {
  readonly grid: boolean | string;
  readonly type: SceneryType;
  readonly customSettings?: CustomEnvironmentProps;
  readonly sceneLoaded?: boolean;
};

const Scenery = ({ grid, type = 'night', customSettings, sceneLoaded }: SceneryProps) => {
  const scale = type === 'custom' ? 1 : (type === 'indoor' ? 0.5 : 10);
  const enabled = type !== 'disabled';
  const isGoogleMaps = (customSettings?.useGoogleMaps && customSettings?.googleApiKey) || customSettings?.testMode;
  
  return enabled ? (
    <a-entity position='0 -0.001 0' scale={`${scale} ${scale} ${scale}`}>
      {type === 'custom' ? (
        <>
          <a-entity
            environment={objectToString({
              preset: 'default',
              lighting: 'none',
              ground: isGoogleMaps ? 'none' : 'flat', // Disable ground if Google Maps is ON
              groundColor: '#444',
              grid: typeof grid === 'string' ? grid : grid ? '1x1' : 'none',
              skyType: customSettings?.hdrUrl ? 'none' : 'atmosphere',
            })}
          />

          {customSettings?.hdrUrl && (
            <a-entity
              geometry="primitive: sphere; radius: 5000"
              material={`src: ${customSettings.hdrUrl}; shader: flat; side: back`}
              scale="-1 1 1"
            />
          )}

          <a-entity light="type: ambient; color: #FFF; intensity: 0.5" />
          <a-entity light="type: hemisphere; color: #FFF; groundColor: #444; intensity: 0.8" />
          <a-entity
            light={`type: directional; castShadow: ${customSettings?.shadows ? 'true' : 'false'}; shadowMapHeight: 2048; shadowMapWidth: 2048; intensity: 1.5;`}
            position="10 20 10"
          />

          {!isGoogleMaps && (
            <a-entity
              geometry="primitive: plane; width: 2000; height: 2000"
              material="color: #333; transparent: true; opacity: 0.5"
              rotation="-90 0 0"
              position="0 -0.01 0"
            />
          )}

          {isGoogleMaps ? (
            <a-entity
              position={customSettings?.position?.join(' ') || '0 0 0'}
              google-maps-3dtiles={objectToString({
                googleApiKey: customSettings?.googleApiKey,
                lat: customSettings?.latitude ?? 0,
                long: customSettings?.longitude ?? 0,
                altitude: customSettings?.altitude ?? 0,
                testMode: !!customSettings?.testMode,
              })}
            />
          ) : (
            customSettings?.modelUrl && (
              <a-entity
                position={customSettings.position?.join(' ') || '0 0 0'}
                rotation={customSettings.rotation?.join(' ') || '0 0 0'}
                scale={customSettings.scale?.join(' ') || '1 1 1'}
              >
                <a-entity
                  gltf-model={customSettings.modelUrl}
                  shadow={customSettings.shadows ? 'cast: true; receive: true' : 'cast: false; receive: false'}
                />
              </a-entity>
            )
          )}
        </>
      ) : (
        <a-entity
          environment={objectToString({
            ...environments[type],
            grid: typeof grid === 'string' ? grid : grid ? '1x1' : 'none',
          })}
        />
      )}
    </a-entity>
  ) : null;
};

export default React.memo(Scenery);
