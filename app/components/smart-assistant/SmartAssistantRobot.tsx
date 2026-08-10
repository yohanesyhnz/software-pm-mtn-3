"use client";

import { motion } from "framer-motion";

export type RobotFlight = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
};

type SmartAssistantRobotProps = {
  flight: RobotFlight;
  returning: boolean;
  onReturnComplete: () => void;
};

export default function SmartAssistantRobot({
  flight,
  returning,
  onReturnComplete
}: SmartAssistantRobotProps) {
  return (
    <motion.img
      src="/assets/smart_assistant_robot.png"
      alt=""
      aria-hidden="true"
      className="tw-pointer-events-none tw-fixed tw-left-0 tw-top-0 tw-z-[11020] tw-h-auto tw-select-none"
      style={{ width: flight.size, filter: "drop-shadow(0 18px 28px rgba(0, 0, 0, 0.42))" }}
      initial={{
        x: flight.startX,
        y: flight.startY,
        scale: 0.16,
        opacity: 0,
        rotate: -10
      }}
      animate={returning ? {
        x: flight.startX,
        y: flight.startY,
        scale: 0.12,
        opacity: 0,
        rotate: 8
      } : {
        x: flight.endX,
        y: flight.endY,
        scale: 1,
        opacity: 1,
        rotate: 0
      }}
      transition={{ duration: 0.78, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (returning) onReturnComplete();
      }}
    />
  );
}
