"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export function useAnimatedNumber(target: number, duration = 0.55) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    const controls = animate(from, target, {
      duration,
      ease: "easeOut",
      onUpdate: setDisplay,
    });
    return controls.stop;
  }, [target, duration]);

  return display;
}
