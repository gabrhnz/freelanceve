"use client";

import { useState } from "react";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { CATEGORIES } from "@/lib/constants";
import ServiceCard from "@/components/ServiceCard";
import { useServices } from "@/hooks/useServices";
import {
  Code,
  Palette,
  FileCode2,
  TrendingUp,
  Video,
  Zap,
  DollarSign,
  Shield,
  Clock,
  ArrowRight,
  CircleDollarSign,
  Users,
  Star,
} from "lucide-react";

const CATEGORY_CARDS = [
  {
    icon: Code,
    title: "Web Development",
    desc: "Full-stack developers ready to build your next app, website, or SaaS. Pay securely with USDC.",
  },
  {
    icon: Palette,
    title: "UI/UX Design",
    desc: "Professional designers creating stunning interfaces and user experiences for your digital products.",
  },
  {
    icon: FileCode2,
    title: "Smart Contracts",
    desc: "Solana and blockchain experts to develop, audit, and deploy your smart contracts securely.",
  },
  {
    icon: TrendingUp,
    title: "Marketing & SEO",
    desc: "Growth hackers and marketers to boost your online presence and drive organic traffic.",
  },
  {
    icon: Video,
    title: "Video & Motion",
    desc: "Creative professionals for video editing, animations, and motion graphics for your brand.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Users,
    title: "Create Your Profile",
    desc: "Sign up as a freelancer or client. Connect your Solana wallet to receive or send USDC payments securely.",
  },
  {
    step: "02",
    icon: CircleDollarSign,
    title: "Find or Post Services",
    desc: "Browse thousands of services or create your own gig. Set your prices in USDC and reach clients worldwide.",
  },
  {
    step: "03",
    icon: Shield,
    title: "Secure Escrow",
    desc: "Funds are held in smart contract escrow until work is approved. Both parties are protected throughout the process.",
  },
  {
    step: "04",
    icon: Zap,
    title: "Instant Payment",
    desc: "Once work is approved, USDC is released instantly to the freelancer. No delays, no hidden fees.",
  },
];

export default function HomePage() {
  const { publicKey } = useWallet();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const { services, loading } = useServices();

  const filtered =
    selectedCategory === "All"
      ? services
      : services.filter((s) => s.account.categoria === selectedCategory);

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900 to-ve-blue px-6 py-20 text-center text-white sm:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ve-blue/20 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-gray-300 backdrop-blur-sm">
            <CircleDollarSign className="h-4 w-4 text-green-400" />
            Powered by Solana &middot; Payments in USDC
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Hire Freelancers and pay with{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              USDC
            </span>{" "}
            on Solana
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400 sm:text-xl">
            The first freelance marketplace powered by Solana. Fast transactions,
            low fees, and secure payments with USDC stablecoin. Find top talent
            or offer your services today.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 font-bold text-gray-900 shadow-lg transition hover:bg-gray-100"
            >
              Start Freelancing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-8 py-3.5 font-bold text-white transition hover:bg-white/5"
            >
              Browse Services
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold dark:text-white sm:text-4xl">
            Popular service categories
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
            Browse thousands of skilled freelancers ready to work. All payments
            processed instantly through Solana with USDC stablecoin.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.title}
              href={`#services`}
              onClick={() => setSelectedCategory(cat.title)}
              className="group rounded-2xl border border-gray-200 bg-white p-6 transition hover:border-ve-blue/30 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 dark:hover:border-green-500/30"
            >
              <div className="mb-4 inline-flex rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
                <cat.icon className="h-6 w-6 text-ve-blue dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 group-hover:text-ve-blue dark:text-white dark:group-hover:text-green-400">
                {cat.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {cat.desc}
              </p>
            </Link>
          ))}
          <Link
            href="/register"
            className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-6 transition hover:border-ve-blue dark:border-gray-700 dark:hover:border-green-500"
          >
            <div className="mb-3 inline-flex rounded-xl bg-ve-blue/10 p-3 dark:bg-green-500/10">
              <ArrowRight className="h-6 w-6 text-ve-blue dark:text-green-400" />
            </div>
            <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white">
              Become a Freelancer
            </h3>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Offer your skills and start earning USDC on Solana.
            </p>
          </Link>
        </div>
      </section>

      {/* Why USDC on Solana */}
      <section className="rounded-3xl bg-gray-50 px-6 py-16 dark:bg-gray-900/50 sm:px-12">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold dark:text-white sm:text-4xl">
            Why pay with USDC on Solana?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
            Say goodbye to high fees and slow international transfers. USDC is a
            stablecoin pegged to the US dollar, and Solana provides
            lightning-fast transactions at minimal cost.
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Clock,
              title: "Instant Payments",
              desc: "Transactions settle in seconds, not days. Freelancers get paid instantly when work is approved.",
            },
            {
              icon: DollarSign,
              title: "Ultra-Low Fees",
              desc: "Solana transactions cost fractions of a cent. Keep more of what you earn compared to traditional platforms.",
            },
            {
              icon: Shield,
              title: "Stable Value",
              desc: "USDC maintains a 1:1 peg with the US dollar. No volatility, no surprises — just stable payments.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mx-auto mb-4 inline-flex rounded-full bg-green-100 p-4 dark:bg-green-900/30">
                <item.icon className="h-7 w-7 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Browse Services */}
      <section id="services">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-3xl font-extrabold dark:text-white">
              Browse Services
            </h2>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Find the perfect freelancer for your project
            </p>
          </div>
          {publicKey && (
            <Link
              href="/services/new"
              className="inline-flex items-center gap-2 rounded-xl bg-ve-blue px-6 py-2.5 font-bold text-white shadow transition hover:bg-ve-blue/90"
            >
              Post a Service
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                selectedCategory === cat
                  ? "bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-900 border-t-transparent dark:border-white dark:border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center dark:border-gray-800">
            <p className="text-lg text-gray-500 dark:text-gray-400">
              No services available in this category yet.
            </p>
            {publicKey && (
              <Link
                href="/services/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2 font-semibold text-white dark:bg-white dark:text-gray-900"
              >
                Be the first to post
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ServiceCard
                key={s.publicKey.toBase58()}
                service={s.account}
                publicKey={s.publicKey}
              />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section>
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold dark:text-white sm:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
            Getting started is simple. Our platform handles all the complexity of
            blockchain payments so you can focus on what matters — doing great
            work and getting paid.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.step}
              className="relative rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
            >
              <span className="absolute right-4 top-4 text-4xl font-extrabold text-gray-100 dark:text-gray-800">
                {item.step}
              </span>
              <div className="relative mb-4 inline-flex rounded-xl bg-gray-100 p-3 dark:bg-gray-800">
                <item.icon className="h-6 w-6 text-ve-blue dark:text-green-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold dark:text-white">
                {item.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-8 py-3.5 font-bold text-white shadow-lg transition hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
          >
            Get Started Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Testimonial */}
      <section className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 px-6 py-16 text-center text-white sm:px-12">
        <h2 className="text-3xl font-extrabold sm:text-4xl">
          What our users say
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-400">
          Thousands of freelancers and clients are already using our platform to
          work together and get paid with USDC on Solana.
        </p>
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-4 flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="h-5 w-5 fill-ve-yellow text-ve-yellow"
              />
            ))}
          </div>
          <blockquote className="text-lg italic text-gray-200">
            &ldquo;Finally a freelance platform that pays instantly! I completed a
            project on Friday and had USDC in my wallet within minutes. No more
            waiting weeks for international bank transfers. This is the future of
            freelancing.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-gray-400">
            — Freelancer on Solana Devnet
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <h2 className="text-3xl font-extrabold dark:text-white sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-500 dark:text-gray-400">
          Join the freelance marketplace powered by Solana. Fast payments, low
          fees, global reach.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-ve-blue px-8 py-3.5 font-bold text-white shadow-lg transition hover:bg-ve-blue/90"
          >
            Become a Freelancer
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="#services"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-8 py-3.5 font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
          >
            Browse Services
          </Link>
        </div>
      </section>
    </div>
  );
}
