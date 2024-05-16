// Alert box with success, info, warning or error message
import { Alert, Box, Fade } from '@mui/material';
import { AlertBoxI } from './AlertBox.types';
import { useCallback, useState } from 'react';

const TEN_SECONDS = 10000;
export const AlertBox = ({
  severity,
  message
}: AlertBoxI) => {
  const [show, setShow] = useState(true);

  const onCloseAlert = useCallback(() => {
    setShow(false);
  }, [setShow]);

  const autoCloseAlert = useCallback(() => {
    setTimeout(() => {
      setShow(false);
    }, TEN_SECONDS);
  }, [setShow]);

  return (
    <Fade
      in={show}
      timeout={{ enter: 200, exit: 1000 }}
      addEndListener={autoCloseAlert}
    >
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        minWidth="100vw"
        position="absolute"
        zIndex={Number.MAX_SAFE_INTEGER}
        sx={{
          backgroundColor: "rgba(0,0,0,0.5)"
        }}
      >
        <Alert
          sx={{
            maxWidth: "350px"
          }}
          onClose={onCloseAlert}
          severity={severity}>
          {message}
        </Alert>
      </Box>
    </Fade>
  );
};