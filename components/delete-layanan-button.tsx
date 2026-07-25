'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLayananSpm } from '@/app/dashboard/layanan/actions'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2 } from 'lucide-react'

export function DeleteLayananButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus catatan pelayanan ini? Tindakan ini akan dicatat di log audit.'
      )
    ) {
      return
    }
    setLoading(true)
    const res = await deleteLayananSpm(id)
    if (res.success) {
      router.refresh()
    } else {
      alert(res.error || 'Gagal menghapus catatan.')
    }
    setLoading(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={loading}
      onClick={handleDelete}
      className="text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 rounded-lg h-8 w-8"
      title="Hapus Layanan"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}
