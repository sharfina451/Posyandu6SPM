import { loadEnvConfig } from '@next/env'

// Load environment variables from .env.local
loadEnvConfig(process.cwd())

import { createAdminClient } from '../lib/supabase/server'

async function testConnection() {
  const supabase = createAdminClient()

  console.log('--- SUPABASE CONNECTION TEST ---')
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

  try {
    console.log('Querying "peran" table...')
    const { data: peran, error: errorPeran } = await supabase.from('peran').select('id, kode, nama')

    if (errorPeran) {
      throw errorPeran
    }

    console.log('Success! Table "peran" retrieved:')
    console.table(peran)
    console.log('Database connection test completed successfully!')
  } catch (error) {
    console.error('Connection test failed:')
    console.error(error)
  }
}

testConnection()
