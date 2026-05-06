import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DraggableDialog } from '@skybrush/mui-components';

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  googleApiKey: string;
  initialLat?: number;
  initialLng?: number;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  open,
  onClose,
  onConfirm,
  googleApiKey,
  initialLat = 47.497912,
  initialLng = 19.040235,
}) => {
  const [selectedPos, setSelectedPos] = useState({ lat: initialLat, lng: initialLng });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleApiKey,
    libraries,
  });

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSelectedPos({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  }, []);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setSelectedPos({ lat, lng });
        map?.panTo({ lat, lng });
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedPos.lat, selectedPos.lng);
    onClose();
  };

  return (
    <DraggableDialog open={open} onClose={onClose} title="Select Location from Google Maps" maxWidth="md" fullWidth>
      <DialogContent>
        {isLoaded ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Autocomplete
              onLoad={(ref) => (autocompleteRef.current = ref)}
              onPlaceChanged={onPlaceChanged}
            >
              <TextField
                fullWidth
                placeholder="Search for a location..."
                size="small"
                variant="outlined"
              />
            </Autocomplete>

            <GoogleMap
              mapContainerStyle={containerStyle}
              center={selectedPos}
              zoom={15}
              onClick={onMapClick}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                mapTypeId: 'satellite',
                tilt: 0,
              }}
            >
              <Marker position={selectedPos} draggable onDragEnd={(e) => e.latLng && setSelectedPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })} />
            </GoogleMap>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Typography variant="body2">
                <strong>Lat:</strong> {selectedPos.lat.toFixed(6)}
              </Typography>
              <Typography variant="body2">
                <strong>Long:</strong> {selectedPos.lng.toFixed(6)}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Click on the map or drag the marker to select the exact center point for your 3D environment.
            </Typography>
          </Box>
        ) : (
          <Typography>Loading Google Maps...</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" color="primary" disabled={!isLoaded}>
          Confirm Selection
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

export default LocationPickerModal;
