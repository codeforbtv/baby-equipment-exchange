/**
 * @jest-environment jsdom
 */

import { act, render, screen } from '@testing-library/react'
import { getActiveDonations } from '@/api/firebase-donations'
import React, { Suspense } from 'react'
import Home from './page'

jest.mock('../api/firebase-donations', () => {
    return {
        __esModule: true,
        getActiveDonations: async () => {
            return [
                {
                    category: 'category',
                    brand: 'brand',
                    model: 'model',
                    description: 'description',
                    active: true,
                    images: ['data:image/png;base64'],
                    createdAt: new Date(Date.now()),
                    modifiedAt: new Date(Date.now())
                }
            ]
        }
    }
})

test('The category, brand, and model of a single active donation displays on the home page.', async () => {
    await act(async () => {
        render(
            <Suspense>
                <Home />
            </Suspense>
        )
    })
    const category = screen.getByText(/category/i)
    const brand = screen.getByText(/brand/i)
    const model = screen.getByText(/model/i)

    expect(category).toBeInTheDocument()
    expect(brand).toBeInTheDocument()
    expect(model).toBeInTheDocument()
})
