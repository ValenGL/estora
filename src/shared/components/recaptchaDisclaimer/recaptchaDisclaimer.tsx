function recaptchaDisclaimer() {
  return (
    <div className='u-color-estora-white '>
      <small>
        Este sitio se encuentra protegido por reCAPTCHA, aplican las{" "}
      </small>
      <a className='underline' rel='noreferrer' href='/privacidad'>
        Políticas de privacidad
      </a>{" "}
      <small>y </small>
      <a className='underline' rel='noopener noreferrer' href='/tyc'>
        Términos del servicio.
      </a>
    </div>
  );
}

export default recaptchaDisclaimer;
