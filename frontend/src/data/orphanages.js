export const orphanageItems = [
  {
    id: 1,
    name: "Hope Children's Home",
    city: 'Mumbai',
    country: 'India',
    activeProjects: 3,
    totalRaised: 487500,
    image:
      'https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=1600&auto=format&fit=crop',
    verified: true,
    intro:
      "Hope Children's Home has been providing care, education, and support to orphaned and vulnerable children since 1995. We are committed to transparency and ensuring every child receives quality education, healthcare, and a loving environment.",
  },
  {
    id: 2,
    name: 'Sunshine Orphanage',
    city: 'Nairobi',
    country: 'Kenya',
    activeProjects: 2,
    totalRaised: 325000,
    image:
      'https://images.unsplash.com/photo-1588580000645-4562a6d2c839?q=80&w=1600&auto=format&fit=crop',
    verified: true,
    intro:
      'Sunshine Orphanage provides education support and housing to vulnerable children with a focus on community integration and health.',
  },
  {
    id: 3,
    name: 'Little Angels Foundation',
    city: 'Manila',
    country: 'Philippines',
    activeProjects: 4,
    totalRaised: 298000,
    image:
      'https://images.unsplash.com/photo-1501432377862-3d0432b87a14?q=80&w=1600&auto=format&fit=crop',
    verified: true,
    intro:
      'Little Angels Foundation is dedicated to providing safe shelter and quality education while building life skills for the future.',
  },
]

export const getOrphanageById = (id) => orphanageItems.find((o) => String(o.id) === String(id))
