"use client";
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

  const [dataLoading, setDataLoading] = useState(true);
  const [lastName, setLastName] = useState();
  const [firstName, setFirstName] = useState();
  const [registerDate, setRegisterDate] = useState();

  const [aboutMeText, setAboutMeText] = useState();
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [editedAboutMeText, setEditedAboutMeText] = useState<any | null>("");

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error || !user) {
        console.error("Error obteniendo usuario:", error);
        return;
      }

      setUser(user);

      const { data, error: dataError } = await supabase
        .from("users")
        .select(
          "registerdate, firstName, lastName, aboutMeText, issubscribed, isAdmin"
        )
        .eq("id", user.id)
        .single();

      if (dataError) {
        console.error("Error obteniendo datos de perfil:", dataError);
        setDataLoading(false);
        return;
      }

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

    fetchUserData();
  }, []);

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
    <section className='rounded-2xl shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] p-6 m-4 sm:m-6 u-bgcolor-estora-black select-none'>
      <article className='p-4'>
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
