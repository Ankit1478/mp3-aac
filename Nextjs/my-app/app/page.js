'use client'
import React, { useState, useRef, useEffect } from 'react';
import { Howl } from 'howler';

export default function Home() {
  const [file, setFile] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setConversionResult(null);
    setError(null);
    setIsPlaying(false);
    setProgress(0);
    if (soundRef.current) {
      soundRef.current.unload();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Please upload an MP3 file.');
      return;
    }
    const formData = new FormData();
    formData.append('mp3File', file);
    try {
      const response = await fetch('http://localhost:8080/convert', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        setConversionResult(result.downloadUrl);
        initializeHowl(result.downloadUrl);
      } else {
        setError(result.error || 'Error during conversion. Please try again.');
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      setError('Error during conversion. Please try again.');
    }
  };

  const initializeHowl = (url) => {
    soundRef.current = new Howl({
      src: [url],
      format: ['aac'],
      html5: true,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => {
        setIsPlaying(false);
        setProgress(0);
      },
      onend: () => {
        setIsPlaying(false);
        setProgress(0);
      },
    });
  };

  const togglePlayPause = () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const stopAudio = () => {
    if (!soundRef.current) return;
    soundRef.current.stop();
  };

  useEffect(() => {
    const updateProgress = () => {
      if (soundRef.current && isPlaying) {
        const seek = soundRef.current.seek();
        const duration = soundRef.current.duration();
        setProgress((seek / duration) * 100);
        requestAnimationFrame(updateProgress);
      }
    };
    if (isPlaying) {
      updateProgress();
    }
  }, [isPlaying]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-300 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-md">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MP3 to AAC Converter
          </h1>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="file-upload" className="sr-only">
                Choose MP3 file
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".mp3"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Convert to AAC
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-2 text-center text-sm text-red-600">{error}</p>
        )}

        {conversionResult && (
          <div className="mt-8 space-y-4">
            <p className="text-center text-sm text-gray-600">
              Conversion successful!{' '}
              <a
                href={conversionResult}
                download
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Download AAC file
              </a>
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={stopAudio}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Stop
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}