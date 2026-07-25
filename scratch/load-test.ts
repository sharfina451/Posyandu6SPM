import { performance } from 'perf_hooks'

async function runLoadTest() {
  const targetUrl = process.argv[2] || 'http://localhost:3000/login'
  const concurrency = 50

  console.log(`=== Memulai Uji Beban Ringan (Load Test) ===`)
  console.log(`-> Target URL : ${targetUrl}`)
  console.log(`-> Jumlah Pengguna Bersamaan (Concurrency) : ${concurrency} request`)
  console.log(
    `-> Harap pastikan server lokal Anda telah dijalankan ('npm run dev' / 'npm run start')`
  )
  console.log(`----------------------------------------------`)

  const requests = Array.from({ length: concurrency }).map(async (_, index) => {
    const startTime = performance.now()
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'PosyanduLoadTester/1.0',
        },
      })
      const endTime = performance.now()
      const latency = endTime - startTime
      return {
        id: index + 1,
        success: response.ok,
        status: response.status,
        latency,
      }
    } catch (error) {
      const endTime = performance.now()
      return {
        id: index + 1,
        success: false,
        status: 0,
        latency: endTime - startTime,
        error: error instanceof Error ? error.message : 'Koneksi Ditolak',
      }
    }
  })

  const results = await Promise.all(requests)

  // Calculate statistics
  const successCount = results.filter((r) => r.success).length
  const failureCount = results.length - successCount
  const latencies = results.map((r) => r.latency)
  const minLatency = Math.min(...latencies)
  const maxLatency = Math.max(...latencies)
  const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length

  console.log(`=== Hasil Analisis Uji Beban ===`)
  console.log(`Total Requests  : ${results.length}`)
  console.log(
    `Sukses (2xx)    : ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`
  )
  console.log(
    `Gagal           : ${failureCount} (${((failureCount / results.length) * 100).toFixed(1)}%)`
  )
  console.log(`Rata-rata Waktu Tanggap : ${avgLatency.toFixed(2)} ms`)
  console.log(`Waktu Tercepat  : ${minLatency.toFixed(2)} ms`)
  console.log(`Waktu Terlambat : ${maxLatency.toFixed(2)} ms`)
  console.log(`----------------------------------------------`)

  // Check NFR targets
  const passLatency = avgLatency < 2000
  const passSuccess = successCount === results.length

  if (passLatency && passSuccess) {
    console.log(`✔ STATUS: LOLOS (Kinerja stabil, rata-rata respon < 2s dan 0% error)`)
    process.exit(0)
  } else {
    console.log(`✘ STATUS: GAGAL (Kriteria NFR-06/07 tidak terpenuhi)`)
    process.exit(1)
  }
}

runLoadTest().catch((err) => {
  console.error('Terjadi kesalahan fatal saat uji beban:', err)
  process.exit(1)
})
