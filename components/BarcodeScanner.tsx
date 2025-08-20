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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // Check camera availability
  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability()
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
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
    if (!hasCamera) {
      setScanError("No camera available.")
      return
    }

    try {
      setScanError("")
      setIsScanning(true)

      const constraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
        
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
    setIsScanning(false)
    setScanSuccess(false)
  }, [stream])

  // Simple barcode detection using canvas and basic pattern recognition
  const startBarcodeDetection = () => {
    const detectBarcode = () => {
      if (!videoRef.current || !canvasRef.current || !isScanning) {
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(detectBarcode)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      // For now, we'll use a simplified approach
      // In a real implementation, you'd use a proper barcode detection library
      // or implement ZXing-js which is more reliable than QuaggaJS
      
      // Simulate barcode detection for demo purposes
      // You can replace this with actual barcode detection logic
      setTimeout(() => {
        if (isScanning) {
          animationFrameRef.current = requestAnimationFrame(detectBarcode)
        }
      }, 100)
    }

    detectBarcode()
  }

  const handleScannedCode = (code: string) => {
    const now = Date.now()
    if (now - lastScanTime < 2000) return // Prevent duplicate scans
    
    setLastScanTime(now)
    stopCamera()
    setScanSuccess(true)
    setScannedCode(code)
    
    const existingItem = existingItems.find(item => item.sku === code)
    
    if (existingItem) {
      const shouldRestock = confirm(`Item "${existingItem.name}" (SKU: ${code}) already exists. Would you like to restock it?`)
      if (shouldRestock) {
        handleClose()
        onScanResult(code)
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
    stopCamera()
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

  // Simulate successful scan (for testing purposes)
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
          
          {hasCamera === null && (
            <div className="text-center space-y-3">
              <Loader className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm text-gray-500">Checking camera availability...</p>
            </div>
          )}

          {hasCamera === false && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-gray-600">
                Camera access is not available. You can still enter SKUs manually below.
              </p>
            </div>
          )}
          
          {hasCamera && !isScanning && (
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
                
                {/* Test button for development */}
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

                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                  {scanSuccess ? 'Scan Complete!' : 'Position barcode in frame'}
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
      </DialogContent>
    </Dialog>
  )
}

export default BarcodeScanner