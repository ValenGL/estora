"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Button from "../../shared/components/button/button";
import Card from "../../shared/components/card/card";
import Loader from "../../shared/components/loader/loader";
import Modal from "../../shared/components/modal/modal";

interface Post {
  document_id: string;
  price: string;
  priceType: string;
  name: string;
  email: string;
  cel: string;
  title: string;
  message: string;
  location: string;
  created_date: string;
}

const PostView = () => {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCopiedModal, setShowCopiedModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      // getPostById removed in Sprint 1 cleanup — post detail rebuilt in Sprint 2
      setIsLoading(false);
    };

    fetchPost();
  }, [id]);

  if (isLoading) return <Loader />;
  if (!post) return <p>Post no encontrado</p>;

  const parsedDate = new Date(post.created_date);
  const wpLink = `https://wa.me/${post.cel}?text=Hola%20${post.name},%20estoy%20interesado%20en%20tu%20oferta%20de%20trabajo:%20'${post.message}'%20publicada%20en%20GARPAR.ar!`;
  const formattedDate = `${parsedDate.getDate().toString().padStart(2, "0")}/${(
    parsedDate.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}/${parsedDate.getFullYear()}`;

  const handleCopy = async () => {
    const link = `https://garpar.ar/${post.document_id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: `Mirá esta oferta de trabajo en GARPAR.ar: "${post.title}"`,
          url: link,
        });
      } catch (error) {
        console.error("Error al compartir:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(wpLink);
        setShowCopiedModal(true);
      } catch (error) {
        console.error("Error al copiar el enlace:", error);
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleContact = () => {
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    router.push("/");
  };

  return (
    <div className='container'>
      <div className='p-4 sm:p-6 animate-fadeInUp'>
        <p className='text-4xl text-6xl:md pb-4'>¡Felicitaciones!</p>
        <p className='text-3xl text-4xl:md caveat'>
          Encontraste exactamente lo que buscas.
        </p>
      </div>
      <section className='shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] u-bgcolor-estora-black p-6 rounded-2xl m-4 sm:m-6 select-none'>
        <Card
          id={post.document_id}
          price={post.price}
          priceType={post.priceType}
          name={post.name}
          email={post.email}
          cel={post.cel}
          title={post.title}
          message={post.message}
          location={post.location}
          date={formattedDate}
          onDelete={() => console.log("onDelete post card view")}
        />
        <div className='grid grid-cols-3 gap-4 pt-6'>
          <a href={wpLink} target='_blank' rel='noopener noreferrer'>
            <Button
              version='primary'
              color='Black'
              block
              text='Contactar'
              onClick={handleContact}
            />
          </a>
          <Button
            version='outlined'
            color='white'
            block
            text='Atrás'
            onClick={handleBack}
          />
          <Button
            version='secondary'
            color='white'
            block
            text='Compartir'
            onClick={handleCopy}
          />
        </div>
      </section>

      {showModal && (
        <Modal onClose={closeModal}>
          <div className='p-4 u-color-estora-black'>
            <p className='text-center text-2xl text-4xl:md py-4'>
              Hasta acá te acompañamos nosotros.
            </p>
            <p className='text-center text-2xl caveat pb-4'>
              ¡Te deseamos <strong>todos</strong> los éxitos!
            </p>
            <div className='flex w-full justify-end'>
              <Image
                src={"/assets/images/brokerage.svg"}
                alt='Brokerage logo'
                width={96}
                height={215}
                className='pb-2 w-24'
              />
            </div>
            <div className='flex items-center pt-4'>
              <Button
                version='secondary'
                color='white'
                block
                text='Ir al inicio'
                onClick={closeModal}
              />
            </div>
          </div>
        </Modal>
      )}

      {showCopiedModal && (
        <Modal onClose={() => setShowCopiedModal(false)}>
          <div className='p-4 u-color-estora-black'>
            <p>Enlace copiado al portapapeles. Ya podes compartirlo</p>
            <div className='flex items-center pt-4'>
              <Button
                version='secondary'
                color='white'
                text='¡Gracias!'
                onClick={() => setShowCopiedModal(false)}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PostView;
