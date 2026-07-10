"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Accordion from "../accordion/accordion";
import Button from "../button/button";
import Card from "../card/card";
import Loader from "../loader/loader";
import {
  deletePost,
  getOwnPosts,
  getPosts,
} from "./../../../app/lib/supabase/supabase_manage";

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

export default function Dashboard({
  ownDashboard = false,
  shortDashboard = false,
  dashboardLink = false,
  hasRefresh = false,
  hasFilters = false,
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [ownPosts, setOwnPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const router = useRouter();

  const goToGarper = () => {
    const path = "garper";
    router.push(path);
  };

  const getAllPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const allPosts = await getPosts();
      const filteredPosts = allPosts.filter(
        (post: Post) =>
          searchKeyword === "" ||
          post.message.toLowerCase().includes(searchKeyword.toLowerCase())
      );
      setPosts(filteredPosts);
    } catch (error) {
      console.error("Error al obtener los posts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchKeyword]);

  const fetchOwnPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const userPosts = await getOwnPosts();
      setOwnPosts(userPosts);
    } catch (error) {
      console.error("Error al obtener los posts propios:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initPosts = useCallback(() => {
    getAllPosts();
    if (ownDashboard) {
      fetchOwnPosts();
    }
  }, [ownDashboard, getAllPosts, fetchOwnPosts]);

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      if (ownDashboard) {
        fetchOwnPosts();
      } else {
        getAllPosts();
      }
    } catch (error) {
      console.error("Error al eliminar el post:", error);
    }
  };

  const handleClean = () => {
    setSearchKeyword("");
  };

  const CardsGenerator = (posts: Post[]) => {
    return posts.map((post: Post, index: number) => {
      const parsedDate = new Date(post.created_date);
      const formattedDate = `${parsedDate
        .getDate()
        .toString()
        .padStart(2, "0")}/${(parsedDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${parsedDate.getFullYear()}`;
      return (
        <Card
          key={index}
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
          hasDeleteButton={ownDashboard}
          onDelete={() => handleDeletePost(post.document_id)}
        />
      );
    });
  };

  useEffect(() => {
    initPosts();
  }, [initPosts]);

  const filters = () => {
    return (
      <div className='flex flex-col my-4 gap-y-4'>
        <input
          type='text'
          placeholder='Pintor'
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className='px-3 py-1 border border-gray-300 u-color-estora-black rounded-md focus:outline-solid focus:border-green-100'
        />
        <div className='flex'>
          <Button
            onClick={getAllPosts}
            text='BUSCAR'
            version='outlined'
            block
          />
          <Button onClick={handleClean} text='LIMPIAR' version='text' block />
        </div>
      </div>
    );
  };

  return (
    <>
      {hasFilters && (
        <div className='rounded-2xl shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] p-6 m-4 sm:m-6 u-bgcolor-estora-black select-none'>
          <Accordion title='BUSCAR POR PALABRA' content={filters()} />
        </div>
      )}
      <section className='shadow-[inset_0_3px_3px_0_rgba(0,0,0,0.15)] u-bgcolor-estora-black p-6 rounded-2xl m-4 sm:m-6 select-none'>
        <div className='flex w-full justify-between'>
          <h2 className='text-2xl'>TABLERO</h2>

          <div className='flex flex-end gap-x-2'>
            {dashboardLink && (
              <Button onClick={goToGarper} text='Ver más' version='outlined' />
            )}
            {hasRefresh && (
              <Button
                onClick={getAllPosts}
                text='Refrescar'
                version='outlined'
              />
            )}
          </div>
        </div>
        <div className={`py-6 grid gap-4 ${isLoading ? "" : "lg:grid-cols-2"}`}>
          {isLoading ? (
            <Loader />
          ) : (
            CardsGenerator(
              ownDashboard
                ? ownPosts
                : shortDashboard
                ? posts.slice(0, 4)
                : posts
            )
          )}
        </div>
      </section>
    </>
  );
}
