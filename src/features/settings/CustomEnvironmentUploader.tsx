import React, { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import MapIcon from '@mui/icons-material/Map';

import { useAppDispatch, useAppSelector } from '~/hooks/store';
import { setCustomEnvironmentSettings } from './actions';
import { getScenery } from './selectors';
import LocationPickerModal from './LocationPickerModal';

const CustomEnvironmentUploader = () => {
  const dispatch = useAppDispatch();
  const scenery = useAppSelector(getScenery);
  const customEnvironment = useAppSelector(state => state.settings.threeD.customEnvironment);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (scenery !== 'custom') {
    return null;
  }

  const posX = customEnvironment?.position[0] ?? 0;
  const posY = customEnvironment?.position[1] ?? 0;
  const posZ = customEnvironment?.position[2] ?? 0;

  const camX = customEnvironment?.cameraPosition?.[0] ?? 0;
  const camY = customEnvironment?.cameraPosition?.[1] ?? 20;
  const camZ = customEnvironment?.cameraPosition?.[2] ?? 50;
  
  const rotX = customEnvironment?.rotation?.[0] ?? 0;
  const rotY = customEnvironment?.rotation?.[1] ?? 0;
  const rotZ = customEnvironment?.rotation?.[2] ?? 0;

  const useGoogleMaps = customEnvironment?.useGoogleMaps ?? false;
  const googleApiKey = customEnvironment?.googleApiKey ?? '';
  const latitude = customEnvironment?.latitude ?? 0;
  const longitude = customEnvironment?.longitude ?? 0;

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      dispatch(setCustomEnvironmentSettings({ modelUrl: url, useGoogleMaps: false }));
    }
  };

  const updatePosition = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPos: [number, number, number] = [
      axis === 'x' ? value : posX,
      axis === 'y' ? value : posY,
      axis === 'z' ? value : posZ,
    ];
    dispatch(setCustomEnvironmentSettings({ position: newPos }));
  };

  const updateCamera = (axis: 'x' | 'y' | 'z', value: number) => {
    const newCam: [number, number, number] = [
      axis === 'x' ? value : camX,
      axis === 'y' ? value : camY,
      axis === 'z' ? value : camZ,
    ];
    dispatch(setCustomEnvironmentSettings({ cameraPosition: newCam }));
  };

  const updateRotation = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRot: [number, number, number] = [
      axis === 'x' ? value : rotX,
      axis === 'y' ? value : rotY,
      axis === 'z' ? value : rotZ,
    ];
    dispatch(setCustomEnvironmentSettings({ rotation: newRot }));
  };

  return (
    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
        Custom Environment Alignment
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={useGoogleMaps}
            onChange={(e) => dispatch(setCustomEnvironmentSettings({ useGoogleMaps: e.target.checked }))}
          />
        }
        label="Use Google Maps 3D Tiles"
        sx={{ mb: 2 }}
      />
      
      {!useGoogleMaps ? (
        <>
          <input
            type="file"
            accept=".glb,.gltf"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
            sx={{ mb: 3 }}
          >
            Upload 3D File (GLB/GLTF)
          </Button>
        </>
      ) : (
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Google Maps API Key"
            value={googleApiKey}
            onChange={(e) => dispatch(setCustomEnvironmentSettings({ googleApiKey: e.target.value }))}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
            type="password"
          />
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              label="Latitude"
              type="number"
              value={latitude}
              onChange={(e) => dispatch(setCustomEnvironmentSettings({ latitude: Number(e.target.value) }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Longitude"
              type="number"
              value={longitude}
              onChange={(e) => dispatch(setCustomEnvironmentSettings({ longitude: Number(e.target.value) }))}
              size="small"
              fullWidth
            />
          </Box>
          <Button
            variant="outlined"
            startIcon={<MapIcon />}
            fullWidth
            onClick={() => setPickerOpen(true)}
            disabled={!googleApiKey}
            size="small"
          >
            Pick from Map
          </Button>

          <TextField
            label="Ground Altitude Offset (m)"
            type="number"
            value={customEnvironment?.altitude ?? 0}
            onChange={(e) => dispatch(setCustomEnvironmentSettings({ altitude: Number(e.target.value) }))}
            fullWidth
            size="small"
            sx={{ mt: 2 }}
            error={(customEnvironment?.altitude ?? 0) > 1000 || (customEnvironment?.altitude ?? 0) < -1000}
            helperText={(customEnvironment?.altitude ?? 0) > 1000 ? "Warning: Altitude is extremely high! Try setting it to 0." : "Increase this value if the map is hidden underground."}
          />
          
          <Button 
            size="small" 
            variant="text" 
            onClick={() => dispatch(setCustomEnvironmentSettings({ altitude: 0 }))}
            sx={{ mt: 1 }}
          >
            Reset Altitude to 0
          </Button>

          {!googleApiKey && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
              Enter API Key first to use the map picker
            </Typography>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={customEnvironment?.testMode ?? false}
                onChange={(e) => dispatch(setCustomEnvironmentSettings({ testMode: e.target.checked }))}
                size="small"
              />
            }
            label={<Typography variant="caption">Debug: Use Public Test Tileset</Typography>}
            sx={{ mt: 1 }}
          />
        </Box>
      )}

      <Typography variant="body2" sx={{ fontWeight: 'bold' }} gutterBottom>
        Environment Offset
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField label="X" type="number" value={posX} onChange={(e) => updatePosition('x', Number(e.target.value))} size="small" />
        <TextField label="Y" type="number" value={posY} onChange={(e) => updatePosition('y', Number(e.target.value))} size="small" />
        <TextField label="Z" type="number" value={posZ} onChange={(e) => updatePosition('z', Number(e.target.value))} size="small" />
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 'bold' }} gutterBottom>
        Environment Rotation
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField label="X (Pitch)" type="number" value={rotX} onChange={(e) => updateRotation('x', Number(e.target.value))} size="small" />
        <TextField label="Y (Yaw)" type="number" value={rotY} onChange={(e) => updateRotation('y', Number(e.target.value))} size="small" />
        <TextField label="Z (Roll)" type="number" value={rotZ} onChange={(e) => updateRotation('z', Number(e.target.value))} size="small" />
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="body2" sx={{ fontWeight: 'bold' }} gutterBottom>
        Camera Point
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField label="X" type="number" value={camX} onChange={(e) => updateCamera('x', Number(e.target.value))} size="small" />
        <TextField label="Y" type="number" value={camY} onChange={(e) => updateCamera('y', Number(e.target.value))} size="small" />
        <TextField label="Z" type="number" value={camZ} onChange={(e) => updateCamera('z', Number(e.target.value))} size="small" />
      </Box>

      {googleApiKey && (
        <LocationPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onConfirm={(lat, lng) => dispatch(setCustomEnvironmentSettings({ 
            latitude: lat, 
            longitude: lng,
            cameraPosition: [0, 1.6, 40] // Set view to ground level (human height)
          }))}
          googleApiKey={googleApiKey}
          initialLat={latitude}
          initialLng={longitude}
        />
      )}
    </Box>
  );
};

export default CustomEnvironmentUploader;
