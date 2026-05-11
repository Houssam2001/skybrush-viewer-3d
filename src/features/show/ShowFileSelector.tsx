import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import Button from '@mui/material/Button';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import { Buffer } from 'buffer';

import { useAppDispatch } from '~/hooks/store';
import { loadShowFromBuffer } from '~/features/show/actions';

/**
 * Component for selecting and loading a new show file (.skyc).
 */
const ShowFileSelector = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        if (arrayBuffer) {
          const buffer = Buffer.from(arrayBuffer);
          dispatch(loadShowFromBuffer(buffer));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        variant='contained'
        color='primary'
        startIcon={<FileUploadIcon />}
        onClick={handleClick}
        fullWidth
      >
        Load New Show (.skyc)
      </Button>
      <input
        type="file"
        accept=".skyc"
        style={{ display: 'none' }}
        ref={fileInputRef}
        onChange={handleFileUpload}
      />
    </>
  );
};

export default ShowFileSelector;
