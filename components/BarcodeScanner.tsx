/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react"
import { QrCode, X, Check, Loader, Camera, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import ZXing-js components
declare global {
  interface Window {
    ZXing: {
      BrowserMultiFormatReader: new () => {
        decodeFromVideoDevice: (
          deviceId: string | undefined, 
          videoElement: HTMLVideoElement, 
          callback: (result: ZXingResult | null, error: ZXingError | null) => void
        ) => void;
        decodeFromCanvas: (canvas: HTMLCanvasElement) => Promise<ZXingResult>;
        reset: () => void;
      };
      NotFoundException: new () => ZXingError;
    };
  }
}

// ZXing type definitions
interface ZXingResult {
  getText(): string;
  getBarcodeFormat(): string;
}

interface ZXingError {
  name: string;
  message: string;
}

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanResult: (code: string) => void
  existingItems?: Array<{ _id: string; name: string; sku: string }>
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  isOpen,
  onClose,
  onScanResult,
  existingItems = []
}) => {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedCode, setScannedCode] = useState("")
  const [scanError, setScanError] = useState("")
  const [scanSuccess, setScanSuccess] = useState(false)
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [lastScanTime, setLastScanTime] = useState(0)
  const [isZXingLoaded, setIsZXingLoaded] = useState(false)
  const [scanAttempts, setScanAttempts] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const codeReaderRef = useRef<any>(null)
  const scanIntervalRef = useRef<NodeJS.Timeout>()

  // Load ZXing-js library
  useEffect(() => {
    const loadZXing = async () => {
      if (window.ZXing) {
        setIsZXingLoaded(true)
        return
      }

      try {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/@zxing/library@latest/umd/index.min.js'
        script.onload = () => {
          // Give a small delay to ensure the library is fully loaded
          setTimeout(() => {
            if (window.ZXing) {
              setIsZXingLoaded(true)
            } else {
              setScanError("Barcode scanning library failed to initialize.")
            }
          }, 100)
        }
        script.onerror = () => {
          setScanError("Failed to load barcode scanning library. Please check your internet connection.")
        }
        document.head.appendChild(script)

        return () => {
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
        }
      } catch (error) {
        console.error('Error loading ZXing:', error)
        setScanError("Failed to load barcode scanning library.")
      }
    }

    if (isOpen) {
      loadZXing()
    }
  }, [isOpen])

  // Check camera availability
  useEffect(() => {
    if (isOpen && isZXingLoaded) {
      checkCameraAvailability()
    }
  }, [isOpen, isZXingLoaded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
      } catch (error) {
        console.log('Error resetting code reader:', error)
      }
    }
    stopCamera()
  }, [])

  const checkCameraAvailability = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false)
        setScanError("Camera access is not supported in this browser.")
        return
      }

      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      setHasCamera(videoDevices.length > 0)
      
      if (videoDevices.length === 0) {
        setScanError("No camera devices found.")
      }
    } catch (error) {
      console.error('Error checking camera availability:', error)
      setHasCamera(false)
      setScanError("Unable to access camera devices.")
    }
  }

  const startCamera = async () => {
    if (!hasCamera || !isZXingLoaded) {
      setScanError("Camera or barcode library not available.")
      return
    }

    try {
      setScanError("")
      setIsScanning(true)
      setScanAttempts(0)

      const constraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          startBarcodeDetection()
        }
      }
    } catch (error) {
      console.error('Error starting camera:', error)
      setScanError("Failed to access camera. Please grant camera permissions and try again.")
      setIsScanning(false)
    }
  }

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }
    if (codeReaderRef.current) {
      try {
        codeReaderRef.current.reset()
      } catch (error) {
        console.log('Error resetting code reader:', error)
      }
    }
    setIsScanning(false)
    setScanSuccess(false)
    setScanAttempts(0)
  }, [stream])

  const startBarcodeDetection = () => {
    if (!window.ZXing || !videoRef.current || !canvasRef.current) {
      console.error('ZXing library or video elements not ready')
      return
    }

    try {
      // Initialize ZXing BrowserMultiFormatReader
      const codeReader = new window.ZXing.BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      // Use ZXing's built-in continuous decode method
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: ZXingResult | null, error: ZXingError | null) => {
        if (result) {
          const code = result.getText()
          if (code && code.length > 0) {
            handleScannedCode(code)
            return
          }
        }
        
        if (error && !(error instanceof window.ZXing.NotFoundException)) {
          console.error('Barcode scanning error:', error)
        }

        // Update scan attempts counter (throttled)
        setScanAttempts(prev => prev + 1)
      })

    } catch (error) {
      console.error('Error initializing barcode scanner:', error)
      setScanError("Failed to initialize barcode scanner.")
      
      // Fallback to manual canvas-based scanning
      startManualBarcodeDetection()
    }
  }

  // Fallback manual detection method
  const startManualBarcodeDetection = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    const ctx = canvas?.getContext('2d')

    if (!ctx || !video || !canvas) return

    const scanLoop = () => {
      if (!isScanning || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(scanLoop)
        return
      }

      try {
        // Set canvas size to video size
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Try to decode using ZXing
        try {
          const codeReader = new window.ZXing.BrowserMultiFormatReader()
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Convert ImageData to HTMLCanvasElement for ZXing
          const tempCanvas = document.createElement('canvas')
          tempCanvas.width = imageData.width
          tempCanvas.height = imageData.height
          const tempCtx = tempCanvas.getContext('2d')
          if (tempCtx) {
            tempCtx.putImageData(imageData, 0, 0)
            
            codeReader.decodeFromCanvas(tempCanvas)
              .then((result: ZXingResult) => {
                if (result) {
                  const code = result.getText()
                  if (code && code.length > 0) {
                    handleScannedCode(code)
                    return
                  }
                }
              })
              .catch((error: ZXingError) => {
                // No barcode found in this frame
              })
          }
        } catch (decodeError) {
          // No barcode found in this frame, continue scanning
        }

        // Update scan attempts counter
        setScanAttempts(prev => prev + 1)

        // Continue scanning
        if (isScanning) {
          setTimeout(() => {
            animationFrameRef.current = requestAnimationFrame(scanLoop)
          }, 100) // Throttle to reduce CPU usage
        }

      } catch (error) {
        console.error('Error during barcode detection:', error)
        if (isScanning) {
          animationFrameRef.current = requestAnimationFrame(scanLoop)
        }
      }
    }

    scanLoop()
  }

  const handleScannedCode = (code: string) => {
    const now = Date.now()
    if (now - lastScanTime < 2000) return // Prevent duplicate scans
    
    setLastScanTime(now)
    stopCamera()
    setScanSuccess(true)
    setScannedCode(code)
    
    const existingItem = existingItems.find(item => 
      item.sku.toLowerCase() === code.toLowerCase()
    )
    
    if (existingItem) {
      const shouldRestock = window.confirm(
        `Item "${existingItem.name}" (SKU: ${code}) already exists. Would you like to restock it?`
      )
      if (shouldRestock) {
        setTimeout(() => {
          handleClose()
          onScanResult(code)
        }, 1000)
        return
      } else {
        // Reset scanner state if user doesn't want to restock
        setScanSuccess(false)
        setScannedCode("")
        return
      }
    }
    
    setTimeout(() => {
      handleClose()
      onScanResult(code)
    }, 1500)
  }

  const handleClose = () => {
    cleanup()
    setScannedCode("")
    setScanError("")
    setScanSuccess(false)
    onClose()
  }

  const handleManualSubmit = () => {
    if (scannedCode.trim()) {
      handleScannedCode(scannedCode.trim().toUpperCase())
    }
  }

  // Simulate successful scan (for testing purposes - remove in production)
  const simulateScan = () => {
    const testSku = `TEST${Math.floor(Math.random() * 10000)}`
    handleScannedCode(testSku)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode Scanner
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {scanError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {scanError}
              </AlertDescription>
            </Alert>
          )}

          {scanSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-700">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Successfully scanned: {scannedCode}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {(hasCamera === null || !isZXingLoaded) && (
            <div className="text-center space-y-3">
              <Loader className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm text-gray-500">
                {!isZXingLoaded ? 'Loading barcode scanner...' : 'Checking camera availability...'}
              </p>
            </div>
          )}

          {hasCamera === false && isZXingLoaded && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-gray-600">
                Camera access is not available. You can still enter SKUs manually below.
              </p>
            </div>
          )}
          
          {hasCamera && isZXingLoaded && !isScanning && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                <Camera className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="text-gray-600">
                Use your camera to scan a barcode or QR code to automatically detect the SKU.
              </p>
              
              <div className="space-y-2">
                <Button onClick={startCamera} className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
                
                {/* Test button for development - remove in production */}
                <Button 
                  variant="outline" 
                  onClick={simulateScan}
                  className="w-full text-sm"
                >
                  Simulate Scan (Test)
                </Button>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video 
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />
                
                <canvas 
                  ref={canvasRef}
                  className="hidden"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-white border-dashed rounded-lg opacity-70">
                    <div className="w-full h-full relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-red-400"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-red-400"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-red-400"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-red-400"></div>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                  {scanSuccess ? 'Scan Complete!' : `Scanning... (${scanAttempts} attempts)`}
                </div>

                {/* Scanning line animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 overflow-hidden">
                    <div className="w-full h-0.5 bg-red-500 animate-pulse" 
                         style={{
                           animation: 'scanLine 2s linear infinite',
                           transform: 'translateY(0)'
                         }}>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={stopCamera}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Stop Scanner
                </Button>
                <Button 
                  onClick={simulateScan}
                  variant="secondary"
                  className="px-3"
                  title="Simulate successful scan"
                >
                  Test
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Point camera at barcode or QR code
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Supports: UPC, EAN, Code 128, Code 39, QR codes
                </p>
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {!scanSuccess && (
            <div className="border-t pt-4">
              <Label htmlFor="manualSku">Enter SKU manually:</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="manualSku"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                  placeholder="Enter SKU manually"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit()
                    }
                  }}
                />
                <Button 
                  onClick={handleManualSubmit}
                  disabled={!scannedCode.trim()}
                  size="sm"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {scanSuccess ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>

        {/* Add CSS for scan line animation */}
        <style jsx>{`
          @keyframes scanLine {
            0% { transform: translateY(0); }
            100% { transform: translateY(128px); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

export default BarcodeScanner