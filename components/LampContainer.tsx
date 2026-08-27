"use client";

import { motion } from "framer-motion";

const NAVY = "var(--navy-900)";
const GLOW = "#2f6fed";
const GLOW_BRIGHT = "#5b8ff5";
const GLOW_LINE = "#9db9fb";

const RISE_DELAY = 0.1;
const RISE_DURATION = 2.2;
const GROW_DELAY = 0.4;
const GROW_DURATION = 2.4;

/** Total time (seconds) until the lamp has fully settled — used to time the reveal of content beneath it. */
export const LAMP_SETTLE_TIME = Math.max(RISE_DELAY + RISE_DURATION, GROW_DELAY + GROW_DURATION);

/** Fixed-height beam banner — independent of viewport height, so it never clips content on short screens. */
const BEAM_HEIGHT = 460;

export default function LampContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center overflow-hidden"
      style={{ background: NAVY }}
    >
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: RISE_DELAY, duration: RISE_DURATION, ease: "easeOut" }}
        className="relative w-full"
        style={{ height: BEAM_HEIGHT }}
      >
      <div className="relative flex w-full h-full scale-y-125 items-center justify-center isolate z-0">
        <motion.div
          initial={{ opacity: 0.5, width: "19rem" }}
          animate={{ opacity: 1, width: "38rem" }}
          transition={{ delay: GROW_DELAY, duration: GROW_DURATION, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(from 70deg at center top, ${GLOW}, transparent, transparent)`,
          }}
          className="absolute inset-auto right-1/2 h-56 overflow-visible w-[38rem] text-white"
        >
          <div
            className="absolute w-[100%] left-0 h-40 bottom-0 z-20"
            style={{ background: NAVY, maskImage: "linear-gradient(to top, white, transparent)" }}
          />
          <div
            className="absolute w-40 h-[100%] left-0 bottom-0 z-20"
            style={{ background: NAVY, maskImage: "linear-gradient(to right, white, transparent)" }}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0.5, width: "19rem" }}
          animate={{ opacity: 1, width: "38rem" }}
          transition={{ delay: GROW_DELAY, duration: GROW_DURATION, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(from 290deg at center top, transparent, transparent, ${GLOW})`,
          }}
          className="absolute inset-auto left-1/2 h-56 w-[38rem] text-white"
        >
          <div
            className="absolute w-40 h-[100%] right-0 bottom-0 z-20"
            style={{ background: NAVY, maskImage: "linear-gradient(to left, white, transparent)" }}
          />
          <div
            className="absolute w-[100%] right-0 h-40 bottom-0 z-20"
            style={{ background: NAVY, maskImage: "linear-gradient(to top, white, transparent)" }}
          />
        </motion.div>

        <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 blur-2xl" style={{ background: NAVY }} />
        <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
        <div
          className="absolute inset-auto z-50 h-36 w-[34rem] -translate-y-1/2 rounded-full opacity-50 blur-3xl"
          style={{ background: GLOW }}
        />
        <motion.div
          initial={{ width: "10rem" }}
          animate={{ width: "20rem" }}
          transition={{ delay: GROW_DELAY, duration: GROW_DURATION, ease: "easeInOut" }}
          className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full blur-2xl"
          style={{ background: GLOW_BRIGHT }}
        />
        <motion.div
          initial={{ width: "19rem" }}
          animate={{ width: "38rem" }}
          transition={{ delay: GROW_DELAY, duration: GROW_DURATION, ease: "easeInOut" }}
          className="absolute inset-auto z-50 h-0.5 w-[38rem] -translate-y-[7rem]"
          style={{ background: GLOW_LINE }}
        />

        <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem]" style={{ background: NAVY }} />
      </div>
      </motion.div>

      <div className="relative z-50 flex w-full flex-1 flex-col items-center px-5 pb-16" style={{ marginTop: -BEAM_HEIGHT * 0.68 }}>
        {children}
      </div>
    </div>
  );
}
