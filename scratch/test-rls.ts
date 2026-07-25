import { loadEnvConfig } from '@next/env'

// Load environment variables
loadEnvConfig(process.cwd())

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function runRlsTest() {
  console.log('--- SUPABASE RLS INTEGRATION TEST ---')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !serviceRoleKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseAnonKey.includes('placeholder') ||
    serviceRoleKey.includes('placeholder')
  ) {
    console.log(
      'Skipping active test: Supabase environment variables are placeholders or not configured.'
    )
    console.log('To run this test, configure actual credentials in .env.local')
    return
  }

  // Create admin client (bypasses RLS) to seed test data
  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey)

  console.log('Connected. Seeding test data with admin client...')

  try {
    // 1. Clean previous test data
    await adminClient.from('warga').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient
      .from('rumah_tangga')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('wilayah').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await adminClient.from('posyandu').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Seed Posyandu
    const { data: posyandu, error: errPosyandu } = await adminClient
      .from('posyandu')
      .insert({ nama: 'Posyandu Lemahduwur Test' })
      .select()
      .single()

    if (errPosyandu) throw errPosyandu
    console.log('Seeded Posyandu:', posyandu.id)

    // Seed RW 01 & RW 02
    const { data: rws, error: errRws } = await adminClient
      .from('wilayah')
      .insert([
        { posyandu_id: posyandu.id, level: 'rw', kode: '01' },
        { posyandu_id: posyandu.id, level: 'rw', kode: '02' },
      ])
      .select()

    if (errRws) throw errRws
    const rw1 = rws.find((r) => r.kode === '01')!
    const rw2 = rws.find((r) => r.kode === '02')!
    console.log('Seeded RW 01:', rw1.id, 'and RW 02:', rw2.id)

    // Seed RT 01 (under RW 01) & RT 02 (under RW 02)
    const { data: rts, error: errRts } = await adminClient
      .from('wilayah')
      .insert([
        { posyandu_id: posyandu.id, level: 'rt', kode: '01', parent_id: rw1.id },
        { posyandu_id: posyandu.id, level: 'rt', kode: '02', parent_id: rw2.id },
      ])
      .select()

    if (errRts) throw errRts
    const rt1 = rts.find((r) => r.kode === '01')!
    const rt2 = rts.find((r) => r.kode === '02')!
    console.log('Seeded RT 01:', rt1.id, 'and RT 02:', rt2.id)

    // Seed Rumah Tangga 1 (RT 01) & Rumah Tangga 2 (RT 02)
    const { data: hhs, error: errHhs } = await adminClient
      .from('rumah_tangga')
      .insert([
        { no_kk: '1111111111111111', alamat: 'Gg. Mawar RW 01', wilayah_rt_id: rt1.id },
        { no_kk: '2222222222222222', alamat: 'Gg. Melati RW 02', wilayah_rt_id: rt2.id },
      ])
      .select()

    if (errHhs) throw errHhs
    const hh1 = hhs.find((h) => h.no_kk === '1111111111111111')!
    const hh2 = hhs.find((h) => h.no_kk === '2222222222222222')!

    // Seed Warga 1 & Warga 2
    const { data: wargas, error: errWargas } = await adminClient
      .from('warga')
      .insert([
        { nik: '1234567890123456', nama: 'Budi RW 01', rumah_tangga_id: hh1.id },
        { nik: '6543210987654321', nama: 'Joko RW 02', rumah_tangga_id: hh2.id },
      ])
      .select()

    if (errWargas) throw errWargas
    console.log('Seeded Warga records successfully.')

    // Simulate RLS:
    // Supabase RLS checks auth.jwt() claims.
    // We can simulate different clients by passing custom headers or using signInWithPassword.
    // In our test, since we cannot easily create auth users programmatically without email verification
    // unless using admin auth API, we will use adminClient auth API to create two test users.

    console.log('Creating test Auth users with roles and scopes...')

    // Create Kader 1 in Auth
    const { data: userKader1, error: errUser1 } = await adminClient.auth.admin.createUser({
      email: 'kader1_test@6spm.id',
      password: 'password123',
      email_confirm: true,
      user_metadata: { nama: 'Kader RW01', role: 'kader' },
    })
    if (errUser1) throw errUser1

    // Update public.pengguna to trigger metadata sync for Kader 1
    const { error: errUpdate1 } = await adminClient
      .from('pengguna')
      .update({ wilayah_id: rw1.id, posyandu_id: posyandu.id })
      .eq('id', userKader1.user.id)
    if (errUpdate1) throw errUpdate1

    // Create Kader 2 in Auth
    const { data: userKader2, error: errUser2 } = await adminClient.auth.admin.createUser({
      email: 'kader2_test@6spm.id',
      password: 'password123',
      email_confirm: true,
      user_metadata: { nama: 'Kader RW02', role: 'kader' },
    })
    if (errUser2) throw errUser2

    // Update public.pengguna to trigger metadata sync for Kader 2
    const { error: errUpdate2 } = await adminClient
      .from('pengguna')
      .update({ wilayah_id: rw2.id, posyandu_id: posyandu.id })
      .eq('id', userKader2.user.id)
    if (errUpdate2) throw errUpdate2

    console.log('Auth users seeded. Testing access limits...')

    // --- TEST 1: LOGIN AS KADER 1 ---
    const clientKader1 = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    const { error: errLogin1 } = await clientKader1.auth.signInWithPassword({
      email: 'kader1_test@6spm.id',
      password: 'password123',
    })
    if (errLogin1) throw errLogin1

    // Fetch wargas as Kader 1
    const { data: wargasAsKader1, error: errFetch1 } = await clientKader1
      .from('warga')
      .select('id, nama')
    if (errFetch1) throw errFetch1

    console.log('Kader 1 fetched warga data:', wargasAsKader1)

    // Assertions
    const hasBudi1 = wargasAsKader1.some((w) => w.nama.includes('Budi'))
    const hasJoko1 = wargasAsKader1.some((w) => w.nama.includes('Joko'))

    if (hasBudi1 && !hasJoko1) {
      console.log('PASSED: Kader 1 can see RW 01 warga and CANNOT see RW 02 warga!')
    } else {
      console.error('FAILED: Kader 1 access check failed! Budi:', hasBudi1, 'Joko:', hasJoko1)
    }

    // Clean up created Auth users
    await adminClient.auth.admin.deleteUser(userKader1.user.id)
    await adminClient.auth.admin.deleteUser(userKader2.user.id)
    console.log('Cleaned up test Auth users.')
  } catch (error) {
    console.error('RLS Test encountered error:')
    console.error(error)
  }
}

runRlsTest()
