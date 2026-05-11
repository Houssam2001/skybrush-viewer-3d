import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '80%',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
};

type LocationPickerModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  googleApiKey: string;
  initialLat: number;
  initialLng: number;
};

const LocationPickerModal = ({
  open,
  onClose,
  onConfirm,
  googleApiKey,
  initialLat,
  initialLng,
}: LocationPickerModalProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey,
  });

  const [markerPos, setMarkerPos] = useState({ lat: initialLat, lng: initialLng });
  const [map, setMap] = React.useState<google.maps.Map | null>(null);

  const onMapClick = React.useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, []);

  const handleConfirm = () => {
    onConfirm(markerPos.lat, markerPos.lng);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Pick Show Location
        </Typography>
        
        <Box sx={{ flex: 1, minHeight: 0, mb: 2 }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={{ lat: initialLat, lng: initialLng }}
              zoom={15}
              onClick={onMapClick}
              onLoad={map => setMap(map)}
            >
              <Marker position={markerPos} draggable onDragEnd={(e) => {
                if (e.latLng) setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
              }} />
            </GoogleMap>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography>Loading Maps...</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirm}>
            Confirm Location
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default LocationPickerModal;
