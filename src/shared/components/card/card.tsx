"use client";

import Link from "next/link"; // Importa Link de Next.js
import { useState } from "react";
import Button from "../button/button";
import Modal from "../modal/modal";
import { deletePost } from "./../../../app/lib/supabase/supabase_manage";

interface CardProps {
  price: string;
  priceType: string;
  name: string;
  email: string;
  cel: string;
  title: string;
  message: string;
  location: string;
  date: string;
  hasDeleteButton?: boolean;
  id: string;
  onDelete: () => void; // Función para actualizar la lista después de eliminar
}

export default function Card({
  price = "PRICE DEFAULT",
  priceType = "PRICETYPE DEFAULT",
  name = "NOMBRE DEFAULT",
  email = "EMAIL DEFAULT",
  cel = "CEL DEFAULT",
  title = "TITLE DEFAULT",
  message = "MENSAJE DEFAULT",
  location = "LOCATION DEFAULT",
  date = "DATE DEFAULT",
  hasDeleteButton = false,
  id,
  onDelete,
}: CardProps) {
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setShowModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      await deletePost(id);

      setShowModal(false);
      onDelete();
    } catch (error) {
      console.error("Error al eliminar el post:", error);
    } finally {
      setDeleting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className='shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] flex justify-between flex-col u-color-estora-black u-bgcolor-estora-white rounded-2xl cursor-pointer'>
      <Link href={`/${id}`} className='grid grid-cols-3:md h-full'>
        <article className='p-4 col-span-2:md'>
          <div className='flex flex-col justify-between h-full'>
            <div>
              <strong>
                <h2 className='pb-4 text-2xl'>{title}</h2>
              </strong>
              <p className='pb-4 text-xl'>{message}</p>
            </div>

            <div className='flex flex-col justify-end'>
              <strong>
                <p>{name}</p>
              </strong>
              <p>{email}</p>
              <p>{cel}</p>
            </div>
          </div>
        </article>
        <article className='p-4 text-right '>
          <p>{date}</p>
          <h2>{location}</h2>
          <div className='flex flex-col'>
            <strong>
              <h3 className='pt-4 text-2xl'>${price}</h3>
            </strong>
            <h4 className='text-md text-right flex-nowrap'>{priceType}</h4>
          </div>
        </article>
      </Link>
      {hasDeleteButton && (
        <div className='flex items-center px-4 pb-4'>
          <Button
            version='danger'
            color='white'
            text='Eliminar'
            onClick={handleDelete}
          />
        </div>
      )}
      {/* Modal de confirmación */}
      {showModal && (
        <Modal onClose={closeModal}>
          <div className='p-4'>
            <p>¿Estás seguro de que deseas eliminar este post?</p>
            <strong>&quot;{message}&quot;</strong>
            <div className='flex justify-center mt-4 gap-2'>
              <Button
                block
                version='secondary'
                color='white'
                text='Cancelar'
                onClick={closeModal}
              />
              <Button
                block
                version={deleting ? "disabled" : "danger"}
                color={deleting ? "black" : "white"}
                text={deleting ? "Eliminando..." : "Eliminar"}
                onClick={handleConfirmDelete}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
