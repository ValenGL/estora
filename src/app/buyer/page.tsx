"use client";

import { useAuth } from "../utils/isAuth";

const steps = [
  { title: "Initial Consultation", description: "Supporting you through closing and transition." },
  { title: "Target Identification", description: "Leverage our network to find roofing businesses that fit your strategy." },
  { title: "Due Diligence", description: "Evaluate financial health, operational efficiency, and market position." },
  { title: "Negotiation", description: "Secure fair terms and advocate on your behalf to get the best deal." },
  { title: "Closing", description: "Manage the transaction process from start to finish." },
  { title: "Transition Support", description: "Provide guidance to ensure a smooth integration and successful handover." },
];

const benefits = [
  "Understanding your growth goals and acquisition strategy.",
  "Identifying roofing businesses that align with your criteria.",
  "Reviewing financials, operations, and market position.",
  "Conducting thorough due diligence.",
  "Negotiating terms that protect your interests.",
  "Supporting you through closing and transition.",
];

const Buyer = () => {
  const { isLoggedIn } = useAuth();

  return (
    <section className='mhWrapper flex-col'>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>Acquire Roofing Businesses with Confidence</h1>
          <p className='text-lg max-w-2xl leading-relaxed opacity-90 pb-3'>
            We help investors and operators identify, evaluate, and acquire high-quality roofing companies.
          </p>
          <p className='text-lg max-w-2xl leading-relaxed opacity-90'>
            If you&apos;re looking to buy a roofing business, our team provides the expertise and process
            to help you identify and acquire the right opportunity.
          </p>
        </div>
      </article>
      <article className='container p-4 sm:p-6 animate-fadeInUp'>
        <h2 className='text-3xl pb-4'>Why Acquisition Matters</h2>
        <p className='text-lg max-w-2xl leading-relaxed opacity-90 pb-6'>
          Acquiring a roofing business is one of the fastest ways to grow your company,
          expand market share, and increase profitability.
        </p>
        <p className='text-base font-semibold pb-3'>We help you by:</p>
        <ul className='flex flex-col gap-2 max-w-xl'>
          {benefits.map((benefit, i) => (
            <li key={i} className='flex items-start gap-3'>
              <span className='mt-1 h-2 w-2 shrink-0 rounded-full bg-white opacity-70' />
              <span className='text-base leading-relaxed opacity-90'>{benefit}</span>
            </li>
          ))}
        </ul>
      </article>

      <article className='container p-4 sm:p-6 pb-10 animate-fadeInUp'>
        <span className='inline-block text-xs font-semibold uppercase tracking-widest opacity-60 pb-4'>
          Buy-Side Business Brokerage
        </span>
        <h2 className='text-3xl pb-10'>Comprehensive Acquisition Process</h2>
        <div className='overflow-x-auto pb-4'>
          <div className='flex min-w-[720px]'>
            {steps.map((step, i) => (
              <div key={i} className='relative flex flex-1 flex-col items-center text-center px-2'>
                {i < steps.length - 1 && (
                  <div className='absolute top-5 left-1/2 w-full h-px bg-white/30' />
                )}
                <div className='relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white bg-white/10 text-sm font-bold backdrop-blur-sm'>
                  {i + 1}
                </div>
                <h3 className='mt-4 text-sm font-semibold leading-tight'>{step.title}</h3>
                <p className='mt-2 text-xs leading-relaxed opacity-75 max-w-[140px]'>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </article>

      {isLoggedIn && (
        <article className='container p-4 sm:p-6 animate-fadeInUp'>
          <p className='text-base opacity-60'>Buyer marketplace coming in Sprint 2.</p>
        </article>
      )}
    </section>
  );
};

export default Buyer;
