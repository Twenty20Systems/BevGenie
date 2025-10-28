import { TrendingUp, Users } from "lucide-react"

const solutions = [
  {
    icon: TrendingUp,
    title: "For Marketing & Innovation",
    subtitle: "Always know which trends to bet on. Ask:",
    questions: [
      "Which flavors and formats are accelerating across categories?",
      "Which competitors just filed new expanded distribution?",
      "How did our latest campaign shift velocity by market?",
    ],
    accentColor: "#00C8FF",
  },
  {
    icon: Users,
    title: "For Sales & Growth",
    subtitle: "Always know where to focus your next move. Ask:",
    questions: [
      "Which territories are pacing ahead or behind target?",
      "Which distributors are maximizing execution and compliance?",
      "Which accounts are expanding assortment fastest?",
    ],
    accentColor: "#AA6C39",
  },
]

export function Solutions() {
  return (
    <section className="py-20 md:py-32 bg-[#EBEFF2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-[#0A1930] text-3xl md:text-4xl lg:text-5xl mb-4">
            For teams who can't afford to guess
          </h2>
          <p className="text-[#333333] text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
            AI that delivers instant, trusted answers - grounded in mastered, multi-source industry data. Tailored,
            timely, and trustworthy, delivered when decisions matter most.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {solutions.map((solution, index) => {
            const Icon = solution.icon
            return (
              <div key={index} className="bg-[#FFFFFF] rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${solution.accentColor}20` }}>
                    <Icon style={{ color: solution.accentColor }} size={28} />
                  </div>
                  <h3 className="font-display font-semibold text-xl" style={{ color: solution.accentColor }}>
                    {solution.title}
                  </h3>
                </div>

                <p className="text-[#0A1930] font-semibold mb-6">{solution.subtitle}</p>

                <ul className="space-y-4">
                  {solution.questions.map((question, qIndex) => (
                    <li key={qIndex} className="flex items-start gap-3 text-[#333333] leading-relaxed">
                      <span className="mt-1 font-bold" style={{ color: solution.accentColor }}>
                        •
                      </span>
                      <span>"{question}"</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
