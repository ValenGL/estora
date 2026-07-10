"use client";
import { useEffect, useState } from "react";

function CookieBot() {
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    setIsDevelopment(
      typeof window !== "undefined" && window.location.hostname === "localhost"
    );
  }, []);

  return (
    isDevelopment && (
      <>
        <script
          id='Cookiebot'
          src='https://consent.cookiebot.com/uc.js'
          data-cbid='77b6bc69-488c-4e5f-91e9-93d8da421164'
          data-blockingmode='auto'
          type='text/javascript'
          async
        ></script>
        <script
          id='CookieDeclaration'
          src='https://consent.cookiebot.com/77b6bc69-488c-4e5f-91e9-93d8da421164/cd.js'
          type='text/javascript'
          async
        ></script>
      </>
    )
  );
}

export default CookieBot;
