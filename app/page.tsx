import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { Challenges } from "@/components/challenges"
import { DataPowered } from "@/components/data-powered"
import { Solutions } from "@/components/solutions"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <Challenges />
      <DataPowered />
      <Solutions />
      <Footer />
    </main>
  )
}
