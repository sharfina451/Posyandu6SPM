import { loadEnvConfig } from '@next/env'

// Load environment variables
loadEnvConfig(process.cwd())

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

async function runScopeRlsTest() {
  console.log('--- SUPABASE SCOPE CHANGE RLS TEST ---')

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

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey)
  console.log('Connected. Seeding test data...')

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
      .insert({ nama: 'Scope Test Posyandu' })
      .select()
      .single()
    if (errPosyandu) throw errPosyandu

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

    // Seed HH 1 & HH 2
    const { data: hhs, error: errHhs } = await adminClient
      .from('rumah_tangga')
      .insert([
        { no_kk: '1111000011110000', alamat: 'Dusun RW01', wilayah_rt_id: rt1.id },
        { no_kk: '2222000022220000', alamat: 'Dusun RW02', wilayah_rt_id: rt2.id },
      ])
      .select()
    if (errHhs) throw errHhs
    const hh1 = hhs.find((h) => h.no_kk === '1111000011110000')!
    const hh2 = hhs.find((h) => h.no_kk === '2222000022220000')!

    // Seed Warga 1 & Warga 2
    const { error: errWargas } = await adminClient.from('warga').insert([
      { nik: '1010101010101010', nama: 'Penduduk RW01', rumah_tangga_id: hh1.id },
      { nik: '2020202020202020', nama: 'Penduduk RW02', rumah_tangga_id: hh2.id },
    ])
    if (errWargas) throw errWargas

    // Create a Test Kader Auth User
    console.log('Creating test Kader user...')
    const { data: userKader, error: errUser } = await adminClient.auth.admin.createUser({
      email: 'scope_test_kader@6spm.id',
      password: 'password123',
      email_confirm: true,
      user_metadata: { nama: 'Kader RLS Test', role: 'kader' },
    })
    if (errUser) throw errUser

    // Set initial scope to RW 01 in public.pengguna
    console.log('Assigning initial scope: RW 01')
    const { error: errUpdate1 } = await adminClient
      .from('pengguna')
      .update({ wilayah_id: rw1.id, posyandu_id: posyandu.id })
      .eq('id', userKader.user.id)
    if (errUpdate1) throw errUpdate1

    // Login as the Kader user to get the first JWT (RW 01)
    const clientKader = createSupabaseClient(supabaseUrl, supabaseAnonKey)
    const { error: errLogin1 } = await clientKader.auth.signInWithPassword({
      email: 'scope_test_kader@6spm.id',
      password: 'password123',
    })
    if (errLogin1) throw errLogin1

    // Fetch warga as Kader
    const { data: dataPhase1, error: errFetch1 } = await clientKader.from('warga').select('nama')
    if (errFetch1) throw errFetch1

    console.log('Kader (assigned to RW 01) queried warga:', dataPhase1)
    const canSeeWarga1 = dataPhase1.some((w) => w.nama.includes('RW01'))
    const canSeeWarga2 = dataPhase1.some((w) => w.nama.includes('RW02'))

    if (canSeeWarga1 && !canSeeWarga2) {
      console.log('Phase 1 PASSED: Only RW 01 warga is visible.')
    } else {
      console.error('Phase 1 FAILED! RLS leak detected.')
    }

    // Now, change the Kader's scope to RW 02 using Admin client
    console.log('Admin changes Kader scope to: RW 02')
    const { error: errUpdate2 } = await adminClient
      .from('pengguna')
      .update({ wilayah_id: rw2.id })
      .eq('id', userKader.user.id)
    if (errUpdate2) throw errUpdate2

    // Sign in again as the Kader user to refresh JWT claims (reflects RW 02 scope)
    console.log('Refreshing Kader session...')
    const { error: errLogin2 } = await clientKader.auth.signInWithPassword({
      email: 'scope_test_kader@6spm.id',
      password: 'password123',
    })
    if (errLogin2) throw errLogin2

    // Fetch warga as Kader again
    const { data: dataPhase2, error: errFetch2 } = await clientKader.from('warga').select('nama')
    if (errFetch2) throw errFetch2

    console.log('Kader (assigned to RW 02) queried warga:', dataPhase2)
    const canSeeWarga1After = dataPhase2.some((w) => w.nama.includes('RW01'))
    const canSeeWarga2After = dataPhase2.some((w) => w.nama.includes('RW02'))

    if (!canSeeWarga1After && canSeeWarga2After) {
      console.log('Phase 2 PASSED: Dynamic scope change successfully restricts queries to RW 02!')
    } else {
      console.error('Phase 2 FAILED! Scope update RLS propagation failed.')
    }

    // Clean up
    await adminClient.auth.admin.deleteUser(userKader.user.id)
    console.log('RLS Scope Test completed & cleaned up successfully.')
  } catch (error) {
    console.error('Scope RLS Test encountered error:')
    console.error(error)
  }
}

runScopeRlsTest()
