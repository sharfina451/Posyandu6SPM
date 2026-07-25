'use client'

import React, { useEffect, useState } from 'react'
import { getCurrentUserRole } from '@/lib/supabase/client'

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRole() {
      try {
        const userRole = await getCurrentUserRole()
        setRole(userRole || 'guest')
      } catch {
        setRole('guest')
      } finally {
        setLoading(false)
      }
    }
    fetchRole()
  }, [])

  if (loading) {
    return null
  }

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
