import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles clicks', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows loading state and disables button', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when the disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies variant classes', () => {
    const { container } = render(<Button variant="primary">Primary</Button>)
    expect(container.firstChild).toHaveClass('btn-primary')
  })
})
