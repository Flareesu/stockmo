    /* ─── CameraModal (desktop getUserMedia live preview) ─── */
    function CameraModal({ onCapture, onClose, onFallback }) {
      const videoRef  = useRef(null);
      const streamRef = useRef(null);
      const [ready, setReady] = useState(false);
      const [error, setError] = useState(false);

      useEffect(() => {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
          .then(stream => {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => setReady(true);
            }
          })
          .catch(() => { setError(true); });
        return () => {
          streamRef.current?.getTracks().forEach(t => t.stop());
        };
      }, []);

      const snap = () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement('canvas');
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
          if (blob) onCapture(new File([blob], `snap_${Date.now()}.jpg`, { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.85);
        onClose();
      };

      if (error) {
        return (
          <div className="fixed inset-0 z-[70] bg-black/60 flex items-end lg:items-center justify-center lg:p-6 anim-fade-in" onClick={onClose}>
            <div className="w-full max-w-[430px] lg:max-w-[400px] bg-white rounded-t-[28px] lg:rounded-[24px] p-6 text-center anim-slide-up" onClick={e => e.stopPropagation()}>
              <Icon name="no_photography" className="text-muted text-[40px] mb-3" />
              <p className="text-navy font-bold mb-1">Camera not available</p>
              <p className="text-muted text-[12px] mb-4">Permission denied or no camera found.</p>
              <div className="flex gap-3">
                <button onClick={onFallback} className="flex-1 py-3 bg-primary text-white font-bold rounded-full text-[13px]">Browse Files</button>
                <button onClick={onClose}   className="flex-1 py-3 border-2 border-gray-200 text-navy font-bold rounded-full text-[13px]">Cancel</button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="fixed inset-0 z-[70] bg-black flex flex-col anim-fade-in" onClick={onClose}>
          <div className="flex items-center justify-between px-4 pt-12 pb-3" onClick={e => e.stopPropagation()}>
            <span className="text-white font-bold text-[15px]">Take Photo</span>
            <button onClick={onClose} className="p-2 text-white"><Icon name="close" /></button>
          </div>
          <div className="flex-1 relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-6 px-6 py-8 bg-black" onClick={e => e.stopPropagation()}>
            <button onClick={onFallback} className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
              <Icon name="photo_library" className="text-white text-[22px]" />
            </button>
            <button onClick={snap} disabled={!ready}
              className="w-18 h-18 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
              style={{ width:72, height:72 }}>
              <div className="w-14 h-14 rounded-full bg-white border-4 border-navy/20" />
            </button>
            <div className="w-12 h-12" />
          </div>
        </div>
      );
    }

