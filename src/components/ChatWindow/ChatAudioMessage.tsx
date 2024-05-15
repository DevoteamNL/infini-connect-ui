import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  IconButton,
  Tooltip
} from "@mui/material";
import MicIcon from '@mui/icons-material/Mic';
import MicOffOutlinedIcon from '@mui/icons-material/MicOffOutlined';

// browser permission to use the microphone
enum Permission {
  UNCHECKED = "unchecked",
  HAS_PERMISSION = "has permission",
  DOES_NOT_HAVE_PERMISSION = "doesn't have permission"
};

// Component responsible for sending a voice stream to the server
// to then be sent to the OpenAI API
export const ChatAudioMessage = ({
  isRecordingVoiceMessage,
  setRecordingVoiceMessage
}: {
  isRecordingVoiceMessage: boolean;
  setRecordingVoiceMessage: Dispatch<SetStateAction<boolean>>;
}) => {
  const [permission, setHasPermission] = useState(Permission.UNCHECKED);

  useEffect(() => {
    if (permission === Permission.UNCHECKED) {
      try {
        const checkPermission = async () => {
          const streamData = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });
          setHasPermission(streamData
            ? Permission.HAS_PERMISSION
            : Permission.DOES_NOT_HAVE_PERMISSION
          );
        };
        checkPermission();
      } catch (err) {
        console.error(err);
        setHasPermission(Permission.DOES_NOT_HAVE_PERMISSION);
      }
    }
  }, [permission, navigator, setHasPermission]);

  const voiceMessageStyle = {
    "&:hover": {
      color: "secondary.main",
      backgroundColor: "transparent",
    }
  };

  const handleVoiceMessageButtonOnClick = useCallback(() => {
    if (isRecordingVoiceMessage) {
      setRecordingVoiceMessage(false);
    } else {
      setRecordingVoiceMessage(true);
    }
  }, [isRecordingVoiceMessage, setRecordingVoiceMessage]);


  return (
    permission
      ? (
        <Tooltip title={
          isRecordingVoiceMessage
            ? "Stop voice message"
            : "Send voice message"
        } >
          <IconButton
            disableRipple
            sx={voiceMessageStyle}
            onClick={handleVoiceMessageButtonOnClick}
          >
            {isRecordingVoiceMessage
              ? <MicOffOutlinedIcon />
              : <MicIcon />
            }

          </IconButton>
        </Tooltip >
      )
      : (
        <Tooltip title="The MediaRecorder API is not supported in your browser." >
          <IconButton
            sx={{
              color: "#999",
              "&:hover": {
                backgroundColor: "transparent",
              }
            }}
          >
            <MicIcon />
          </IconButton>
        </Tooltip >
      )
  );
};