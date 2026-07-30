// src/components/InstallPrompt.tsx
"use client";

import { useEffect, useState } from "react";
import Alert from "../alert/alert";

const InstallPrompt = () => {
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallAlert, setShowInstallAlert] = useState(true);

  useEffect(() => {
    const userAgent = navigator.userAgent;
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    );

    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      );
    setIsMobile(isMobileDevice);

    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);
  }, []);

  const closeAlert = () => {
    setShowInstallAlert(false);
  };
  1;
  if (isStandalone || !isMobile || !showInstallAlert) {
    return null;
  }

  return (
    <Alert
      type='info'
      onClose={closeAlert}
      animate='fadeInDown'
      closable={true}
      classNames='u-bgcolor-estora-white u-color-estora-black rounded-lg mx-4'
    >
      <h3 className='text-md font-semibold'>
        We recommend you install Brokerage
      </h3>
      {isIOS ? (
        <p className='mt-2 text-sm'>
          To install this app on your iOS, tap the <strong>share</strong> button and select{" "}
          <strong>&quot;Add to Home Screen&quot;</strong>.
        </p>
      ) : (
        <p className='mt-2 text-sm'>
          To install this app, use your browser's option to add it to the home screen.
        </p>
      )}
    </Alert>
  );
};

export default InstallPrompt;
