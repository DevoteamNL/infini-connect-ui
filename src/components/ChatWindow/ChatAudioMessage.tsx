import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState
} from "react";
import {
  IconButton,
  Tooltip
} from "@mui/material";
import MicIcon from '@mui/icons-material/Mic';
import MicOffOutlinedIcon from '@mui/icons-material/MicOffOutlined';
import { AlertBoxI } from '../AlertBox/AlertBox.types';
import { useAuthContext } from '../../context/AuthContext';
import { Thread, useThreadContext } from '../../context/ThreadContext/ThreadContext';


// Component responsible for sending a voice stream to the server
// to then be sent to the OpenAI API
export const ChatAudioMessage = ({
  mediaRecorder,
  setMediaRecorder,
  selectedThread,
  plugin,
  alert,
  setAlert
}: {
  mediaRecorder?: MediaRecorder;
  setMediaRecorder: React.Dispatch<React.SetStateAction<MediaRecorder | undefined>>;
  selectedThread: Thread;
  plugin: string;
  alert: AlertBoxI | null;
  setAlert: React.Dispatch<React.SetStateAction<AlertBoxI | null>>;
}) => {
  // const { credential, checkExpired } = useAuthContext();
  const { postAudioMessage, threads, selectedThreadId } = useThreadContext();
  const [mimeType, setMimeType] = useState<{
    extension: string;
    type: string;
  }>();
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  useEffect(() => {
    if (!mimeType) {
      const audioMimeTypes = [
        {
          extension: "webm",
          type: "audio/webm"
        },
        {
          extension: "mp3",
          type: "audio/mpeg"
        },
        {
          extension: "mp4",
          type: "audio/mp4"
        },
        {
          extension: "ogg",
          type: "audio/ogg"
        }
      ];
      for (const mType of audioMimeTypes) {
        if (MediaRecorder.isTypeSupported(mType.type)) {
          setMimeType(mType);
          break;
        }
      }
    }
  }, [mimeType, setMimeType]);

  useEffect(() => {
    if (mimeType) {
      if (mediaRecorder) {
        const tempRecordedChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (ev: BlobEvent) => {
          if (ev.data.size > 0) {
            tempRecordedChunks.push(ev.data);
          }
        };
        mediaRecorder.onstop = () => {
          setRecordedChunks(tempRecordedChunks);
        };
        mediaRecorder.start();
      } else {
        if (recordedChunks && recordedChunks.length > 0) {
          const blob = new Blob(recordedChunks, {
            type: mimeType.type
          });
          postAudioMessage({
            audioBlob: blob,
            mimeType: mimeType,
            id: selectedThread.id,
            isNewThread: selectedThread.newThread,
            title: selectedThread.title,
            plugin
          });

          // TODO: delete when the feature is done
          // Test code to generate an audio file from the audio recorded
          // const url = URL.createObjectURL(blob);
          // const a = document.createElement('a');
          // document.body.appendChild(a);
          // a.style = 'display: none';
          // a.href = url;
          // a.download = `test.${mimeType.extension}`;
          // a.click();
          // window.URL.revokeObjectURL(url);


          // setMediaRecorder(undefined);
          setRecordedChunks([]);
        }

      }
    }
  }, [mediaRecorder, recordedChunks, setRecordedChunks, mimeType]);



  const handleVoiceMessageButtonOnClick = useCallback(async () => {
    try {
      if (mediaRecorder) {
        mediaRecorder.stop();
        setMediaRecorder(undefined);
      } else {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        setMediaRecorder(new MediaRecorder(audioStream, {
          mimeType: mimeType?.type,
          audioBitsPerSecond: 128000
        }));
      }
    } catch (err) {
      console.error(err);
      if (!alert) {
        setAlert({
          severity: "error",
          message: "Either the MediaRecorder API is not supported in your browser or you have the microphone disabled for this page"
        });
      }
    }
  }, [mediaRecorder, setMediaRecorder, mimeType]);

  return (
    <>
      <Tooltip title={
        mediaRecorder
          ? "End voice message"
          : "Send voice message"
      } >
        <IconButton
          disableRipple
          sx={{
            "&:hover": {
              color: "primary.main",
              backgroundColor: "transparent",
            }
          }}
          onClick={handleVoiceMessageButtonOnClick}
        >
          {mediaRecorder
            ? <MicOffOutlinedIcon />
            : <MicIcon />
          }

        </IconButton>
      </Tooltip >
    </>
  );
};