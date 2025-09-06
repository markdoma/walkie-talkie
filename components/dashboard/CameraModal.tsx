import React, { useRef, useState, useEffect } from 'react';

interface CameraModalProps {
    onConfirm: (imageDataUrl: string) => void;
    onClose: () => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ onConfirm, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please check permissions.");
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTakePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // Flip the image horizontally for a mirror effect
                context.translate(video.videoWidth, 0);
                context.scale(-1, 1);
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const imageDataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageDataUrl);
            }
        }
    };
    
    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onConfirm(capturedImage);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md m-4 transform transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-text-main">Clock-In Selfie</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {error && <div className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</div>}

                <div className="relative w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {capturedImage ? (
                        <img src={capturedImage} alt="Selfie preview" className="w-full h-full object-cover" />
                    ) : (
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform -scale-x-100"></video>
                    )}
                    <canvas ref={canvasRef} className="hidden"></canvas>
                </div>

                <div className="mt-6 flex flex-col space-y-3">
                    {capturedImage ? (
                        <>
                            <button onClick={handleConfirm} className="w-full py-3 px-6 text-lg font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors duration-200">
                                Confirm & Clock In
                            </button>
                             <button onClick={handleRetake} className="w-full py-3 px-6 text-lg font-semibold text-text-secondary bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200">
                                Retake Photo
                            </button>
                        </>
                    ) : (
                        <button onClick={handleTakePhoto} disabled={!!error} className="w-full py-3 px-6 text-lg font-semibold text-white bg-secondary rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                            Take Photo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraModal;
