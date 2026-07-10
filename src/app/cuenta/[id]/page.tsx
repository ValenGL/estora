"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Modal from "./../../..//shared/components/modal/modal";
import Profile from "./../../..//shared/components/profile/profile";
import { Button } from "./../../..//stories/button/Button";
import Loader from "./../../../shared/components/loader/loader";
import { getUserById } from "./../../lib/supabase/supabase_manage";

interface ViewUser {
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

  const [viewUser, setViewUser] = useState<ViewUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showCopiedModal, setShowCopiedModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        const fetchedUser = await getUserById(id as string);
        setViewUser(fetchedUser);
      } catch (error) {
        console.error("Error al obtener el post:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  if (isLoading) return <Loader />;
  if (!viewUser) return <p>User no encontrado</p>;

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
      <Profile />

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
                src={"/assets/images/estora.svg"}
                alt='Estora logo'
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
    </div>
  );
};

export default PostView;
