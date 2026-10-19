import { motion, AnimatePresence } from 'framer-motion'

export default function ConfirmationModal({ open, onCancel, onFinish }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.45)', zIndex: 50 }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            className="glass rounded-2xl p-5 mx-4 w-60 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(9,66,140,0.12)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#09428c" strokeWidth="2">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900" style={{ fontSize: 13 }}>End Simulation?</h3>
                <p className="text-gray-500 mt-1 leading-snug" style={{ fontSize: 10 }}>
                  End simulation and view result summary?
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={onCancel}
                  className="flex-1 py-2 rounded-xl border text-gray-600 font-semibold"
                  style={{ fontSize: 11, borderColor: '#d1d5db' }}>
                  Cancel
                </button>
                <button onClick={onFinish}
                  className="flex-1 py-2 rounded-xl text-white font-bold"
                  style={{ fontSize: 11, background: '#09428c' }}>
                  Finish
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
