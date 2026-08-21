'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { useState, type MouseEvent, type ReactNode } from 'react';

const MotionLink = motion.create(Link);

interface LoyaltyCardLinkProps {
  ariaLabelledby: string;
  children: ReactNode;
  className: string;
  href: string;
  id: string;
  layoutId: string;
}

export function LoyaltyCardLink({ ariaLabelledby, children, className, href, id, layoutId }: LoyaltyCardLinkProps) {
  return (
    <MotionLink
      aria-labelledby={ariaLabelledby}
      className={`${className} relative`}
      href={href}
      id={id}
      layoutId={layoutId}
      transition={{
        ease: "linear",
        layout: {
          stiffness: 300,
          damping: 30,
        },
      }}
    >
      {children}
    </MotionLink>
  );
}

interface LoyaltyCardTitleProps {
  children: ReactNode;
  className: string;
  id: string;
  layoutId: string;
}

export function LoyaltyCardTitle({ children, className, id, layoutId }: LoyaltyCardTitleProps) {
  return (
    <motion.h2 className={className} id={id} 
    // layoutId={layoutId}
    >
      {children}
    </motion.h2>
  );
}
