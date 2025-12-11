import RestaurantDetail from '@/components/RestaurantDetail'

export default function RestaurantPage({ params }: { params: { slug: string } }) {
  return <RestaurantDetail params={params} />
}