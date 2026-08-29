import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// draggable/spinnable 3D avatar — front face is the photo, back is a brand mark
// showHint: show the "drag or double-click to spin" text (default false — only
//           used on the public portfolio hero, never inside the builder form)
export default function RotatingAvatar({
  src,
  name = "Portfolio owner",
  size = 260,
  dark = false,
  showHint = false,
}) {
  const rotateY = useMotionValue(0);
  const spring = useSpring(rotateY, { stiffness: 120, damping: 16, mass: 0.6 });
  const dragStart = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const spinOnce = () => {
    rotateY.set(rotateY.get() + 360);
  };

  return (
    <div className="avatar-stage select-none" style={{ width: size, height: size }}>
      <div className="avatar-glow" />
      <motion.div
        className="avatar-coin relative w-full h-full rounded-full"
        style={{ rotateY: spring, width: size, height: size }}
        drag="x"
        dragElastic={0.15}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={(e, info) => {
          setIsDragging(true);
          dragStart.current = rotateY.get();
        }}
        onDrag={(e, info) => {
          rotateY.set(dragStart.current + info.offset.x * 0.6);
        }}
        onDragEnd={() => setIsDragging(false)}
        onDoubleClick={spinOnce}
        whileHover={{ scale: 1.03 }}
        animate={isDragging ? {} : { y: [0, -10, 0] }}
        transition={
          isDragging ? {} : { y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }
        }
        role="button"
        tabIndex={0}
        aria-label={`${name}'s avatar — drag or double-click to spin`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") spinOnce();
        }}
      >
        {/* front face: real photo */}
        <div className="avatar-face avatar-elevated absolute inset-0 rounded-full overflow-hidden">
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 rounded-full card-sheen animate-shimmer opacity-40 pointer-events-none" />
        </div>

        {/* back face: initials brand mark */}
        <div className="avatar-back avatar-elevated absolute inset-0 rounded-full bg-gradient-to-br from-signal to-signal2 flex items-center justify-center">
          <span className="font-display text-white text-4xl">
            {name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")}
          </span>
        </div>
      </motion.div>

      {/* Only show the hint on the public portfolio hero, not in the builder form */}
      {showHint && (
        <p
          className={`text-center text-xs mt-4 font-mono uppercase tracking-widest ${
            dark ? "text-paper/50" : "text-ink/50"
          }`}
        >
          drag or double-click to spin
        </p>
      )}
    </div>
  );
}
