"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  audioUrl: string;
  title: string;
  autoFade?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
}

export function AudioPlayer({
  audioUrl,
  title,
  autoFade = true,
  autoPlay = false,
  loop = true,
  showControls = true,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.loop = loop;

    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoaded(true);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      if (!loop) {
        setIsPlaying(false);
        setCurrentTime(0);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      }
    };

    const handleError = () => {
      setIsLoading(false);
      setIsLoaded(false);
      console.error("Error loading audio file");
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    // Set initial volume
    audio.volume = volume;

    // Auto-play with fade-in if enabled
    if (autoPlay) {
      if (autoFade) {
        audio.volume = 0;
        setVolume(0);

        const fadeIn = () => {
          if (audio.volume < 0.7) {
            audio.volume += 0.01;
            setVolume(audio.volume);
            setTimeout(fadeIn, 50);
          }
        };

        setTimeout(() => {
          audio
            .play()
            .then(() => {
              setIsPlaying(true);
              fadeIn();
            })
            .catch((err) => console.error("Error auto-playing audio:", err));
        }, 1000);
      } else {
        setTimeout(() => {
          audio
            .play()
            .then(() => setIsPlaying(true))
            .catch((err) => console.error("Error auto-playing audio:", err));
        }, 500);
      }
    }

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioUrl, autoFade, autoPlay, loop, volume]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    } else {
      audioRef.current
        .play()
        .then(() => {
          animationRef.current = requestAnimationFrame(whilePlaying);
        })
        .catch((err) => console.error("Error playing audio:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const whilePlaying = () => {
    if (!audioRef.current) return;

    setCurrentTime(audioRef.current.currentTime);
    animationRef.current = requestAnimationFrame(whilePlaying);
  };

  const changeRange = (value: number[]) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const changeVolume = (value: number[]) => {
    if (!audioRef.current) return;

    const newVolume = value[0];
    setVolume(newVolume);
    audioRef.current.volume = newVolume;

    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;

    if (isMuted) {
      audioRef.current.volume = volume || 0.7;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(
      0,
      audioRef.current.currentTime - 10
    );
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(
      duration,
      audioRef.current.currentTime + 10
    );
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-md p-3 shadow-sm border flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading music...</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full bg-red-50 rounded-md p-3 shadow-sm border flex items-center justify-center">
        <p className="text-sm text-red-600">Failed to load audio file</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-md p-3 shadow-sm border">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {showControls && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={skipBackward}
                aria-label="Skip backward 10 seconds"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          {showControls && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={skipForward}
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="text-sm font-medium truncate">{title}</div>
          <div className="flex items-center space-x-2">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.01}
              onValueChange={changeRange}
              className="flex-1"
              aria-label="Seek time"
            />
            <span className="text-xs text-gray-500 w-16 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={changeVolume}
            className="w-20"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
