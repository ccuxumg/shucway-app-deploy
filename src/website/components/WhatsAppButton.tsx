import './WhatsAppButton.css';

const WhatsAppButton = () => (
  <a
    href="https://chat.whatsapp.com/CtumosmGlDO7Rvx1OUB66n?mode=ems_copy_h_c"
    className="whatsapp-float"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Chatea con nosotros en WhatsApp"
  >
  <img src="/image/other/wsp.png" alt="WhatsApp" width={36} height={36} className="whatsapp-img" />
  </a>
);

export default WhatsAppButton;
