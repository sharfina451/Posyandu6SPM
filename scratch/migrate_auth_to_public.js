const fs = require('fs')
const path = require('path')

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations')
console.log('Scanning migrations directory:', migrationsDir)

const files = fs.readdirSync(migrationsDir)
let totalReplaced = 0

files.forEach((file) => {
  if (file.endsWith('.sql')) {
    const filePath = path.join(migrationsDir, file)
    let content = fs.readFileSync(filePath, 'utf8')

    let replaced = false

    // Replace function definitions and calls
    if (content.includes('auth.role_code')) {
      content = content.replaceAll('auth.role_code', 'public.role_code')
      replaced = true
    }
    if (content.includes('auth.wilayah_id')) {
      content = content.replaceAll('auth.wilayah_id', 'public.wilayah_id')
      replaced = true
    }
    if (content.includes('auth.posyandu_id')) {
      content = content.replaceAll('auth.posyandu_id', 'public.posyandu_id')
      replaced = true
    }

    if (replaced) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Updated migrations file: ${file}`)
      totalReplaced++
    }
  }
})

console.log(`Successfully updated ${totalReplaced} migration files.`)
