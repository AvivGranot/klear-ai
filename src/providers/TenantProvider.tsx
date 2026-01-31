'use client'

/**
 * TenantProvider - Multi-tenant context for Klear AI
 * Provides company/subscription data throughout the application
 * Brian Chesky: Every interaction should feel personalized to the customer
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

// ==================== TYPES ====================

export interface Subscription {
  id: string
  plan: 'STARTER' | 'GROWTH' | 'BUSINESS' | 'ENTERPRISE'
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED'
  maxUsers: number
  maxKnowledgeItems: number
  maxQueriesPerMonth: number
  currentUsers: number
  currentKnowledge: number
  queriesThisMonth: number
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}

export interface Company {
  id: string
  name: string
  slug: string
  industry: string | null
  logo: string | null
  primaryColor: string
  welcomeMessage: string | null
  botName: string
  timezone: string
  language: string
}

export interface CurrentUser {
  id: string
  email: string | null
  name: string
  role: 'employee' | 'manager' | 'admin' | 'owner'
  avatarUrl: string | null
}

export interface TenantContextType {
  company: Company | null
  subscription: Subscription | null
  user: CurrentUser | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean
  // Helpers
  canAccessFeature: (feature: string) => boolean
  isTrialExpired: boolean
  isOverLimit: (type: 'users' | 'knowledge' | 'queries') => boolean
  // Actions
  logout: () => Promise<void>
  refreshTenant: () => Promise<void>
}

// ==================== CONTEXT ====================

const TenantContext = createContext<TenantContextType | undefined>(undefined)

// ==================== FEATURE FLAGS BY PLAN ====================

const PLAN_FEATURES: Record<string, string[]> = {
  STARTER: ['chat', 'knowledge_basic', 'whatsapp_basic'],
  GROWTH: ['chat', 'knowledge_basic', 'knowledge_advanced', 'whatsapp_basic', 'whatsapp_advanced', 'analytics_basic'],
  BUSINESS: ['chat', 'knowledge_basic', 'knowledge_advanced', 'whatsapp_basic', 'whatsapp_advanced', 'analytics_basic', 'analytics_advanced', 'escalations', 'api_access'],
  ENTERPRISE: ['chat', 'knowledge_basic', 'knowledge_advanced', 'whatsapp_basic', 'whatsapp_advanced', 'analytics_basic', 'analytics_advanced', 'escalations', 'api_access', 'sso', 'custom_branding', 'priority_support'],
}

// ==================== PROVIDER ====================

interface TenantProviderProps {
  children: ReactNode
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tenant data
  const fetchTenantData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/me')

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated - clear state
          setUser(null)
          setCompany(null)
          setSubscription(null)
          return
        }
        throw new Error('Failed to fetch tenant data')
      }

      const data = await response.json()

      setUser(data.user)
      setCompany(data.company)
      setSubscription(data.subscription)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTenantData()
  }, [])

  // Logout handler
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setCompany(null)
      setSubscription(null)
      window.location.href = '/login'
    } catch (err) {
      console.error('Logout error:', err)
    }
  }

  // Feature access check
  const canAccessFeature = (feature: string): boolean => {
    if (!subscription) return false
    const features = PLAN_FEATURES[subscription.plan] || []
    return features.includes(feature)
  }

  // Trial expiration check
  const isTrialExpired = (() => {
    if (!subscription) return true
    if (subscription.status !== 'TRIAL') return false
    if (!subscription.trialEndsAt) return false
    return new Date(subscription.trialEndsAt) < new Date()
  })()

  // Limit checks
  const isOverLimit = (type: 'users' | 'knowledge' | 'queries'): boolean => {
    if (!subscription) return true
    switch (type) {
      case 'users':
        return subscription.currentUsers >= subscription.maxUsers
      case 'knowledge':
        return subscription.currentKnowledge >= subscription.maxKnowledgeItems
      case 'queries':
        return subscription.queriesThisMonth >= subscription.maxQueriesPerMonth
      default:
        return false
    }
  }

  const value: TenantContextType = {
    company,
    subscription,
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    canAccessFeature,
    isTrialExpired,
    isOverLimit,
    logout,
    refreshTenant: fetchTenantData,
  }

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}

// ==================== HOOK ====================

export function useTenant(): TenantContextType {
  const context = useContext(TenantContext)
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider')
  }
  return context
}

// Convenience hooks
export function useCompany(): Company | null {
  const { company } = useTenant()
  return company
}

export function useSubscription(): Subscription | null {
  const { subscription } = useTenant()
  return subscription
}

export function useCurrentUser(): CurrentUser | null {
  const { user } = useTenant()
  return user
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useTenant()
  return isAuthenticated
}
