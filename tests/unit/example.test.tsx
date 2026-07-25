import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button component', () => {
  it('renders correctly', () => {
    render(<Button>Halo Posyandu</Button>)
    expect(screen.getByRole('button', { name: /halo posyandu/i })).toBeInTheDocument()
  })
})
