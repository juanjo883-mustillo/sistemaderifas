import { useLocation, useNavigate } from 'react-router-dom'
import { APP_CONFIG } from '../firebase/appConfig'

const s = {
  page: { minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' },
  inner: { maxWidth: '440px', width: '100%' },
  card: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '20px', padding: '28px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' },
  infoCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px', marginTop: '16px', textAlign: 'left' },
  infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '13px' },
  infoLabel: { color: '#666' },
  infoVal: { color: '#ccc', fontWeight: '600' },
  btnWhatsapp: { width: '100%', background: '#25d366', color: '#fff', fontWeight: '700', fontSize: '15px', padding: '13px', borderRadius: '50px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' },
  mpCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '14px', marginTop: '16px', textAlign: 'left' },
  btnVolver: { background: 'none', border: 'none', color: '#555', fontSize: '13px', cursor: 'pointer', marginTop: '16px', textDecoration: 'underline' },
  footer: { textAlign: 'center', color: '#333', fontSize: '11px', marginTop: '16px' },
}

export default function Confirmacion() {
  const { state } = useLocation()
  const navigate = useNavigate()

  if (!state) { navigate('/'); return null }

  const { numeros, form, metodoPago, total, whatsapp } = state

  function abrirWhatsApp() {
    const tel = whatsapp || APP_CONFIG.whatsapp
    const metodo = metodoPago === 'mercadopago' ? 'Mercado Pago' : 'efectivo'
    const msg = encodeURIComponent(
      `Hola! Acabo de pagar por ${metodo} y te mando el comprobante.\n\nNúmeros reservados: ${numeros.sort((a, b) => a - b).join(', ')}\nNombre: ${form.nombre} ${form.apellido}\nTotal: $${total.toLocaleString()}`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
  }

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.card}>
          <img src="/logo.jpeg" alt="El Rincón Criollo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px', display: 'block', border: '2px solid #c9a035' }} />
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🎉</div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>¡Reserva confirmada!</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>{form.nombre} {form.apellido}, ya reservaste tus números.</p>

          <div style={s.infoCard}>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Números</span>
              <span style={{ color: '#e8bc4a', fontWeight: '700', fontSize: '13px' }}>{numeros.sort((a, b) => a - b).join(', ')}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Total</span>
              <span style={s.infoVal}>${total.toLocaleString()}</span>
            </div>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>Pago a nombre de</span>
              <span style={s.infoVal}>{form.nombrePago || `${form.nombre} ${form.apellido}`}</span>
            </div>
            <div style={{ ...s.infoRow, marginBottom: 0 }}>
              <span style={s.infoLabel}>Método</span>
              <span style={s.infoVal}>{metodoPago === 'mercadopago' ? '💳 Mercado Pago' : '💵 Efectivo'}</span>
            </div>
          </div>

          {metodoPago === 'efectivo' && (
            <>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '14px' }}>Envianos el comprobante por WhatsApp para confirmar tu lugar.</p>
              <button onClick={abrirWhatsApp} style={s.btnWhatsapp}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar comprobante por WhatsApp
              </button>
            </>
          )}

          {metodoPago === 'mercadopago' && (
            <>
              <p style={{ color: '#888', fontSize: '13px', marginTop: '14px' }}>
                Una vez que pagaste, mandanos el comprobante por WhatsApp para confirmar tu lugar.
              </p>
              <button onClick={abrirWhatsApp} style={s.btnWhatsapp}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar comprobante por WhatsApp
              </button>
            </>
          )}

          <br />
          <button onClick={() => navigate('/')} style={s.btnVolver}>← Volver al inicio</button>
        </div>

        <p style={s.footer}>El Rincón Criollo · Gracias por participar 🐄</p>
      </div>
    </div>
  )
}
