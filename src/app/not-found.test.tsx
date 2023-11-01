/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import NotFound from './not-found'

test('renders error message', () => {
    render(<NotFound />)
    const errorMessage = screen.getByText(/404./i)
    expect(errorMessage).toBeInTheDocument()
})
