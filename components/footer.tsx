"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import Image from "next/image";
import { getIconPath } from "@/lib/social-links";
import type { SocialLink } from "@/lib/contentful-links";
import Link from "next/link";

export default function Footer({ socialLinks = [] }: { socialLinks?: SocialLink[] }) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setMessage("Thank you for subscribing!");
      setEmail("");
    } catch (error) {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="px-6 md:px-14 py-18 bg-[#00676E]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-8">
          <div className="flex flex-col gap-6 max-w-md">
            <h3 className="text-2xl text-white">WaistLess Foods</h3>

            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <div className="flex items-center px-4 py-4 bg-white rounded">
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  className="flex-1 outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </div>
              {message && (
                <p className="text-sm text-white">{message}</p>
              )}
            </form>
          </div>

          <div className="flex gap-10 text-white">
            <div>
              <h4 className="font-medium mb-4">Quick Menu</h4>
              <Link href="/" className="block mb-2">
                Home
              </Link>
              <Link href="/recipes" className="block mb-2">
                Recipes
              </Link>
              <Link href="/about" className="block mb-2">
                About
              </Link>
            </div>

            <div>
              <h4 className="font-medium mb-4">Follow Us</h4>
              <div className="flex flex-col gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.title}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <Image
                      alt={social.title}
                      width={20}
                      height={20}
                      src={getIconPath(social.icon)}
                      className="brightness-0 invert"
                    />
                    <span className="text-sm">{social.title}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-white text-center">
          © {new Date().getFullYear()} waistlessfoods.com. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
