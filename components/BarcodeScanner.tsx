/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react"
import { QrCode, X, Check, Loader } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Import QuaggaJS for barcode scanning
declare global {
  interface Window {
    Quagga: any;
  }
}

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanResult: (code: string) => void
  existingItems?: Array<{ _id: string; name: string; sku: string }>
}

// Load QuaggaJS library from multiple CDN sources
const loadQuaggaJS = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Quagga) {
      resolve();
      return;
    }
    
    // Try multiple CDN sources
    const cdnSources = [
      'https://cdnjs.cloudflare.com/ajax/libs/quagga/0.12.1/quagga.min.js',
      'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js',
      'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js'
    ];
    
    let currentIndex = 0;
    
    const tryLoadScript = () => {
      if (currentIndex >= cdnSources.length) {
        reject(new Error('All CDN sources failed to load QuaggaJS'));
        return;
      }
      
      const script = document.createElement('script');
      script.src = cdnSources[currentIndex];
      script.async = true;
      
      script.onload = () => {
        // Wait a moment for the library to initialize
        setTimeout(() => {
          if (window.Quagga) {
            console.log(`QuaggaJS loaded successfully from: ${cdnSources[currentIndex]}`);
            resolve();
          } else {
            currentIndex++;
            tryLoadScript();
          }
        }, 100);
      };
      
      script.onerror = () => {
        console.warn(`Failed to load QuaggaJS from: ${cdnSources[currentIndex]}`);
        currentIndex++;
        tryLoadScript();
      };
      
      // Remove any existing script tags first
      const existingScript = document.querySelector('script[src*="quagga"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      document.head.appendChild(script);
    };
    
    tryLoadScript();
  });
};

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
  const [quaggaLoaded, setQuaggaLoaded] = useState(false)
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null)
  
  const scannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Load QuaggaJS with better error handling
      console.log('Loading barcode scanner library...');
      loadQuaggaJS()
        .then(() => {
          console.log('QuaggaJS loaded successfully');
          setQuaggaLoaded(true)
        })
        .catch((error) => {
          console.error('Failed to load barcode scanner:', error)
          // Set a timeout to try again after 5 seconds
          setTimeout(() => {
            console.log('Retrying to load QuaggaJS...');
            loadQuaggaJS()
              .then(() => {
                console.log('QuaggaJS loaded successfully on retry');
                setQuaggaLoaded(true)
              })
              .catch((retryError) => {
                console.error('Failed to load barcode scanner after retry:', retryError)
              })
          }, 5000);
        })
    }
  }, [isOpen])

  // Cleanup when component unmounts or scanner closes
  useEffect(() => {
    return () => {
      if (window.Quagga && isScanning) {
        window.Quagga.stop()
      }
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [videoStream, isScanning])

  const startBarcodeScanner = async () => {
    if (!quaggaLoaded || !scannerRef.current) {
      setScanError("Barcode scanner library not loaded. Please wait or try again.")
      return
    }

    try {
      setScanError("")
      setScanSuccess(false)
      setIsScanning(true)

      // Check if Quagga is actually available
      if (!window.Quagga) {
        setScanError("Scanner library not available. Please refresh the page.")
        setIsScanning(false)
        return
      }

      // Initialize Quagga with more robust configuration
      window.Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            width: { min: 320, ideal: 480, max: 640 },
            height: { min: 240, ideal: 320, max: 480 },
            facingMode: "environment",
            aspectRatio: { min: 1, max: 2 }
          }
        },
        locator: {
          patchSize: "medium",
          halfSample: true
        },
        numOfWorkers: navigator.hardwareConcurrency || 2,
        frequency: 10,
        debug: {
          showCanvas: false,
          showPatches: false,
          showFoundPatches: false,
          showSkeleton: false,
          showLabels: false,
          showPatchLabels: false,
          showRemainingPatchLabels: false,
          boxFromPatches: {
            showTransformed: false,
            showTransformedBox: false,
            showBB: false
          }
        },
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
            "i2of5_reader",
            "2of5_reader"
          ]
        },
        locate: true
      }, (err: any) => {
        if (err) {
          console.error("QuaggaJS init error:", err)
          setScanError(`Failed to initialize camera: ${err.message || 'Unknown error'}. Please check camera permissions.`)
          setIsScanning(false)
          return
        }

        console.log("QuaggaJS initialized successfully");
        
        // Start scanning
        try {
          window.Quagga.start()
          console.log("QuaggaJS started successfully");
        } catch (startError) {
          console.error("QuaggaJS start error:", startError)
          setScanError("Failed to start camera. Please check permissions.")
          setIsScanning(false)
          return
        }

        // Add detection handler
        window.Quagga.onDetected((result: any) => {
          if (result && result.codeResult && result.codeResult.code) {
            const code = result.codeResult.code
            console.log("Barcode detected:", code)
            
            // Add confidence check
            if (result.codeResult.confidence && result.codeResult.confidence > 80) {
              handleScannedCode(code)
            }
          }
        })
      })
    } catch (error) {
      console.error("Scanner initialization error:", error)
      setScanError(`Scanner error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsScanning(false)
    }
  }

  const stopBarcodeScanner = () => {
    try {
      if (window.Quagga && isScanning) {
        window.Quagga.stop()
        window.Quagga.offDetected()
        console.log("QuaggaJS stopped successfully")
      }
    } catch (error) {
      console.error("Error stopping scanner:", error)
    }
    setIsScanning(false)
    setScanSuccess(false)
  }

  const handleScannedCode = (code: string) => {
    // Stop scanning immediately after successful scan
    stopBarcodeScanner()
    setScanSuccess(true)
    setScannedCode(code)
    
    // Check if this is a new item or existing item
    const existingItem = existingItems.find(item => item.sku === code)
    
    if (existingItem) {
      // If item exists, ask if user wants to restock
      const shouldRestock = confirm(`Item "${existingItem.name}" (SKU: ${code}) already exists. Would you like to restock it?`)
      if (shouldRestock) {
        handleClose()
        // You might want to emit a different event for restocking
        onScanResult(code) // Parent component should handle restock logic
        return
      }
    }
    
    // Close scanner dialog after a brief delay to show success
    setTimeout(() => {
      handleClose()
      onScanResult(code)
    }, 1500)
  }

  const handleClose = () => {
    stopBarcodeScanner()
    setScannedCode("")
    setScanError("")
    setScanSuccess(false)
    onClose()
  }

  const handleManualSubmit = () => {
    if (scannedCode) {
      handleScannedCode(scannedCode)
    }
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
          
          {!isScanning ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
                <QrCode className="h-8 w-8 text-indigo-500" />
              </div>
              <p className="text-gray-600">
                Use your camera to scan a barcode or QR code to automatically detect the SKU.
              </p>
              
              {!quaggaLoaded ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <Loader className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Loading barcode scanner library... This may take a moment.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Manual retry
                      loadQuaggaJS()
                        .then(() => {
                          setQuaggaLoaded(true)
                        })
                        .catch((error) => {
                          setScanError("Failed to load scanner library. Please check your internet connection.")
                        })
                    }}
                    className="text-sm"
                  >
                    Retry Loading Scanner
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={startBarcodeScanner} 
                  className="w-full"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Start Camera Scanner
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div 
                  ref={scannerRef}
                  className="w-full h-64 bg-black rounded-lg overflow-hidden"
                  style={{ maxHeight: '320px' }}
                />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-white border-dashed rounded-lg opacity-70">
                    <div className="w-full h-full relative">
                      {/* Corner indicators */}
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
                  onClick={stopBarcodeScanner}
                  className="flex-1"
                >
                  <X className="mr-2 h-4 w-4" />
                  Stop Scanner
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Supported formats: Code 128, EAN, UPC, Code 39, and more
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
              <Label htmlFor="manualSku">Or enter SKU manually:</Label>
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
                  disabled={!scannedCode}
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