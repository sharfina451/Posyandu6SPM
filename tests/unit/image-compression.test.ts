import { describe, it, expect } from 'vitest'
import { compressImage, getCompressedSizeRatio } from '../../lib/utils/image-compression'

describe('image-compression utilities', () => {
  describe('getCompressedSizeRatio', () => {
    it('calculates savings ratio correctly', () => {
      expect(getCompressedSizeRatio(100, 30)).toBe('70%')
      expect(getCompressedSizeRatio(1000, 250)).toBe('75%')
      expect(getCompressedSizeRatio(500, 500)).toBe('0%')
      expect(getCompressedSizeRatio(0, 10)).toBe('0%')
    })
  })

  describe('compressImage fallback check', () => {
    it('returns the same file if not in browser environment (e.g. Node tests)', async () => {
      // Mock File object
      const dummyFile = new File(['dummy content'], 'test.png', { type: 'image/png' })
      const result = await compressImage(dummyFile)
      expect(result).toBe(dummyFile)
    })

    it('returns the same file if file is not an image type', async () => {
      const dummyFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' })
      const result = await compressImage(dummyFile)
      expect(result).toBe(dummyFile)
    })
  })
})
