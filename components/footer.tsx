"use client";

import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="px-6 md:px-14 py-18 bg-[#00676E]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-8">
          <div className="flex flex-col gap-6 max-w-md">
            <h3 className="text-2xl text-white">WaistLess Foods</h3>

            <div className="flex items-center px-4 py-4 bg-white rounded">
              <input
                type="email"
                placeholder="Enter Your Email"
                className="flex-1 outline-none"
              />
              <Button>Subscribe</Button>
            </div>
          </div>

          <div className="flex gap-10 text-white">
            <div>
              <h4 className="font-medium mb-4">Quick Menu</h4>
              {["Home", "Recipes", "Blog"].map((link) => (
                <a key={link} href="#" className="block mb-2">
                  {link}
                </a>
              ))}
            </div>

            <div>
              <h4 className="font-medium mb-4">Licence</h4>
              {["Privacy Policy", "Terms"].map((link) => (
                <a key={link} href="#" className="block mb-2">
                  {link}
                </a>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-white text-center">
          © 2025 Amber. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
