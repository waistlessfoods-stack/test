import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Header Navigation */}
      <header className="flex justify-between items-start px-12 py-5 w-full bg-white">
        {/* Logo */}
        <div className="relative w-28 h-28">
          <Image
            src="/logo.png"
            alt="Waist Less Food Logo"
            width={119}
            height={119}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        {/* Navigation Container */}
        <div className="flex flex-col justify-center items-end gap-8">
          {/* Top Bar: CTA + Social Icons */}
          <div className="flex items-center gap-6">
            {/* CTA Button */}
            <Button variant="default" size="sm" className="px-2 py-2 text-xs rounded-sm">
              Complimentary Chef Consultation
            </Button>

            {/* Divider */}
            <div className="w-8 h-0 border border-[#19767C] rotate-90" />

            {/* Social Icons */}
            <div className="flex items-center gap-1.5">
              <a href="#" className="w-5 h-5 text-[#00676E]" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                </svg>
              </a>
              <a href="#" className="w-5 h-5 text-[#00676E]" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/>
                </svg>
              </a>
              <a href="#" className="w-5 h-5 text-[#00676E]" aria-label="Yelp">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.271 17.652c.276.342.616.496 1.03.496.413 0 .77-.154 1.03-.496l4.02-4.98c.275-.342.413-.703.413-1.084 0-.38-.138-.741-.413-1.083a1.484 1.484 0 0 0-1.03-.496h-8.04c-.414 0-.77.154-1.03.496-.276.342-.414.703-.414 1.083 0 .38.138.742.413 1.084l4.02 4.98z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex items-center gap-10">
            <a href="#" className="px-0 py-2 border-b border-[#09686E] text-[#09686E] font-semibold text-base uppercase">
              Home
            </a>
            <a href="#" className="text-[#464646] font-semibold text-base uppercase">
              About
            </a>
            <div className="flex justify-center items-center gap-1">
              <span className="text-[#464646] font-semibold text-base uppercase">
                CHEF SERVICES
              </span>
              <svg className="w-6 h-6 rotate-180" viewBox="0 0 24 24" fill="none">
                <path d="M7 10l5 5 5-5" stroke="#464646" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <a href="#" className="text-[#464646] font-semibold text-base uppercase">
              Recipes
            </a>
            <a href="#" className="text-[#464646] font-semibold text-base uppercase">
              Gallery
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative w-full h-[707px]">
        <Image
          src="/hero.png"
          alt="Hero Background"
          fill
          className="object-cover"
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-12 max-w-[562px] px-4">
            <div className="flex flex-col items-center gap-6">
              <h1 className="text-8xl md:text-[100px] leading-tight tracking-wide uppercase text-white text-center font-['Bebas_Neue']">
                Waste Less. Taste More.
              </h1>
              <p className="text-2xl md:text-[26px] leading-relaxed text-white text-center">
                Private Chef Amber curates fresh, flavorful meals, from pescatarian feasts to hearty family dinners, with an eco-conscious touch.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <Button size="lg" className="px-6 py-4 text-xl h-auto">
                Book a Private Experience
              </Button>
              <Button variant="outline" size="lg" className="px-6 py-4 border-2 border-white bg-transparent text-white text-xl h-auto hover:bg-white/10">
                View Services
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-28 py-20 bg-white">
        <div className="flex flex-col items-center gap-6 mb-20">
          <h2 className="text-4xl md:text-[44px] font-medium text-black text-center">
            SIMPLE. SUSTAINABLE. DELICIOUS.
          </h2>
          <p className="text-xl md:text-[30px] leading-relaxed text-[#838383] text-center max-w-5xl">
            We make healthy, eco-conscious eating easy for everyone. Discover recipes and habits that taste as good as they feel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="flex flex-col h-full">
            <div className="relative w-full h-64 bg-gray-200">
              <Image src="/highlight/recipe.png" alt="Recipes" fill className="object-cover" />
            </div>
            <div className="flex flex-col justify-between items-center px-6 py-8 gap-9 bg-[#F2F2F2] flex-1">
              <div className="flex flex-col gap-6">
                <h3 className="text-3xl font-semibold text-black">
                  RECIPES FOR EVERY MOOD
                </h3>
                <p className="text-xl text-black">
                  Find delicious inspiration for every occasion — from quick bites to weekend-worthy meals.
                </p>
              </div>
              <Button size="lg" className="px-6 py-4 text-xl font-medium h-auto">
                More Info
              </Button>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col h-full">
            <div className="relative w-full h-64 bg-gray-200">
              <Image src="/highlight/eco-living.png" alt="Eco Living" fill className="object-cover" />
            </div>
            <div className="flex flex-col justify-between items-center px-6 py-8 gap-9 bg-[#F2F2F2] flex-1">
              <div className="flex flex-col gap-6">
                <h3 className="text-3xl font-semibold text-black">
                  ECO LIVING TIPS
                </h3>
                <p className="text-xl text-black">
                  Learn simple, sustainable habits to make your kitchen and home more eco-friendly.
                </p>
              </div>
              <Button size="lg" className="px-6 py-4 text-xl font-medium h-auto">
                More Info
              </Button>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col h-full">
            <div className="relative w-full h-64 bg-gray-200">
              <Image src="/highlight/meet-chef.png" alt="Meet Chef Amber" fill className="object-cover" />
            </div>
            <div className="flex flex-col justify-between items-center px-6 py-8 gap-9 bg-[#F2F2F2] flex-1">
              <div className="flex flex-col gap-6">
                <h3 className="text-3xl font-semibold text-black">
                  MEET CHEF AMBER
                </h3>
                <p className="text-xl text-black">
                  Discover Chef Amber&apos;s story, her cooking philosophy, and the passion behind every flavorful dish.
                </p>
              </div>
              <Button size="lg" className="px-6 py-4 text-xl font-medium h-auto">
                More Info
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About Chef Amber Section */}
      <section className="flex flex-col md:flex-row w-full bg-[#388082]">
        <div className="relative w-full md:w-[546px] h-96 md:h-auto bg-gray-300">
          <Image
            src="/highlight/meet-chef.png"
            alt="Chef Amber"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex-1 px-6 md:px-12 py-12 bg-white">
          <div className="flex flex-col gap-10 max-w-3xl">
            <div className="flex flex-col gap-9">
              <h2 className="text-4xl font-semibold text-black">
                ABOUT CHEF AMBER
              </h2>
              <p className="text-xl leading-relaxed font-semibold text-black">
                Chef Amber is the creative force behind WaistLess Foods, blending flavor, sustainability, and heart into every dish she makes. As a Houston-based private chef, Amber transforms everyday ingredients into soulful, nourishing meals designed to make healthy eating effortless and enjoyable. Her journey began cooking for her family of four — now it&apos;s her mission to show that mindful cooking can be both exciting and full of love.
              </p>

              <div className="flex flex-col gap-3">
                {[
                  'Sustainable Cooking',
                  'Flavor-Driven Recipes',
                  'Family-Inspired Meals',
                  'Always Made with Care'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-4">
                    <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="#388082">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                    <span className="text-lg font-semibold text-[#388082]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="px-6 py-4 text-xl font-medium self-start h-auto">
              Meet Chef Amber
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="px-6 md:px-24 py-20 bg-white">
        <h2 className="text-6xl md:text-[80px] leading-tight text-black text-center mb-14 font-['Bebas_Neue']">
          Featured Recipes
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'BREAKFAST', image: '/featured/breakfast.png' },
            { title: 'LUNCH', image: '/featured/lunch.png' },
            { title: 'DINNER', image: '/featured/dinner.png' },
            { title: 'DESSERT', image: '/featured/dessert.png' }
          ].map((recipe) => (
            <a key={recipe.title} href="#" className="relative h-[369px] bg-gray-400 group cursor-pointer block">
              <Image src={recipe.image} alt={recipe.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all duration-300" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-5">
                  <h3 className="text-5xl leading-tight uppercase text-white text-center font-['Bebas_Neue']">
                    {recipe.title}
                  </h3>
                  <div className="w-40 h-px bg-white" />
                </div>
                <Button variant="outline" className="px-3.5 py-2.5 border-white bg-transparent text-white hover:bg-white/20 h-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  CLICK FOR MORE
                </Button>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="relative w-full h-[619px]">
        <Image src="/testimonial.png" alt="Background" fill className="object-cover" />
        
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <Carousel className="w-full max-w-5xl">
            <CarouselContent>
              <CarouselItem>
                <div className="relative w-full p-10 md:p-16 bg-white/80 backdrop-blur-sm rounded-md border-4 border-[#16B0B9]">
                  <div className="flex flex-col items-center gap-6">
                    <h3 className="text-3xl text-[#5B5B5B] text-center font-['Royale_Couture']">
                      Cooking Class
                    </h3>
                    <div className="flex flex-col items-center gap-5">
                      <p className="text-lg md:text-xl leading-relaxed text-[#5B5B5B] text-center">
                        &quot; I&apos;m a realtor and I hired Chef Amber to help me bring a unique idea to life. A cooking class attached to a finance class. Sounds crazy but everyone loved it. They appreciated the gems she dropped, her made from scratch sauces and her personality. At one point the room filled with 20+ people was dead silent. Now you know when people are silent and they are eating that means the food is good! I can&apos;t wait to work with her again. She was professional, intentional about the details and did I mention how good the food was. Oh that&apos;s right I already did. &quot;
                      </p>
                      <p className="text-xl font-bold text-[#5B5B5B]">
                        -Lisa Barnes, J. Barnes Realty-
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative w-full p-10 md:p-16 bg-white/80 backdrop-blur-sm rounded-md border-4 border-[#16B0B9]">
                  <div className="flex flex-col items-center gap-6">
                    <h3 className="text-3xl text-[#5B5B5B] text-center font-['Royale_Couture']">
                      Private Chef Service
                    </h3>
                    <div className="flex flex-col items-center gap-5">
                      <p className="text-lg md:text-xl leading-relaxed text-[#5B5B5B] text-center">
                        &quot; Chef Amber exceeded all expectations! The meal was absolutely divine and perfectly suited to our dietary preferences. Her attention to detail and passion for sustainable cooking truly shines through in every dish. &quot;
                      </p>
                      <p className="text-xl font-bold text-[#5B5B5B]">
                        -Sarah M., Houston-
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="relative w-full p-10 md:p-16 bg-white/80 backdrop-blur-sm rounded-md border-4 border-[#16B0B9]">
                  <div className="flex flex-col items-center gap-6">
                    <h3 className="text-3xl text-[#5B5B5B] text-center font-['Royale_Couture']">
                      Family Meal Prep
                    </h3>
                    <div className="flex flex-col items-center gap-5">
                      <p className="text-lg md:text-xl leading-relaxed text-[#5B5B5B] text-center">
                        &quot; Working with Chef Amber has transformed how our family eats. Her meal prep services are a lifesaver, and everything is so fresh and delicious. Our kids actually ask for seconds of vegetables now! &quot;
                      </p>
                      <p className="text-xl font-bold text-[#5B5B5B]">
                        -The Johnson Family-
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-4 md:left-14 w-14 h-14 bg-[#0F8DAB] border-0 hover:bg-[#0d7691]" />
            <CarouselNext className="right-4 md:right-14 w-14 h-14 bg-[#0F8DAB] border-0 hover:bg-[#0d7691]" />
          </Carousel>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-14 py-18 bg-[#00676E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-8">
            {/* Brand & Newsletter */}
            <div className="flex flex-col gap-6 max-w-md">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl text-white font-['Danegren']">
                  WaistLess Foods
                </h3>
                <p className="text-base text-white">
                  Eat well. Live bright. Waste less. 🌿
                </p>
              </div>

              <div className="flex items-center justify-between px-4 py-4 bg-white rounded">
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  className="flex-1 text-base text-gray-500 bg-transparent outline-none"
                />
                <Button className="px-4 py-2.5 rounded-xl font-semibold h-auto">
                  Subscribe
                </Button>
              </div>
            </div>

            {/* Footer Links */}
            <div className="flex gap-10">
              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-medium text-white">Quick Menu</h4>
                <div className="flex flex-col gap-4">
                  {['Home', 'Meet Chef Amber', 'Recipes & Lifestyle', 'Blog'].map((link) => (
                    <a key={link} href="#" className="text-base font-semibold text-white hover:text-white/80 transition">
                      {link}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <h4 className="text-lg font-medium text-white">Licence</h4>
                <div className="flex flex-col gap-4">
                  {['Privacy Policy', 'Copyright', 'Term & Condition'].map((link) => (
                    <a key={link} href="#" className="text-base font-semibold text-white hover:text-white/80 transition">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 mb-8" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              {['instagram', 'facebook', 'yelp'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition"
                  aria-label={social}
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="white">
                    {social === 'instagram' && (
                      <path d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm6.5-.25a1.25 1.25 0 0 0-2.5 0 1.25 1.25 0 0 0 2.5 0zM12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                    )}
                    {social === 'facebook' && (
                      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/>
                    )}
                    {social === 'yelp' && (
                      <path d="M12.271 17.652c.276.342.616.496 1.03.496.413 0 .77-.154 1.03-.496l4.02-4.98c.275-.342.413-.703.413-1.084 0-.38-.138-.741-.413-1.083a1.484 1.484 0 0 0-1.03-.496h-8.04c-.414 0-.77.154-1.03.496-.276.342-.414.703-.414 1.083 0 .38.138.742.413 1.084l4.02 4.98z"/>
                    )}
                  </svg>
                </a>
              ))}
            </div>

            <p className="text-xs text-white">
              © 2025 Amber. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
