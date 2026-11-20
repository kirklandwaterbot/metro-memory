import { redirect } from 'next/navigation'

// The old research console was replaced by the Upcoming stations page.
export default function ResearchRedirect() {
  redirect('/admin/upcoming')
}
