"use client";

import CreatePost from "../../shared/components/createPost/createPost";
import Dashboard from "../../shared/components/dashboard/dashboard";
import { useAuth } from "../utils/isAuth";

const steps = [
  {
    title: "Initial Consultation",
    description: "Learn your goals, timeline, and exit expectations.",
  },
  {
    title: "Business Evaluation",
    description:
      "Analyze financials, market position, and assets to determine fair market value.",
  },
  {
    title: "Tailored Marketing Strategy",
    description:
      "Develop a confidential, targeted plan to reach qualified buyers.",
  },
  {
    title: "Buyer Engagement",
    description:
      "Present your business to vetted buyers and highlight its unique strengths.",
  },
  {
    title: "Expert Negotiation",
    description:
      "Leverage our experience to secure the best terms and protect your interests.",
  },
  {
    title: "Closing & Transition",
    description:
      "Support you through legal, financial, and operational steps until the deal is finalized.",
  },
];

const benefits = [
  "Understanding your personal and financial goals.",
  "Showcasing your business's history, operations, and reputation.",
  "Evaluating financial performance and key selling points.",
  "Designing a tailored marketing strategy to reach qualified buyers.",
  "Positioning your company to attract serious interest from acquirers, private equity, and investors.",
  "Negotiating from a position of strength to protect your legacy.",
];

const Seller = () => {
  const { isLoggedIn } = useAuth();

  return (
    <section className='mhWrapper flex-col'>
      {/* Hero */}
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Sell-Side Business Brokerage</h1>
          <p className='text-lg max-w-2xl leading-relaxed opacity-90'>
            Selling your roofing business is more than a transaction. It&apos;s
            a decision that impacts your legacy, your team, and your future. Our
            role is to guide you every step of the way, ensuring your business
            is valued, marketed, and sold with integrity and care.
          </p>
        </div>
      </article>

      {/* Why Broker section */}
      <article className='container p-4 sm:p-6 animate-fadeInUp'>
        <span className='inline-block text-xs font-semibold uppercase tracking-widest opacity-60 pb-4'>
          Investment-Grade Readiness Assessment
        </span>
        <h2 className='text-3xl pb-4'>
          Why Selling Your Roofing Business with a Broker Matters
        </h2>
        <p className='text-lg max-w-2xl leading-relaxed opacity-90 pb-6'>
          Our exclusive focus on the roofing industry gives us unmatched insight
          into what drives buyer interest and value. We go beyond numbers to
          highlight the true strengths of your business and position it for the
          best possible outcome.
        </p>
        <p className='text-base font-semibold pb-3'>We help you by:</p>
        <ul className='flex flex-col gap-2 max-w-xl'>
          {benefits.map((benefit, i) => (
            <li key={i} className='flex items-start gap-3'>
              <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-white opacity-70' />
              <span className='text-base leading-relaxed opacity-90'>
                {benefit}
              </span>
            </li>
          ))}
        </ul>
      </article>

      {/* Comprehensive Sale Process */}
      <article className='container p-4 sm:p-6 pb-10 animate-fadeInUp'>
        <h2 className='text-3xl pb-10'>Comprehensive Sale Process</h2>

        {/* Horizontal stepper — scrollable on small screens */}
        <div className='overflow-x-auto pb-4'>
          <div className='flex min-w-[720px]'>
            {steps.map((step, i) => (
              <div
                key={i}
                className='relative flex flex-1 flex-col items-center text-center px-2'
              >
                {/* Connector line to next step */}
                {i < steps.length - 1 && (
                  <div className='absolute top-5 left-1/2 w-full h-px bg-white/30' />
                )}

                {/* Step circle */}
                <div className='relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/10 text-sm font-bold backdrop-blur-sm'>
                  {i + 1}
                </div>

                {/* Step content */}
                <h3 className='mt-4 text-sm font-semibold leading-tight'>
                  {step.title}
                </h3>
                <p className='mt-2 text-xs leading-relaxed opacity-75 max-w-[140px]'>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </article>
      {isLoggedIn && (
        <>
          <CreatePost />
          <Dashboard />
        </>
      )}
    </section>
  );
};

export default Seller;
