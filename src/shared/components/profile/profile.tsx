"use client";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { useEffect, useState } from "react";
import Badge from "../badge/badge";
import Loader from "../loader/loader";
import { supabase } from "./../../../app/lib/supabase/supabase";
import Button from "./../button/button";
import "./profile.scss";

export default function Profile() {
  const [user, setUser] = useState<any | null>(null);
  const [isSuscribed, setIsSuscribed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [imageId, setImageId] = useState("Privacidad-hero_dndoew");
  const [imageLoading, setImageLoading] = useState(true);

  const [dataLoading, setDataLoading] = useState(true);
  const [lastName, setLastName] = useState();
  const [firstName, setFirstName] = useState();
  const [registerDate, setRegisterDate] = useState();

  const [aboutMeText, setAboutMeText] = useState();
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [editedAboutMeText, setEditedAboutMeText] = useState<any | null>("");

  useEffect(() => {
    const fetchUserAndProfileImage = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error obteniendo usuario:", error);
        return;
      }

      setUser(user);

      const { data, error: imgError } = await supabase
        .from("users")
        .select(
          "profile_img, registerdate, firstName, lastName, aboutMeText, issubscribed, isAdmin"
        )
        .eq("id", user.id)
        .single();

      if (imgError) {
        console.error("Error obteniendo imagen de perfil:", imgError);
        setImageLoading(false);
        return;
      }

      if (data?.profile_img) {
        setImageId(data.profile_img);
      }
      setImageLoading(false);

      if (data?.registerdate) {
        setRegisterDate(data.registerdate.slice(0, 10));
      }
      setFirstName(data?.firstName);
      setLastName(data?.lastName);
      setAboutMeText(data?.aboutMeText);
      setEditedAboutMeText(data?.aboutMeText ?? "");
      setIsAdmin(data?.isAdmin ?? false);
      setIsSuscribed(data?.issubscribed ?? false);
      setDataLoading(false);
    };

    fetchUserAndProfileImage();
  }, []);

  const handleImageUploadSuccess = async (result: any) => {
    const publicId = result.info.public_id;
    setImageId(publicId);

    console.log("Imagen subida a Cloudinary:", publicId);

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Error obteniendo usuario:", error);
      return;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ profile_img: publicId })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error actualizando imagen en base de datos:", updateError);
    } else {
      console.log(`Imagen de perfil actualizada para ${user.email}`);
    }
  };

  const handleSaveAboutMe = async () => {
    if (!user) return;

    const { error } = await supabase
      .from("users")
      .update({ aboutMeText: editedAboutMeText })
      .eq("id", user.id);

    if (error) {
      console.error("Error actualizando aboutMeText:", error);
    } else {
      setAboutMeText(editedAboutMeText);
      setEditingAboutMe(false);
    }
  };

  return (
    <section className='rounded-2xl shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] p-6 m-4 sm:m-6 u-bgcolor-estora-black select-none grid md:grid-cols-3 gap-2'>
      <article className='flex flex-col items-center justify-center'>
        <div className='CldImage-wrapper'>
          <CldImage
            src={imageId}
            width='250'
            height='250'
            alt={`${user?.email || "usuario"} profile picture`}
            crop={{ type: "auto", source: true }}
          />
        </div>
        <div className='flex align-center justify-center p-4'>
          <CldUploadWidget
            uploadPreset='upload'
            onSuccess={handleImageUploadSuccess}
          >
            {({ open }) => (
              <Button
                block
                text='Cambiar mi foto de perfil'
                version='outlined'
                color='white'
                type='button'
                onClick={() => open()}
              />
            )}
          </CldUploadWidget>
        </div>
      </article>

      <article className='md:col-span-2 p-4'>
        {dataLoading ? (
          <Loader block />
        ) : (
          <>
            <div className='flex pb-2'>
              <h2 className='font-bold text-2xl pr-4'>
                {firstName || "__testName"} {lastName || "__testLastName"}
              </h2>

              {isSuscribed && !isAdmin && (
                <div className='flex items-center justify-center'>
                  <Badge>
                    <p className='font-extralight text-xs'>
                      GARPER CERTIFICADO
                    </p>
                  </Badge>
                </div>
              )}
              {isAdmin && (
                <div className='flex items-center justify-center pl-2'>
                  <Badge color='black' bgColor='special'>
                    <p className='font-extralight text-xs'>ADMINISTRADOR</p>
                  </Badge>
                </div>
              )}
            </div>
            <p className='text-sm'>Fecha de registro:</p>
            <p>{registerDate}</p>
            <br />

            <div className='mt-2'>
              {editingAboutMe ? (
                <>
                  <textarea
                    value={editedAboutMeText}
                    onChange={(e) => setEditedAboutMeText(e.target.value)}
                    className='w-full rounded p-2 u-color-estora-black u-bgcolor-estora-white'
                    rows={3}
                  />
                  <div className='flex gap-4 mt-2'>
                    <Button
                      block
                      text='Guardar'
                      version='primary'
                      onClick={handleSaveAboutMe}
                    />
                    <Button
                      block
                      text='Cancelar'
                      onClick={() => {
                        setEditedAboutMeText(aboutMeText || "");
                        setEditingAboutMe(false);
                      }}
                      version='outlined'
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className='rounded py-2'>{aboutMeText}</p>
                  <div className='py-2'>
                    <Button
                      text='Editar'
                      onClick={() => setEditingAboutMe(true)}
                      version='outlined'
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
