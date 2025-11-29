'use client'

import { useState } from 'react'

export default function FilterSection() {
  const [activeFilter, setActiveFilter] = useState('Nearest First')
  
  const filters = ['Nearest First', 'Vegetarian', 'Wait Time']
  
  return (
    <div className="filter-scroller">
      {filters.map((filter) => (
        <div
          key={filter}
          className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
          onClick={() => setActiveFilter(filter)}
        >
          {filter}
        </div>
      ))}
    </div>
  )
}