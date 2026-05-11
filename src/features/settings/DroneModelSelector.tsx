import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import { useAppDispatch, useAppSelector } from '~/hooks/store';
import { setDroneModel, setCustomDroneModelUrl, updateAppSettings } from './actions';
import { getDroneModel } from './selectors';
import { isValidDroneModelType } from './types';

/**
 * Component for selecting the playback speed.
 */
const DroneModelSelector = () => {
  const dispatch = useAppDispatch();
  const droneModel = useAppSelector(getDroneModel);
  const customDroneModelUrl = useAppSelector(state => state.settings.threeD.customDroneModelUrl);
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      let url = URL.createObjectURL(file);
      
      if (file.name.endsWith('.skyc')) {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const content = await zip.loadAsync(file);
          const modelFile = content.file(/model\.(glb|gltf|obj)$/i)[0];
          
          if (modelFile) {
            const blob = await modelFile.async('blob');
            url = URL.createObjectURL(blob);
          } else {
            console.warn('No model file found in .skyc');
          }
        } catch (error) {
          console.error('Failed to extract .skyc file:', error);
        }
      }
      
      if (url) {
        dispatch(updateAppSettings('threeD', {
          customDroneModelUrl: url,
          droneModel: 'custom',
        }));
      }
    }
  };

  return (
    <Box>
      <FormControl fullWidth variant='filled'>
        <InputLabel id='sidebar-drone-model-label'>
          {t('settings.droneModel.label')}
        </InputLabel>
        <Select
          labelId='sidebar-drone-model-label'
          id='sidebar-drone-model'
          value={droneModel}
          onChange={(event) => {
            const type = event.target.value;
            if (isValidDroneModelType(type)) {
              dispatch(setDroneModel(type));
            }
          }}
        >
          <MenuItem value='sphere'>{t('settings.droneModel.sphere')}</MenuItem>
          <MenuItem value='quad'>{t('settings.droneModel.quad')}</MenuItem>
          <MenuItem value='flapper'>{t('settings.droneModel.flapper')}</MenuItem>
          <MenuItem value='custom'>Custom File (GLB/GLTF/SKYC)</MenuItem>
        </Select>
      </FormControl>

      <input
        type="file"
        accept=".glb,.gltf,.skyc"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileUpload}
      />

      {droneModel === 'custom' && (
        <Box sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            size="small"
            fullWidth
            onClick={() => fileInputRef.current?.click()}
          >
            {customDroneModelUrl ? 'Change Drone File' : 'Upload Drone File'}
          </Button>
          {customDroneModelUrl && (
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center', opacity: 0.7 }}>
              Custom model loaded
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default DroneModelSelector;
