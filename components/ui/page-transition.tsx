'use client'

import { motion, type Variants } from 'framer-motion'
import { type ReactNode } from 'react'

// Container variants with staggerChildren
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.05
        }
    }
}

// Item variants for fade-in-up animation
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut'
        }
    }
}

// Header variants (faster, appears first)
const headerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut'
        }
    }
}

// Content variants (appears after header with slight delay)
const contentVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
            delay: 0.15
        }
    }
}

interface PageTransitionProps {
    children: ReactNode
    className?: string
}

/**
 * Wrapper for entire page content with staggered animations
 * Use this to wrap the main page content for a smooth reveal
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Animated header section (title, description, filters)
 * Fades in first with a subtle upward motion
 */
export function PageHeader({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            variants={headerVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Animated content section (tables, grids, cards)
 * Fades in after the header with a delayed upward motion
 */
export function PageContent({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            variants={contentVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Animated item for use inside staggered containers
 * Each item fades in one by one
 */
export function PageItem({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            variants={itemVariants}
            className={className}
        >
            {children}
        </motion.div>
    )
}

/**
 * Animated card wrapper with hover effects
 * Combines fade-in animation with subtle hover lift
 */
export function AnimatedCard({ children, className = '' }: PageTransitionProps) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={className}
        >
            {children}
        </motion.div>
    )
}
