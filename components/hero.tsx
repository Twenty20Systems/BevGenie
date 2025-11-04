import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { HeroBackgroundSlideshow } from "./hero-background-slideshow"

interface HeroProps {
  onCtaClick?: (text: string) => void;
}

export function Hero({ onCtaClick }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center bg-gradient-to-b from-[#0A1930] to-[#000000] pt-20 overflow-hidden">
      <HeroBackgroundSlideshow />

      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(to right, #00C8FF 1px, transparent 1px),
            linear-gradient(to bottom, #00C8FF 1px, transparent 1px)
          `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#0A1930] via-[#0A1930] to-transparent z-[3]" />

      <div className="absolute top-20 right-10 w-96 h-96 rounded-full border border-[#00C8FF]/20 opacity-30" />
      <div className="absolute top-40 right-32 w-64 h-64 rounded-full border border-[#00C8FF]/15 opacity-20" />

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#000000] to-transparent z-[5]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <h1 className="font-display font-extrabold text-[#FFFFFF] mb-6 leading-tight">
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-semibold mb-4">
                Simplify intelligence
              </span>
              <span className="block text-3xl sm:text-4xl md:text-4xl lg:text-4xl font-normal text-[#FFFFFF]/90">
                Get answers, not dashboards
              </span>
            </h1>

            <p className="text-[#FFFFFF]/80 text-base md:text-lg mb-6 leading-relaxed max-w-xl">
              Built specifically for beverage suppliers, BevGenie's AI uses mastered industry data and your performance
              signals to answer complex questions in seconds.
            </p>

            <p className="text-[#00C8FF] font-display font-semibold text-lg md:text-xl mb-8">
              Uncover sales opportunities. Sharpen go-to-market.
              <br />
              Grow with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button
                size="lg"
                className="bg-[#00C8FF] text-[#0A1930] hover:bg-[#00C8FF]/90 font-semibold text-lg px-8 py-6 group"
                onClick={() => onCtaClick?.('talk to an expert')}
              >
                Talk to an expert
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Button>
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>
    </section>
  )
}
