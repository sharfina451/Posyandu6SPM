/**
 * Regex for official Posyandu registration number (format: PP.KK.KC.DDDD.NNN)
 * PP: Provinsi (2 digits)
 * KK: Kabupaten/Kota (2 digits)
 * KC: Kecamatan (2 digits)
 * DDDD: Desa/Kelurahan (4 digits)
 * NNN: Nomor Urut (3 digits)
 */
export const REGISTRASI_REGEX = /^\d{2}\.\d{2}\.\d{2}\.\d{4}\.\d{3}$/
