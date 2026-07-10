"use client";

import { useState } from "react";
import Accordion from "../accordion/accordion";
import Button from "../button/button";
import Loader from "../loader/loader";
import Select from "../select/select";
import { addPost } from "./../../../app/lib/supabase/supabase_manage";

export default function CreatePost() {
  const [formData, setFormData] = useState({
    price: "",
    priceType: "En total",
    name: "",
    email: "",
    cel: "",
    location: "Remoto",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (
      !formData.price ||
      !formData.priceType ||
      !formData.name ||
      !formData.location ||
      !formData.cel ||
      !formData.message
    ) {
      setError("Por favor, completa todos los campos.");
      return;
    }
    setIsLoading(true);
    await addPost(formData);
    setIsLoading(false);
    setIsSubmitted(true);
  };

  const handleNewPost = () => {
    setIsLoading(false);
    setIsSubmitted(false);
    setFormData({
      price: "",
      priceType: "En total",
      name: "",
      location: "REMOTO",
      cel: "",
      email: currentUser ? currentUser.email : "",
      message: "",
    });
    setError("");
  };

  const priceTypeOptions = [
    { value: "Por hora", label: "Por hora" },
    { value: "En total", label: "En total" },
  ];

  const locationOptions = [
    { value: "REMOTO", label: "REMOTO" },
    { value: "CABA", label: "CABA" },
    { value: "GBA", label: "GBA" },
  ];

  const handleSelect = (name: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const createPostForm = () => {
    return (
      <form
        className='flex flex-col my-4 gap-y-4 select-none'
        onSubmit={handleSubmit}
      >
        <div className='grid'>
          <label className='pr-4'>
            <span>Precio a pagar en pesos:</span>
          </label>
          <div className=' flex gap-2'>
            <div className='relative basis-3/4'>
              <span className='absolute left-2 transform py-1 u-color-estora-black'>
                $
              </span>
              <input
                className='w-full pl-6 pr-3 py-1  u-color-estora-black rounded-md focus:outline-solid focus:border-green-100'
                placeholder='6000'
                type='number'
                name='price'
                value={formData.price}
                onChange={handleChange}
              />
            </div>
            <div className='basis-1/4'>
              <Select
                options={priceTypeOptions}
                defaultText={formData.priceType}
                onSelect={(value) => handleSelect("priceType", value)}
              />
            </div>
          </div>
        </div>
        <div className='grid'>
          <label className='pr-4'>
            <span>Nombre de la persona que paga por el servicio:</span>
          </label>
          <input
            className='px-3 py-1  u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 '
            placeholder='Diego Armando'
            type='text'
            name='name'
            value={formData.name}
            onChange={handleChange}
          />
        </div>
        <div className='grid'>
          <label className='pr-4'>
            <span>Donde se prestará el servicio:</span>
          </label>
          <Select
            options={locationOptions}
            defaultText={formData.location}
            onSelect={(value) => handleSelect("location", value)}
          />
        </div>
        <div className='grid'>
          <label className='pr-4'>
            <span>Celular de la persona que paga por el servicio:</span>
          </label>
          <input
            className='px-3 py-1  u-color-estora-black rounded-md focus:outline-solid focus:border-green-100 '
            placeholder='+54 9 11 23455789'
            type='tel'
            name='cel'
            value={formData.cel}
            onChange={handleChange}
          />
        </div>
        <div className='grid'>
          <label className='pr-4'>
            <span>Busqueda:</span>
          </label>
          <input
            className='px-3 py-1 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100  '
            placeholder='Estoy buscando un paseador de perros...'
            type='text'
            name='message'
            value={formData.message}
            onChange={handleChange}
          />
        </div>
        <Button version='outlined' block text='ENVIAR POST' />
      </form>
    );
  };

  return (
    <div className='rounded-2xl shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] p-6 m-4 sm:m-6 u-bgcolor-estora-black select-none'>
      <Accordion
        title='CREA TU POST'
        content={
          isLoading ? (
            <Loader />
          ) : isSubmitted ? (
            <>
              <p className='text-xl py-4'>Su post se envió correctamente.</p>
              <Button
                text='Crear nuevo post'
                version='text'
                block={false}
                onClick={handleNewPost}
              />
            </>
          ) : (
            createPostForm()
          )
        }
      />
    </div>
  );
}
