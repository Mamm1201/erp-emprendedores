interface Props {
  email: string;
  phone?: string;
  label?: string;
}

export function ContactCard({ email, phone, label = 'Soporte técnico' }: Props) {
  return (
    <div className="contact-card">
      <div className="contact-card-label">{label}</div>
      <div className="contact-row">
        <div className="contact-icon" aria-hidden="true" />
        <a href={`mailto:${email}`} className="contact-link">{email}</a>
      </div>
      {phone && (
        <div className="contact-row">
          <div className="contact-icon" aria-hidden="true" />
          <a href={`tel:${phone.replace(/\s/g, '')}`} className="contact-link">{phone}</a>
        </div>
      )}
    </div>
  );
}
