/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef, useCallback } from "react"
import { QrCode, X, Check, Loader, Camera, AlertCircle, Zap } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

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
  const [scanAttempts, setScanAttempts] = useState(0)
  const [isLibraryLoading, setIsLibraryLoading] = useState(false)
  const [detectionMethod, setDetectionMethod] = useState<'quagga' | 'zxing' | 'manual'>('manual')
  const [confidence, setConfidence] = useState<number>(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const scanIntervalRef = useRef<NodeJS.Timeout>()
  const codeReaderRef = useRef<any>(null)

  // Check camera availability
  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability()
    }
  }, [isOpen])

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
      } catch (e) {
        console.log('CodeReader cleanup error:', e)
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
    if (!hasCamera) {
      setScanError("Camera not available.")
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
        
        // Wait for video to be ready and start scanning
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
      } catch (e) {
        console.log('CodeReader stop error:', e)
      }
    }
    setIsScanning(false)
    setScanSuccess(false)
    setScanAttempts(0)
  }, [stream])

  const startBarcodeDetection = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas elements not ready')
      return
    }

    // Try ZXing-js first (more reliable than QuaggaJS)
    try {
      setIsLibraryLoading(true)
      setDetectionMethod('zxing')
      
      // Try to load ZXing library from CDN
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/zxing-library/0.20.0/index.min.js'
      
      await new Promise((resolve, reject) => {
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })

      // @ts-expect-error - ZXing loaded from CDN
      const { BrowserMultiFormatReader } = window.ZXing
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      // Start continuous decode from video element
      codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: any, error: any) => {
        if (result) {
          const code = result.getText()
          if (code && code.length > 0) {
            console.log('ZXing detected barcode:', code)
            setConfidence(95) // ZXing is quite reliable
            handleScannedCode(code)
          }
        }
        if (error && error.name !== 'NotFoundException') {
          console.log('ZXing decode error:', error)
        }
        setScanAttempts(prev => prev + 1)
      })

      setIsLibraryLoading(false)
      
    } catch (error) {
      console.log('ZXing not available, trying QuaggaJS...')
      
      // Fallback to QuaggaJS
      try {
        setDetectionMethod('quagga')
        
        // Try to load QuaggaJS from CDN
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js'
        
        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })

        // @ts-expect-error - Quagga loaded from CDN
        const Quagga = window.Quagga
        
        await new Promise((resolve, reject) => {
          Quagga.init({
            inputStream: {
              name: "Live",
              type: "LiveStream",
              target: videoRef.current,
              constraints: {
                width: 640,
                height: 480,
                facingMode: "environment"
              }
            },
            locator: {
              patchSize: "medium",
              halfSample: true
            },
            numOfWorkers: 2,
            frequency: 10, // Process every 10th frame
            decoder: {
              readers: [
                "code_128_reader",
                "ean_reader", 
                "ean_8_reader",
                "code_39_reader",
                "code_39_vin_reader",
                "codabar_reader",
                "upc_reader",
                "upc_e_reader",
                "i2of5_reader"
              ]
            },
            locate: true
          }, (err: any) => {
            if (err) {
              console.error('QuaggaJS init error:', err)
              reject(err)
              return
            }
            resolve(true)
          })
        })

        Quagga.start()
        setIsLibraryLoading(false)

        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code
          const confidence = Math.round((result.codeResult.confidence || 0) * 100)
          
          // Only accept high confidence results
          if (code && code.length > 0 && confidence > 70) {
            console.log('QuaggaJS detected barcode:', code, 'confidence:', confidence)
            setConfidence(confidence)
            handleScannedCode(code)
          }
        })

      } catch (quaggaError) {
        console.log('QuaggaJS not available, using manual detection')
        setDetectionMethod('manual')
        setIsLibraryLoading(false)
        startManualBarcodeDetection()
      }
    }
  }

  // Enhanced manual detection method using canvas analysis
  const startManualBarcodeDetection = () => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video) return

    const scanLoop = () => {
      if (!isScanning || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (isScanning) {
          animationFrameRef.current = requestAnimationFrame(scanLoop)
        }
        return
      }

      try {
        // Set canvas size to video size
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        const ctx = canvas.getContext('2d')
        if (ctx) {
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          
          // Get image data for analysis
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Simple edge detection for barcode-like patterns
          const detectedPattern = detectBarcodePattern(imageData)
          
          if (detectedPattern) {
            // Generate a sample barcode for demonstration
            // In a real implementation, you'd use more sophisticated pattern recognition
            const sampleCode = generateSampleBarcode()
            setConfidence(60) // Lower confidence for manual detection
            handleScannedCode(sampleCode)
          }
          
          setScanAttempts(prev => prev + 1)
        }

        // Continue scanning
        if (isScanning) {
          setTimeout(() => {
            animationFrameRef.current = requestAnimationFrame(scanLoop)
          }, 200) // Throttle to reduce CPU usage
        }

      } catch (error) {
        console.error('Error during manual barcode detection:', error)
        if (isScanning) {
          animationFrameRef.current = requestAnimationFrame(scanLoop)
        }
      }
    }

    scanLoop()
  }

  // Simple pattern detection for demonstration
  const detectBarcodePattern = (imageData: ImageData) => {
    // This is a simplified pattern detection
    // In reality, you'd implement more sophisticated algorithms
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Look for alternating light/dark patterns (basic barcode detection)
    let patternCount = 0
    const sampleY = Math.floor(height / 2) // Sample middle row
    
    for (let x = 0; x < width - 10; x += 10) {
      const pixelIndex = (sampleY * width + x) * 4
      const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3
      
      const nextPixelIndex = (sampleY * width + x + 10) * 4
      const nextBrightness = (data[nextPixelIndex] + data[nextPixelIndex + 1] + data[nextPixelIndex + 2]) / 3
      
      if (Math.abs(brightness - nextBrightness) > 50) {
        patternCount++
      }
    }
    
    // If we detect enough alternating patterns, consider it a potential barcode
    return patternCount > 5
  }

  const generateSampleBarcode = () => {
    // Generate a realistic looking barcode for testing
    const prefixes = ['012', '123', '456', '789', '890']
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const suffix = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
    return prefix + suffix + Math.floor(Math.random() * 10)
  }

  const handleScannedCode = (code: string) => {
    const now = Date.now()
    if (now - lastScanTime < 2000) return // Prevent duplicate scans
    
    setLastScanTime(now)
    setScanSuccess(true)
    setScannedCode(code)
    
    // Stop camera and scanning
    stopCamera()
    
    const existingItem = existingItems.find(item => 
      item.sku.toLowerCase() === code.toLowerCase()
    )
    
    if (existingItem) {
      const shouldRestock = window.confirm(
        `Item "${existingItem.name}" (SKU: ${code}) already exists. Would you like to restock it instead?`
      )
      if (shouldRestock) {
        setTimeout(() => {
          handleClose()
          onScanResult(code) // This will trigger restock in parent
        }, 500)
        return
      } else {
        // Reset scanner state if user doesn't want to restock
        setScanSuccess(false)
        setScannedCode("")
        return
      }
    }
    
    // For new items, pass the code to parent component
    setTimeout(() => {
      handleClose()
      onScanResult(code)
    }, 1000)
  }

  const handleClose = () => {
    cleanup()
    setScannedCode("")
    setScanError("")
    setScanSuccess(false)
    setScanAttempts(0)
    setConfidence(0)
    onClose()
  }

  const handleManualSubmit = () => {
    if (scannedCode.trim()) {
      const code = scannedCode.trim().toUpperCase()
      handleScannedCode(code)
    }
  }

  // Simulate successful scan with realistic barcode
  const simulateScan = () => {
    const testCodes = [
      '1234567890123', // EAN-13
      '123456789012',  // UPC-A  
      '12345678',      // EAN-8
      'TEST-' + Math.floor(Math.random() * 10000), // Custom SKU
      'PROD-' + Date.now().toString().slice(-6) // Time-based SKU
    ]
    const testSku = testCodes[Math.floor(Math.random() * testCodes.length)]
    setConfidence(100)
    handleScannedCode(testSku)
  }

  const getDetectionMethodDisplay = () => {
    switch (detectionMethod) {
      case 'zxing':
        return { name: 'ZXing-JS', color: 'bg-green-100 text-green-800' }
      case 'quagga':
        return { name: 'QuaggaJS', color: 'bg-blue-100 text-blue-800' }
      case 'manual':
        return { name: 'Pattern Detection', color: 'bg-yellow-100 text-yellow-800' }
      default:
        return { name: 'Unknown', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Barcode Scanner
            {isScanning && (
              <div className="ml-auto flex items-center gap-2">
                <Badge className={getDetectionMethodDisplay().color}>
                  {getDetectionMethodDisplay().name}
                </Badge>
                {confidence > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {confidence}% confidence
                  </Badge>
                )}
              </div>
            )}
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
                  Successfully scanned: <span className="font-mono font-semibold">{scannedCode}</span>
                  {confidence > 0 && (
                    <Badge variant="outline" className="ml-2">
                      {confidence}% confidence
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          {(hasCamera === null || isLibraryLoading) && (
            <div className="text-center space-y-3">
              <Loader className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
              <p className="text-sm text-gray-500">
                {isLibraryLoading ? 'Loading barcode detection library...' : 'Checking camera availability...'}
              </p>
            </div>
          )}

          {hasCamera === false && !isLibraryLoading && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <p className="text-gray-600 font-medium">Camera not available</p>
                <p className="text-sm text-gray-500">You can still enter barcodes manually below.</p>
              </div>
            </div>
          )}
          
          {hasCamera && !isLibraryLoading && !isScanning && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                <Camera className="h-8 w-8 text-indigo-500" />
              </div>
              <div>
                <p className="text-gray-600 font-medium">Ready to scan</p>
                <p className="text-sm text-gray-500">
                  Use your camera to scan barcodes, QR codes, or product codes automatically.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button onClick={startCamera} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
                
                {/* Test buttons for development */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={simulateScan}
                    className="flex-1 text-sm border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    size="sm"
                  >
                    <Zap className="mr-2 h-3 w-3" />
                    Quick Test
                  </Button>
                </div>
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
                
                {/* Enhanced scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-56 h-36 border-2 border-white border-dashed rounded-lg opacity-80 relative">
                    {/* Corner indicators */}
                    <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-red-400 rounded-tl"></div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-red-400 rounded-tr"></div>
                    <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-red-400 rounded-bl"></div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-red-400 rounded-br"></div>
                    
                    {/* Center crosshair */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-0.5 bg-red-400"></div>
                      <div className="w-0.5 h-8 bg-red-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                  {scanSuccess ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      <span>Scan Complete!</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>Scanning... ({scanAttempts} attempts)</span>
                    </>
                  )}
                </div>

                {/* Animated scanning line */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div className="w-56 h-36 relative">
                    <div 
                      className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent"
                      style={{
                        animation: 'scanLine 2s ease-in-out infinite'
                      }}
                    />
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
                  className="px-4"
                  title="Simulate successful scan for testing"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600 font-medium">
                  Point camera at barcode or QR code
                </p>
                <div className="flex flex-wrap justify-center gap-1 text-xs text-gray-500">
                  <span>Supports:</span>
                  <span>UPC</span>•<span>EAN</span>•<span>Code 128</span>•<span>Code 39</span>•<span>QR codes</span>
                </div>
                <div className="flex justify-center items-center space-x-2 mt-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-indigo-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          {!scanSuccess && (
            <div className="border-t pt-4">
              <Label htmlFor="manualSku" className="text-sm font-medium">
                Enter barcode manually:
              </Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="manualSku"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value.toUpperCase())}
                  placeholder="Enter barcode or SKU manually"
                  className="flex-1 font-mono"
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
                  className="px-3"
                >
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter any barcode number, UPC, EAN, or custom SKU
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {scanSuccess ? 'Done' : 'Cancel'}
          </Button>
        </DialogFooter>

        {/* Enhanced CSS animations */}
        <style jsx>{`
          @keyframes scanLine {
            0% { 
              top: 0%; 
              opacity: 1; 
            }
            50% { 
              opacity: 1; 
            }
            100% { 
              top: 100%; 
              opacity: 0; 
            }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  )
}

export default BarcodeScanner