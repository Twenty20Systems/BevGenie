import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#0A1930] to-[#000000] pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-4xl">
          <h1 className="font-display font-extrabold text-[#FFFFFF] text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 leading-tight">
            Simplify Intelligence.
            <br />
            Get Answers,
            <br />
            <span className="text-balance">Not Dashboards.</span>
          </h1>

          <p className="text-[#FFFFFF]/90 text-lg md:text-xl mb-8 leading-relaxed max-w-3xl">
            Built specifically for beverage suppliers, BevGenie's AI uses mastered industry data and your performance
            signals to answer complex questions in seconds.
          </p>

          <p className="text-[#00C8FF] font-display font-semibold text-xl md:text-2xl mb-8">
            Uncover sales opportunities. Sharpen go-to-market.
            <br />
            Grow with confidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button
              size="lg"
              className="bg-[#00C8FF] text-[#0A1930] hover:bg-[#00C8FF]/90 font-semibold text-lg px-8 py-6 group"
            >
              Talk to an expert
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#EBEFF2] to-transparent" />
    </section>
  )
}
