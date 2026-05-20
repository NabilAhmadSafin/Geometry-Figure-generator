import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

declare global {
  interface Window {
    GGBApplet: any;
    ggbApplet: any;
  }
}

interface GeoGebraAppletProps {
  onLoad?: (api: any) => void;
  width?: number;
  height?: number;
}

export interface GeoGebraHandle {
  evalCommand: (command: string) => void;
  reset: () => void;
  exportPNG: () => void;
  exportGGB: () => void;
  isReady: () => boolean;
}

const GeoGebraApplet = forwardRef<GeoGebraHandle, GeoGebraAppletProps>((props, ref) => {
  const { onLoad, width = 800, height = 600 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    evalCommand: (command: string) => {
      if (apiRef.current) {
        apiRef.current.evalCommand(command);
      } else {
        console.warn("GeoGebra API not ready yet for command:", command);
      }
    },
    reset: () => {
      if (apiRef.current) {
        apiRef.current.newConstruction();
      }
    },
    exportPNG: () => {
      if (apiRef.current) {
        const base64 = apiRef.current.getPNGBase64(1, false, 72);
        const link = document.createElement('a');
        link.href = 'data:image/png;base64,' + base64;
        link.download = 'geometry-figure.png';
        link.click();
      }
    },
    exportGGB: () => {
      if (apiRef.current) {
        // Some GGB versions use a callback, others are sync. 
        // For web applet, it's usually async but many implementations allow sync check if we don't pass callback.
        // We'll try the common sync version first, if it fails we might need callback logic.
        const base64 = apiRef.current.getBase64();
        if (typeof base64 === 'string') {
          const link = document.createElement('a');
          link.href = 'data:application/vnd.geogebra.file;base64,' + base64;
          link.download = 'construction.ggb';
          link.click();
        } else {
          // Attempt callback version if sync returns nothing or object
          apiRef.current.getBase64((b64: string) => {
            const link = document.createElement('a');
            link.href = 'data:application/vnd.geogebra.file;base64,' + b64;
            link.download = 'construction.ggb';
            link.click();
          });
        }
      }
    },
    isReady: () => !!apiRef.current
  }));

  useEffect(() => {
    const scriptId = 'geogebra-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initApplet = () => {
      // Clear existing content if any (to avoid double injection)
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      const params = {
        "appName": "geometry",
        "width": width,
        "height": height,
        "showToolBar": true,
        "showAlgebraInput": true,
        "showMenuBar": true,
        "showAlgebraView": true,
        "enableRightClick": true,
        "enableLabelDrags": true,
        "enableShiftDragZoom": true,
        "errorDialogsActive": false,
        "useBrowserForJS": true,
        "allowStyleBar": true,
        "preventFocus": false,
        "showResetIcon": true,
        "showLogging": false,
        "appletOnLoad": (api: any) => {
          apiRef.current = api;
          // Set some defaults
          api.setGridVisible(true);
          api.setAxesVisible(true);
          if (onLoad) onLoad(api);
        }
      };
      
      const applet = new window.GGBApplet(params, true);
      applet.inject(containerRef.current);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://www.geogebra.org/apps/deployggb.js';
      script.async = true;
      script.onload = () => {
        initApplet();
      };
      document.body.appendChild(script);
    } else {
      if (window.GGBApplet) {
        initApplet();
      } else {
        script.onload = () => initApplet();
      }
    }

    return () => {
      // Cleanup if necessary, though GeoGebra injection usually handles its own lifecycle
    };
  }, [width, height]);

  return (
    <div 
      id="ggb-container"
      className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white"
      style={{ width: '100%', maxWidth: width, height: height }}
    >
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
});

export default GeoGebraApplet;
