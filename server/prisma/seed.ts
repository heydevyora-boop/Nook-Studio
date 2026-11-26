import { PrismaClient, ProjectCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // --- Demo accounts, one per role --------------------------------------------
  // Fixed, documented credentials for exercising role-based access control:
  // admin reaches the full /admin panel, staff/user are confined to the
  // public site. Change these before using this seed anywhere but a demo.
  const demoUsers = [
    { name: 'Studio Admin', username: 'admin', email: 'admin@nookkstudio.com', password: 'Admin@123', role: 'ADMIN' as const },
    { name: 'Staff Member', username: 'staff', email: 'staff@nookkstudio.com', password: 'Staff@123', role: 'STAFF' as const },
    { name: 'Studio User', username: 'user', email: 'user@nookkstudio.com', password: 'User@123', role: 'USER' as const },
  ]

  for (const demoUser of demoUsers) {
    const hashed = await bcrypt.hash(demoUser.password, 12)
    await prisma.user.upsert({
      where: { username: demoUser.username },
      update: { name: demoUser.name, email: demoUser.email, password: hashed, role: demoUser.role },
      create: {
        name: demoUser.name,
        username: demoUser.username,
        email: demoUser.email,
        password: hashed,
        role: demoUser.role,
      },
    })
  }
  console.log(`Seeded ${demoUsers.length} demo accounts (admin / staff / user)`)

  // --- Services --------------------------------------------------------------
  const services = [
    {
      title: 'Interior Designing',
      slug: 'interior-designing',
      description:
        'End-to-end interior design and 3D visualization — spatial concepts, material palettes and furnishing plans tailored to how you actually live.',
      icon: 'armchair',
      order: 1,
    },
    {
      title: 'Renovation & Redesigning',
      slug: 'renovation-redesigning',
      description:
        'Reimagining and rebuilding existing spaces, from structural changes to a complete style refresh.',
      icon: 'renovation',
      order: 2,
    },
    {
      title: 'Space Planning',
      slug: 'space-planning',
      description:
        'Layout and flow optimization for residential and commercial spaces, balancing function with feeling.',
      icon: 'layers',
      order: 3,
    },
    {
      title: 'Product Designing',
      slug: 'product-designing',
      description:
        'Bespoke furniture and object design, from concept sketches to fabrication-ready specifications.',
      icon: 'peacock',
      order: 4,
    },
    {
      title: 'Design Consultation',
      slug: 'design-consultation',
      description:
        'A focused session to help you make confident decisions on an existing space or an in-progress renovation.',
      icon: 'lotus',
      order: 5,
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    })
  }
  console.log(`Seeded ${services.length} services`)

  // --- Sample projects ---------------------------------------------------
  const projects = [
    {
      title: 'The Harmony Project',
      slug: 'the-harmony-project',
      location: 'New Delhi',
      category: ProjectCategory.INTERIOR_DESIGN,
      description:
        'The clients envisioned space that feels warm, elegant and comfortable, with a perfect balance of classic detailing and modern functionality. They wanted every space to feel welcoming, thoughtfully designed and truly their own.',
      shortDescription:
        'The clients envisioned space that feels warm, elegant and comfortable, with a perfect balance of classic detailing and modern functionality. They wanted every space to feel welcoming, thoughtfully designed and truly their own.',
      coverImage: '/projects/the-harmony-project/03-bedroom.jpg',
      images: [
        '/projects/the-harmony-project/03-bedroom.jpg',
        '/projects/the-harmony-project/01-entryway-wardrobe.jpg',
        '/projects/the-harmony-project/02-tv-media-wall.jpg',
        '/projects/the-harmony-project/04-living-room-sofa.jpg',
      ],
      featured: true,
      status: 'PUBLISHED' as const,
      year: 2025,
      client: 'Private Residence',
    },
    {
      title: 'A Pause From The Ordinary.',
      slug: 'aura-residence',
      location: 'Mumbai',
      category: ProjectCategory.SPACE_PLANNING,
      description:
        'A quiet corner where sunlight filters through the leaves, gentle pathways lead the way, and nature creates its own rhythm. An intimate escape designed for moments of peace.',
      shortDescription:
        'A quiet corner where sunlight filters through the leaves, gentle pathways lead the way, and nature creates its own rhythm. An intimate escape designed for moments of peace.',
      coverImage: '/projects/aura-residence/garden-path.jpg',
      images: ['/projects/aura-residence/garden-path.jpg'],
      featured: true,
      status: 'PUBLISHED' as const,
      year: 2025,
      client: null,
    },
    {
      title: 'Warmth, Crafted into Design',
      slug: 'solitude-suite',
      location: 'Bangalore',
      category: ProjectCategory.INTERIOR_DESIGN,
      description:
        'A balance of rich wooden accents, subtle textures and ambient lighting. Every element comes together to create a space that feels inviting, refined and effortlessly elegant.',
      shortDescription:
        'A balance of rich wooden accents, subtle textures and ambient lighting. Every element comes together to create a space that feels inviting, refined and effortlessly elegant.',
      coverImage: '/projects/solitude-suite/heritage-living.jpg',
      images: ['/projects/solitude-suite/heritage-living.jpg'],
      featured: true,
      status: 'PUBLISHED' as const,
      year: 2024,
      client: null,
    },
    {
      title: 'The Art of Slowing Down',
      slug: 'the-art-of-slowing-down',
      location: null,
      category: ProjectCategory.INTERIOR_DESIGN,
      description:
        'A warm blend of natural textures and ambient lighting, designed for moments that belong only to you.',
      shortDescription:
        'A warm blend of natural textures and ambient lighting, designed for moments that belong only to you.',
      coverImage: '/projects/the-art-of-slowing-down/library-room.jpg',
      images: ['/projects/the-art-of-slowing-down/library-room.jpg'],
      featured: true,
      status: 'PUBLISHED' as const,
      year: 2025,
      client: null,
    },
  ]

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    })
  }
  console.log(`Seeded ${projects.length} projects`)

  // --- Testimonials --------------------------------------------------------
  const testimonials = [
    {
      clientName: 'Ananya R.',
      projectTitle: 'The Harmony Project',
      content:
        'NOOKK STUDIO understood exactly what we wanted before we could put it into words. Every room feels calm and entirely ours.',
      rating: 5,
      isActive: true,
    },
    {
      clientName: 'Karan M.',
      projectTitle: 'Aura Residence',
      content:
        'The space planning alone transformed how our apartment works day to day. Meticulous, thoughtful, and genuinely collaborative.',
      rating: 5,
      isActive: true,
    },
  ]

  for (const testimonial of testimonials) {
    const existing = await prisma.testimonial.findFirst({
      where: { clientName: testimonial.clientName, projectTitle: testimonial.projectTitle },
    })
    if (!existing) {
      await prisma.testimonial.create({ data: testimonial })
    }
  }
  console.log(`Seeded ${testimonials.length} testimonials`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
