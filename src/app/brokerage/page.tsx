"use client";

import AboutSection from "../../shared/components/aboutSection/aboutSection";
import BigDivider from "../../shared/components/bigDivider/bigDivider";

const Brokerage = () => {
  return (
    <section className='mhWrapper flex-col'>
      <article className='container'>
        <div className='p-4 sm:p-6 animate-fadeInUp'>
          <h1 className='text-4xl pb-4'>About us</h1>
          <h2 className='text-3xl caveat'>
            And why we chose to connect supply and demand in a simple way
          </h2>
        </div>
      </article>
      <AboutSection
        title='Pablo offers his business'
        text='He posts his project or service on the board.'
        img='1'
      />
      <BigDivider />
      <AboutSection
        title='Marcelo is looking for an established project'
        text='He finds profitable investment opportunities.'
        img='2'
        inverted
      />
    </section>
  );
};

export default Brokerage;
