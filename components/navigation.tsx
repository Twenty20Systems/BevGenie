"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#0A1930]/95 backdrop-blur-sm shadow-lg" : "bg-gradient-to-b from-[#0A1930] to-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-24">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/images/bevgenie-logo.png"
              alt="BevGenie"
              width={500}
              height={300}
              className="h-12 md:h-16 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/about" className="text-[#FFFFFF] hover:text-[#00C8FF] transition-colors font-medium">
              About Us
            </Link>
            <Button className="bg-[#00C8FF] text-[#0A1930] hover:bg-[#00C8FF]/90 font-semibold">
              Talk to an expert
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-[#FFFFFF] p-2"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#00C8FF]/20">
            <div className="flex flex-col gap-4">
              <Link
                href="/about"
                className="text-[#FFFFFF] hover:text-[#00C8FF] transition-colors font-medium py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Button className="bg-[#00C8FF] text-[#0A1930] hover:bg-[#00C8FF]/90 font-semibold w-full">
                Talk to an expert
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
