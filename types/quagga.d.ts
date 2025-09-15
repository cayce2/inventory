declare module 'quagga' {
  interface QuaggaConfig {
    inputStream?: {
      name?: string;
      type?: string;
      target?: HTMLVideoElement | null;
      constraints?: {
        width?: number;
        height?: number;
        facingMode?: string;
      };
    };
    locator?: {
      patchSize?: string;
      halfSample?: boolean;
    };
    numOfWorkers?: number;
    decoder?: {
      readers?: string[];
    };
  }

  interface DetectionResult {
    codeResult: {
      code: string;
    };
  }

  function init(config: QuaggaConfig, callback: (err: any) => void): void;
  function start(): void;
  function stop(): void;
  function onDetected(callback: (result: DetectionResult) => void): void;

  export { init, start, stop, onDetected };
}