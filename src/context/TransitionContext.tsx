'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface TransitionData {
    name: string
    location: string
    imageUrl: string
    slug?: string
}

interface TransitionContextType {
    transitionData: TransitionData | null
    setTransitionData: (data: TransitionData | null) => void
    clearTransitionData: () => void
}

const TransitionContext = createContext<TransitionContextType | undefined>(undefined)

export function TransitionProvider({ children }: { children: ReactNode }) {
    const [transitionData, setTransitionDataState] = useState<TransitionData | null>(null)

    const setTransitionData = (data: TransitionData | null) => {
        console.log('[TransitionContext] Setting transition data:', data)
        setTransitionDataState(data)
    }

    const clearTransitionData = () => {
        console.log('[TransitionContext] Clearing transition data')
        setTransitionDataState(null)
    }

    return (
        <TransitionContext.Provider value={{ transitionData, setTransitionData, clearTransitionData }}>
            {children}
        </TransitionContext.Provider>
    )
}

export function useTransition() {
    const context = useContext(TransitionContext)
    if (context === undefined) {
        throw new Error('useTransition must be used within a TransitionProvider')
    }
    return context
}
