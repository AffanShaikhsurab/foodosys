import CourtCard from './CourtCard'

export default function CourtList() {
  // Sample data for food courts
  const courts = [
    {
      id: 1,
      name: 'Amoeba',
      location: 'Near GEC-2',
      distance: '900m',
      status: 'available' as const,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      slug: 'amoeba'
    },
    {
      id: 2,
      name: 'Arena Court',
      location: 'Near Multiplex',
      distance: '700m',
      status: 'missing' as const,
      imageUrl: 'https://images.unsplash.com/photo-1554679665-f5537f187268?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      slug: 'arena'
    },
    {
      id: 3,
      name: 'Oasis',
      location: 'Near ILI Building',
      distance: '1.2km',
      status: 'available' as const,
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      slug: 'oasis'
    },
    {
      id: 4,
      name: 'Magna Food Court',
      location: 'Inside GEC-2',
      distance: '300m',
      status: 'available' as const,
      imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      slug: 'magna'
    },
    {
      id: 5,
      name: 'Fiesta Food Court',
      location: 'Near Gate-2',
      distance: '500m',
      status: 'missing' as const,
      imageUrl: 'https://images.unsplash.com/photo-1554679665-f5537f187268?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
      slug: 'fiesta'
    }
  ]

  return (
    <div className="court-list">
      {courts.map((court) => (
        <CourtCard key={court.id} court={court} />
      ))}
    </div>
  )
}