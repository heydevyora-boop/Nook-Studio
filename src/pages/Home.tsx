import Header from '../components/Header'
import Hero from '../components/Hero'
import MinimalEleganceBar from '../components/MinimalEleganceBar'
import ServicesBar from '../components/ServicesBar'
import FeaturedProjects from '../components/FeaturedProjects'
import About from '../components/About'
import Journal from '../components/Journal'
import CTA from '../components/CTA'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <div className="bg-brand-cream text-brand-dark selection:bg-brand-accent selection:text-white antialiased overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <MinimalEleganceBar />
        <ServicesBar />
        <FeaturedProjects />
        <About />
        <Journal />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}
