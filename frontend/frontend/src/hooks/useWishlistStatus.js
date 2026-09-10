import {
  useEffect,
  useState,
} from 'react';

import {
  addWishlistItemApi,
  checkWishlistItemApi,
  removeWishlistItemApi,
} from '../services/wishlistService';


export default function useWishlistStatus({
  productId,
  isLoggedIn,
  openAuthModal,
}) {

  const [
    inWishlist,
    setInWishlist,
  ] = useState(false);


  const [
    wishlistLoading,
    setWishlistLoading,
  ] = useState(false);


  /*
  ==================================================
  LOAD HEART STATUS
  ==================================================
  */

  useEffect(() => {

    let cancelled = false;


    const loadStatus =
      async () => {

        if (
          !isLoggedIn ||
          !productId
        ) {

          setInWishlist(
            false,
          );

          return;
        }


        try {

          const exists =
            await checkWishlistItemApi(
              productId,
            );


          if (!cancelled) {

            setInWishlist(
              exists,
            );
          }


        } catch (error) {

          if (!cancelled) {

            console.error(
              'Unable to check wishlist:',
              error,
            );


            setInWishlist(
              false,
            );
          }
        }
      };


    loadStatus();


    return () => {
      cancelled = true;
    };

  }, [
    productId,
    isLoggedIn,
  ]);


  /*
  ==================================================
  TOGGLE
  ==================================================
  */

  const toggleWishlist =
    async () => {

      if (!isLoggedIn) {

        openAuthModal?.(
          'login',
        );

        return false;
      }


      if (
        !productId ||
        wishlistLoading
      ) {

        return inWishlist;
      }


      try {

        setWishlistLoading(
          true,
        );


        if (inWishlist) {

          await removeWishlistItemApi(
            productId,
          );


          setInWishlist(
            false,
          );


          window.dispatchEvent(
            new CustomEvent(
              'somnera:wishlist-changed',
            ),
          );


          return false;

        }


        await addWishlistItemApi(
          productId,
        );


        setInWishlist(
          true,
        );


        window.dispatchEvent(
          new CustomEvent(
            'somnera:wishlist-changed',
          ),
        );


        return true;


      } finally {

        setWishlistLoading(
          false,
        );
      }
    };


  return {

    inWishlist,

    wishlistLoading,

    toggleWishlist,

  };
}