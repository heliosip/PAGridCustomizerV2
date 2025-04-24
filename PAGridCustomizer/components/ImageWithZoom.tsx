import * as React from 'react';
import { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom';

interface ImageWithZoomProps {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
  zoomFactor?: number;
}

// Global state management for zoom windows
interface GlobalZoomState {
  isZoomActive: boolean;
  activeImageSrc: string | null;
  activeSetShowZoom: ((value: boolean) => void) | null;
  portalRoot: HTMLElement | null;
}

// Single global state object
const globalZoomState: GlobalZoomState = {
  isZoomActive: false,
  activeImageSrc: null,
  activeSetShowZoom: null,
  portalRoot: null
};

// Function to close any active zoom window
const closeActiveZoom = () => {
  if (globalZoomState.activeSetShowZoom && globalZoomState.isZoomActive) {
    globalZoomState.activeSetShowZoom(false);
    globalZoomState.isZoomActive = false;
    globalZoomState.activeImageSrc = null;
  }
};

// Create a portal element for the zoom overlay to ensure it's rendered at the document root
const createPortalRoot = () => {
  if (globalZoomState.portalRoot) return globalZoomState.portalRoot;
  
  const portalRoot = document.createElement('div');
  portalRoot.id = 'zoom-portal-root';
  portalRoot.style.position = 'fixed';
  portalRoot.style.top = '0';
  portalRoot.style.left = '0';
  portalRoot.style.width = '100%';
  portalRoot.style.height = '100%';
  portalRoot.style.zIndex = '10000'; // Very high z-index
  portalRoot.style.pointerEvents = 'none';
  document.body.appendChild(portalRoot);
  globalZoomState.portalRoot = portalRoot;
  return portalRoot;
};

export const ImageWithZoom: React.FC<ImageWithZoomProps> = (props) => {
  const { 
    src = '', 
    alt = '', 
    width = '100%', 
    height = 30, 
    style = {}, 
    zoomFactor = 3 
  } = props;
  
  // Click-only approach with improved positioning
  const [showZoom, setShowZoom] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imagePosition, setImagePosition] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const imageRef = React.useRef<HTMLImageElement>(null);
  const zoomRef = React.useRef<HTMLDivElement>(null);
  
  // Create portal root on mount and handle cleanup
  useEffect(() => {
    console.log('ImageWithZoom component mounted');
    console.log('Image source:', src);
    
    // Create portal root if it doesn't exist
    const root = createPortalRoot();
    setPortalRoot(root);
    
    // If this is the active zoomed image when mounting, update local state
    if (globalZoomState.isZoomActive && globalZoomState.activeImageSrc === src) {
      setShowZoom(true);
    }
    
    // Clean up on unmount
    return () => {
      // If this component is showing zoom and gets unmounted, clear the global state
      if (showZoom && globalZoomState.activeImageSrc === src) {
        globalZoomState.isZoomActive = false;
        globalZoomState.activeImageSrc = null;
        globalZoomState.activeSetShowZoom = null;
      }
      console.log('ImageWithZoom component unmounted');
    };
  }, []);
  
  // Handle src changes (when user navigates between rows)
  useEffect(() => {
    // If this is the currently zoomed image, update the state
    if (globalZoomState.activeImageSrc === src) {
      setShowZoom(true);
    } else if (showZoom) {
      // If we were showing zoom but the src changed, hide it
      setShowZoom(false);
    }
    
    // Update image position when src changes or component mounts
    const updateImagePosition = () => {
      if (imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        setImagePosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    };
    
    // Update position initially and on window resize
    updateImagePosition();
    window.addEventListener('resize', updateImagePosition);
    
    return () => {
      window.removeEventListener('resize', updateImagePosition);
    };
  }, [src]);
  
  // Update global state when zoom state changes
  useEffect(() => {
    if (showZoom) {
      // Close any other open zoom windows
      if (globalZoomState.activeSetShowZoom && globalZoomState.activeImageSrc !== src) {
        globalZoomState.activeSetShowZoom(false);
      }
      
      // Update global state
      globalZoomState.isZoomActive = true;
      globalZoomState.activeImageSrc = src;
      globalZoomState.activeSetShowZoom = setShowZoom;
    } else if (globalZoomState.activeImageSrc === src) {
      // Clear global state if this component is closing its zoom
      globalZoomState.isZoomActive = false;
      globalZoomState.activeImageSrc = null;
      globalZoomState.activeSetShowZoom = null;
    }
  }, [showZoom, src]);
  
  // Handle image load to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
      console.log('Image natural size:', { width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = src;
  }, [src]);
  
  // Function to calculate optimal zoom window position - to the right of the image
  const calculateZoomPosition = () => {
    if (!imageRef.current) return { top: 0, left: 0 };
    
    const rect = imageRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;
    
    // Position to the right of the image
    let top = rect.top;
    let left = rect.right + 10;
    
    // Get zoom dimensions (estimate if not yet rendered)
    // Make the zoom window 30% smaller
    const zoomWidth = (zoomRef.current?.offsetWidth || 280) * 0.7;
    const zoomHeight = (zoomRef.current?.offsetHeight || 280) * 0.7;
    
    // Check if zoom would go off bottom of screen
    if (top + zoomHeight > windowHeight) {
      // Adjust top to fit within window
      top = Math.max(10, windowHeight - zoomHeight - 10);
    }
    
    // Check if zoom would go off right of screen
    if (left + zoomWidth > windowWidth) {
      // Try positioning to the left of the image
      if (rect.left > zoomWidth + 10) {
        left = rect.left - zoomWidth - 10;
      } else {
        // If not enough space on left, position at a fixed distance from right
        left = Math.max(10, windowWidth - zoomWidth - 10);
      }
    }
    
    return { top, left };
  };
  
  // Click handler to show zoom for this image
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Image clicked, showing zoom');
    
    // Update image position
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      setImagePosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }
    
    // If this image is already showing zoom, close it
    if (showZoom && globalZoomState.activeImageSrc === src) {
      setShowZoom(false);
      globalZoomState.isZoomActive = false;
      globalZoomState.activeImageSrc = null;
      return;
    }
    
    // Close any other open zoom windows first
    closeActiveZoom();
    
    // Then show this image
    setShowZoom(true);
    
    // Add a global click handler to close when clicking outside
    setTimeout(() => {
      const handleGlobalClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // Only close if clicking outside any image-with-zoom-container
        if (!target.closest('.image-with-zoom-container') && !target.closest('#zoom-container')) {
          setShowZoom(false);
          document.removeEventListener('click', handleGlobalClick);
        }
      };
      
      // Remove any existing handlers before adding a new one
      document.removeEventListener('click', handleGlobalClick);
      document.addEventListener('click', handleGlobalClick);
    }, 100);
  };

  // Calculate zoom dimensions based on image natural size
  const calculateZoomDimensions = () => {
    // Default dimensions
    let zoomWidth = 400;
    let zoomHeight = 400;
    
    // If we have image dimensions, use aspect ratio
    if (imageSize.width > 0 && imageSize.height > 0) {
      const aspectRatio = imageSize.width / imageSize.height;
      
      // Adjust based on aspect ratio
      if (aspectRatio > 1) { // Landscape
        zoomHeight = zoomWidth / aspectRatio;
      } else { // Portrait
        zoomWidth = zoomHeight * aspectRatio;
      }
      
      // Cap maximum dimensions
      zoomWidth = Math.min(zoomWidth, window.innerWidth * 0.8);
      zoomHeight = Math.min(zoomHeight, window.innerHeight * 0.8);
    }
    
    return { width: zoomWidth, height: zoomHeight };
  };
  
  const zoomDimensions = calculateZoomDimensions();
  
  // Render the main component
  return (
    <div 
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        cursor: 'pointer'
      }}
      className="image-with-zoom-container"
      onClick={handleClick}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        style={{ 
          objectFit: 'contain', 
          border: '1px solid transparent',
          transition: 'all 0.2s ease',
          borderColor: showZoom ? '#007bff' : 'transparent',
          ...style 
        }}
      />
      
      {showZoom && portalRoot && (
        ReactDOM.createPortal(
          <div 
            id="zoom-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              zIndex: 10000,
              pointerEvents: 'none' // Allow scrolling through the overlay
            }}
          >
            <div
              id="zoom-container"
              ref={zoomRef}
              style={{
                backgroundColor: 'white',
                padding: '10px',
                borderRadius: '8px',
                boxShadow: '0 5px 20px rgba(0,0,0,0.5)',
                maxWidth: '90vw',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'absolute',
                top: `${calculateZoomPosition().top}px`,
                left: `${calculateZoomPosition().left}px`,
                pointerEvents: 'auto' // Make the zoom window interactive
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                width: `${zoomDimensions.width * 0.7}px`, // 30% smaller
                height: `${zoomDimensions.height * 0.7}px`, // 30% smaller
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <img
                  id="zoom-image"
                  src={src}
                  alt={alt}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
              {/* No buttons needed since clicking elsewhere closes the zoom */}
            </div>
          </div>,
          portalRoot
        )
      )}
    </div>
  );
};
