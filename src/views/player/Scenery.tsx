import React from 'react';
import * as THREE from 'three';
import { OGC3DTile } from '@jdultra/threedtiles';
import { objectToString } from '@skybrush/aframe-components';

if (
  typeof AFRAME !== 'undefined' &&
  !AFRAME.components['google-maps-3dtiles']
) {
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
      this._frameCounter = 0;
      this._model = null;
      await this._loadTileset();
    },

    update: async function (this: any, oldData: any) {
      if (
        oldData.googleApiKey !== this.data.googleApiKey ||
        oldData.lat !== this.data.lat ||
        oldData.long !== this.data.long ||
        oldData.testMode !== this.data.testMode
      ) {
        this._loadTileset();
      }
    },

    tick: function (this: any, _t: number, dt: number) {
      if (!this._model || !this.el.sceneEl) return;

      const sceneEl = this.el.sceneEl;
      const camera = sceneEl.camera;
      if (!camera?.isCamera) return;

      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();

      try {
        // @jdultra/threedtiles update loop
        this._model.update(camera);
        if (this._model.tileLoader) {
          this._model.tileLoader.update();
        }
        this._hasLoggedUpdateError = false;
      } catch (e: any) {
        if (!this._hasLoggedUpdateError) {
          console.warn('3D Tiles tick error:', e?.message || e);
          this._hasLoggedUpdateError = true;
        }
      }
    },

    remove: function (this: any) {
      if (this._model) {
        this._model.dispose();
        this._model = null;
      }
    },

    _loadTileset: async function (this: any) {
      const isTestMode = this.data.testMode;

      if (!this.data.googleApiKey && !isTestMode) {
        console.warn('Google Maps 3D Tiles: No API Key provided');
        return;
      }

      const sceneEl = this.el.sceneEl;
      if (!sceneEl) return;

      if (!sceneEl.renderer || !sceneEl.canvas) {
        await new Promise<void>((resolve) => {
          const onRenderStart = () => {
            sceneEl.removeEventListener('renderstart', onRenderStart as any);
            resolve();
          };
          sceneEl.addEventListener('renderstart', onRenderStart as any);
        });
      }

      this.el.removeObject3D('tileset');
      if (this._model) {
        this._model.dispose();
      }

      const url = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${this.data.googleApiKey}`;
      console.log('Google Maps 3D Tiles: Loading with @jdultra/threedtiles');

      try {
        const model = new OGC3DTile({
          url,
          renderer: sceneEl.renderer,
          geometricErrorMultiplier: 2.0, // Adjust for detail
          queryParams: {
            key: this.data.googleApiKey,
          },
        });

        this._model = model;

        // WGS84 Ellipsoid constants
        const a = 6378137.0; // semi-major axis
        const f = 1 / 298.257223563; // flattening
        const e2 = 2 * f - f * f; // eccentricity squared

        const latRad = (this.data.lat * Math.PI) / 180;
        const lonRad = (this.data.long * Math.PI) / 180;
        const h = this.data.altitude;

        const sinLat = Math.sin(latRad);
        const cosLat = Math.cos(latRad);
        const sinLon = Math.sin(lonRad);
        const cosLon = Math.cos(lonRad);

        const N = a / Math.sqrt(1 - e2 * sinLat * sinLat);

        const surfacePos = new THREE.Vector3(
          (N + h) * cosLat * cosLon,
          (N + h) * cosLat * sinLon,
          (N * (1 - e2) + h) * sinLat
        );

        // Up vector is the geodetic normal at the surface
        const up = new THREE.Vector3(
          cosLat * cosLon,
          cosLat * sinLon,
          sinLat
        );

        // Rebase logic:
        // We put the tileset in a group and move the group by the inverse transform.
        const rebaseGroup = new THREE.Group();
        rebaseGroup.add(model);

        // Precise orientation: Y-up, Z-forward (North)
        const upVec = up.clone().normalize();
        const northVec = new THREE.Vector3(0, 0, 1).projectOnPlane(upVec).normalize();
        const eastVec = new THREE.Vector3().crossVectors(northVec, upVec).normalize();

        const rotationMatrix = new THREE.Matrix4().makeBasis(
          eastVec,
          upVec,
          northVec.clone().negate()
        )

        const q = new THREE.Quaternion().setFromRotationMatrix(rotationMatrix);
        const userRotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            THREE.MathUtils.degToRad(this.el.getAttribute('rotation')?.x || 0),
            THREE.MathUtils.degToRad(this.el.getAttribute('rotation')?.y || 0),
            THREE.MathUtils.degToRad(this.el.getAttribute('rotation')?.z || 0)
          )
        );

        // Combine: geospatial orientation + user rotation
        rebaseGroup.quaternion.copy(q).multiply(userRotation);
        rebaseGroup.position
          .copy(surfacePos)
          .applyQuaternion(q)
          .multiplyScalar(-1);
        rebaseGroup.updateMatrixWorld(true);

        // Add the rebased group to the A-Frame entity
        this.el.setObject3D('tileset', rebaseGroup);

        console.log('Google Maps 3D Tiles: Ready!');
      } catch (err: any) {
        console.error(
          'Google Maps 3D Tiles: Load failed:',
          err?.message || err
        );
      }
    },
  });
}

const grounds = {
  default: {
    groundColor: '#8eb971',
    groundColor2: '#507a32',
    groundTexture: 'walkernoise',
    groundYScale: 24,
    playArea: 1.6,
  },
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
  custom: { disabled: true },
  disabled: { disabled: true },
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

const Scenery = ({
  grid,
  type = 'night',
  customSettings,
  sceneLoaded,
}: SceneryProps) => {
  const scale = type === 'custom' ? 1 : type === 'indoor' ? 0.5 : 10;
  const enabled = type !== 'disabled';
  const isGoogleMaps =
    (customSettings?.useGoogleMaps && customSettings?.googleApiKey) ||
    customSettings?.testMode;

  return enabled ? (
    <a-entity position='0 -0.001 0' rotation='90 90 0' scale={`${scale} ${scale} ${scale}`}>
      {type === 'custom' ? (
        <>
          <a-entity
            environment={objectToString({
              preset: 'default',
              lighting: 'none',
              ground: isGoogleMaps ? 'none' : 'flat', // Disable ground if Google Maps is ON
              groundColor: '#444',
              grid: typeof grid === 'string' ? grid : grid ? '1x1' : 'none',
              skyType: isGoogleMaps
                ? 'none'
                : customSettings?.hdrUrl
                  ? 'none'
                  : 'atmosphere',
            })}
          />

          {!isGoogleMaps && customSettings?.hdrUrl && (
            <a-entity
              geometry='primitive: sphere; radius: 5000'
              material={`src: ${customSettings.hdrUrl}; shader: flat; side: back`}
              scale='-1 1 1'
            />
          )}


          <a-entity light='type: ambient; color: #FFF; intensity: 0.5' />
          <a-entity light='type: hemisphere; color: #FFF; groundColor: #444; intensity: 0.8' />
          <a-entity
            light={`type: directional; castShadow: ${customSettings?.shadows ? 'true' : 'false'}; shadowMapHeight: 2048; shadowMapWidth: 2048; intensity: 1.5;`}
            position='10 20 10'
          />
          <a-entity light="type: ambient; intensity: 2"></a-entity>
          <a-entity light="type: directional; intensity: 2" position="1 1 1"></a-entity>
          {isGoogleMaps ? (
            <a-entity
              position={customSettings?.position?.join(' ') || '0 0 0'}
              rotation={customSettings?.rotation?.join(' ') || '0 0 0'}
              scale={customSettings?.scale?.join(' ') || '1 1 1'}
              google-maps-3dtiles={objectToString({
                googleApiKey: customSettings?.googleApiKey,
                lat: customSettings?.latitude ?? 0,
                long: customSettings?.longitude ?? 0,
                altitude: customSettings?.altitude ?? 0,
                testMode: !!customSettings?.testMode,
              })}
            />
          ) : (
            <>

              <a-entity
                geometry='primitive: plane; width: 2000; height: 2000'
                material='color: #333; transparent: true; opacity: 0.5'
                rotation='-90 0 0'
                position='0 -0.01 0'
              />
              {customSettings?.modelUrl && (

                <a-entity
                  position={customSettings.position?.join(' ') || '0 0 0'}
                  rotation={customSettings.rotation?.join(' ') || '0 0 0'}
                  scale={customSettings.scale?.join(' ') || '1 1 1'}
                >
                  <a-entity
                    gltf-model={customSettings.modelUrl}
                    shadow={
                      customSettings.shadows
                        ? 'cast: true; receive: true'
                        : 'cast: false; receive: false'
                    }
                  />
                </a-entity>
              )}
            </>
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
