'use client';

import { motion } from 'motion/react';

interface LoyaltyAccountTitleProps {
  children: string;
  layoutId: string;
}

export function LoyaltyAccountTitle({ children, layoutId }: LoyaltyAccountTitleProps) {
  return <motion.h1 className='mt-1 text-3xl font-black tracking-[-0.045em] sm:text-4xl' layoutId={layoutId}>{children}</motion.h1>;
}
