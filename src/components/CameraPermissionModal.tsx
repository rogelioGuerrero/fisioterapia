import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, ShieldCheck, Lock, X, Loader2, AlertTriangle } from 'lucide-react';

interface CameraPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrant: () => void;
  isRequesting: boolean;
  error: string | null;
  contrastMode: boolean;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  onClose,
  onGrant,
  isRequesting,
  error,
  contrastMode,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 ${
            contrastMode ? 'bg-black/90' : 'bg-slate-950/80 backdrop-blur-md'
          }`}
          onClick={!isRequesting ? onClose : undefined}
        />
      
      {/* Modal Card */}
      <motion.div
        id="camera-permission-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className={`relative w-full max-w-md rounded-3xl border-2 shadow-2xl overflow-hidden p-6 sm:p-8 z-10 ${
          contrastMode
            ? 'bg-zinc-950 border-yellow-400 text-white'
            : 'bg-slate-900/95 border-slate-700/60 text-white'
        }`}
      >
        {/* Close Button or Loading */}
        <button
          id="close-permission-modal-btn"
          onClick={onClose}
          disabled={isRequesting}
          className={`absolute top-4 right-4 p-2 rounded-full border transition-all ${
            isRequesting 
              ? 'opacity-20 cursor-not-allowed' 
              : contrastMode
                ? 'border-zinc-700 hover:border-yellow-400 text-white'
                : 'border-slate-800 hover:border-slate-605 text-slate-400 hover:text-white'
          }`}
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Main Visual Indicator */}
          <div 
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 border-2 ${
              contrastMode 
                ? 'bg-zinc-900 border-yellow-400 text-yellow-500' 
                : 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10'
            }`}
          >
            {isRequesting ? (
              <Loader2 size={32} className="animate-spin" />
            ) : (
              <Camera size={32} />
            )}
          </div>

          <h2 className="font-display font-black text-2xl tracking-tight leading-snug mb-3 text-white">
            {isRequesting ? 'Solicitando Cámara...' : 'Acceso a Cámara Requerido'}
          </h2>
          
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Para que la IA de <span className="text-blue-400 font-extrabold">FisioAsistente</span> analice y cuente sus movimientos de rehabilitación en tiempo real, se requiere acceso temporal a su cámara web.
          </p>

          {/* Privacy Trust Banner */}
          <div className={`w-full p-4 rounded-2xl mb-6 border text-left flex gap-3 ${
            contrastMode 
              ? 'bg-zinc-900 border-zinc-800' 
              : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
          }`}>
            <ShieldCheck size={28} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-0.5">Seguridad Garantizada 100% Local</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Su video se procesa en vivo y localmente en su propio dispositivo. **Nunca** se transmite a internet ni se almacena en ningún servidor externo.
              </p>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className={`w-full p-4 rounded-md mb-6 border-l-4 text-left flex gap-3 ${
              contrastMode
                ? 'bg-zinc-900 border-l-red-500 border border-zinc-800 text-white'
                : 'bg-red-500/10 border-l-red-500 border border-red-500/20 text-white'
            }`}>
              <AlertTriangle size={24} className="text-red-500 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-0.5">Error de Permiso</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Prompt Instructions */}
          {!error && !isRequesting && (
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5 justify-center">
              <Lock size={12} className="text-slate-400" />
              <span>Por favor acepte la solicitud del navegador al presionar Continuar</span>
            </p>
          )}

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              id="grant-permission-btn"
              onClick={onGrant}
              disabled={isRequesting}
              className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide uppercase cursor-pointer shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                contrastMode
                  ? 'bg-yellow-400 hover:bg-yellow-350 text-black shadow-yellow-400/10'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/10'
              }`}
              style={{ minHeight: '56px' }}
            >
              {isRequesting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Conectando...</span>
                </>
              ) : (
                <>
                  <Camera size={18} />
                  <span>Continuar</span>
                </>
              )}
            </button>
            <button
              id="cancel-permission-btn"
              onClick={onClose}
              disabled={isRequesting}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-widest uppercase cursor-pointer border transition-all active:scale-[0.98] ${
                contrastMode
                  ? 'bg-transparent border-zinc-700 hover:border-white text-slate-300 hover:text-white'
                  : 'bg-slate-800/40 border-slate-750 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              style={{ minHeight: '48px' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
    </AnimatePresence>
  );
};
