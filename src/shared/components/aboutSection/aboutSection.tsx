"use client";

import Image from "next/image";

interface AboutSectionProps {
  title: string;
  text: string;
  img: string;
  inverted?: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({
  title,
  text,
  img,
  inverted = false,
}) => {
  const getImageSrc = (imgName: string): string => {
    switch (imgName) {
      case "1":
        return "/assets/images/1.png";
      case "2":
        return "/assets/images/2.png";
      default:
        return "/assets/images/iphone.png";
    }
  };

  const imageUrl = getImageSrc(img);

  return (
    <>
      <section className='grid grid-cols-3 items-center p-6'>
        <article
          className={`justify-self-center pr-4 sm:mr-6 ${
            inverted && "invisible"
          }`}
        >
          {!inverted && (
            <>
              <h2 className='text-2xl sm:text-5xl pb-2 caveat'>{title}</h2>
              <p className='text-md sm:text-2xl'>{text}</p>
            </>
          )}
        </article>
        <picture className='justify-self-center'>
          <Image src={imageUrl} alt='Tutorial' width={250} height={500} />
        </picture>
        <article
          className={`justify-self-center pl-4 sm:ml-6 ${
            !inverted && "invisible"
          }`}
        >
          {inverted && (
            <>
              <h2 className='text-2xl sm:text-5xl pb-2 caveat'>{title}</h2>
              <p className='text-md sm:text-2xl'>{text}</p>
            </>
          )}
        </article>
      </section>
    </>
  );
};

export default AboutSection;
