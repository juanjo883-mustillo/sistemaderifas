import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { reservarNumeros } from '../firebase/rifaService'
import { APP_CONFIG } from '../firebase/appConfig'

const s = {
  page: { minHeight: '100vh', background: '#1a1a1a', padding: '32px 16px' },
  inner: { maxWidth: '440px', margin: '0 auto' },
  headerCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '18px', padding: '20px', textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  btnVolver: { background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', marginBottom: '16px', padding: 0 },
  form: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '18px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' },
  label: { display: 'block', color: '#ccc', fontSize: '13px', fontWeight: '600', marginBottom: '5px' },
  input: { width: '100%', background: '#1a1a1a', border: '1.5px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' },
  hint: { color: '#555', fontSize: '11px', marginTop: '4px' },
  metodoBtnBase: { flex: 1, border: '2px solid', borderRadius: '12px', padding: '12px 8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' },
  error: { background: '#3a1a1a', border: '1px solid #4a1515', color: '#ef5350', fontSize: '13px', borderRadius: '10px', padding: '10px 14px' },
  btnConfirmar: { width: '100%', background: '#c9a035', color: '#000', fontWeight: '700', fontSize: '16px', padding: '13px', borderRadius: '50px', border: '1px solid #e8bc4a', cursor: 'pointer', fontFamily: 'Georgia, serif' },
  btnConfirmarDis: { width: '100%', background: '#2a2a2a', color: '#555', fontWeight: '700', fontSize: '16px', padding: '13px', borderRadius: '50px', border: 'none', cursor: 'not-allowed', fontFamily: 'Georgia, serif' },
  footer: { textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '16px' },
}

export default function Pago() {
  const { state } = useLocation()
  const navigate = useNavigate()

  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', nombrePago: '', metodoPago: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  if (!state?.numeros) { navigate('/'); return null }

  const { numeros, precio, whatsapp, linkMercadoPago } = state
  const total = numeros.length * precio

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.metodoPago) { setError('Elegí un método de pago'); return }
    setCargando(true)
    setError('')
    try {
      await reservarNumeros({ numeros, ...form })

      if (form.metodoPago === 'mercadopago') {
        window.open(linkMercadoPago || APP_CONFIG.linkMercadoPago, '_blank')
      }

      if (form.metodoPago === 'efectivo') {
        const tel = whatsapp || APP_CONFIG.whatsapp
        const msg = encodeURIComponent(
          `Hola! Reservé los números ${numeros.join(', ')} en la rifa de El Rincón Criollo.\nNombre: ${form.nombre} ${form.apellido}\nTeléfono: ${form.telefono}\nEl pago llega a nombre de: ${form.nombrePago || form.nombre + ' ' + form.apellido}`
        )
        window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')
      }

      navigate('/confirmacion', { state: { numeros, form, metodoPago: form.metodoPago, total, whatsapp: whatsapp || APP_CONFIG.whatsapp } })
    } catch (err) {
      setError(err.message)
      setCargando(false)
    }
  }

  const disabled = cargando

  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* Header */}
        <div style={s.headerCard}>
          <img src="/logo.jpeg" alt="El Rincón Criollo" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', border: '2px solid #c9a035' }} />
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Tus datos</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
            Números: <span style={{ color: '#e8bc4a', fontWeight: '700' }}>{numeros.sort((a, b) => a - b).join(', ')}</span>
          </p>
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '18px', margin: '4px 0 0' }}>${total.toLocaleString()}</p>
        </div>

        <button onClick={() => navigate('/')} style={s.btnVolver}>← Volver</button>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={s.label}>Nombre *</label>
                <input name="nombre" required value={form.nombre} onChange={handleChange} style={s.input} placeholder="Juan" />
              </div>
              <div>
                <label style={s.label}>Apellido *</label>
                <input name="apellido" required value={form.apellido} onChange={handleChange} style={s.input} placeholder="García" />
              </div>
            </div>

            <div>
              <label style={s.label}>Teléfono *</label>
              <input name="telefono" required type="tel" value={form.telefono} onChange={handleChange} style={s.input} placeholder="11 2233 4455" />
            </div>

            <div>
              <label style={s.label}>¿A nombre de quién llega el pago?</label>
              <input name="nombrePago" value={form.nombrePago} onChange={handleChange} style={s.input} placeholder="Dejalo vacío si es el mismo nombre" />
              <p style={s.hint}>Completá si el pago lo hace otra persona</p>
            </div>

            {/* Método de pago */}
            <div>
              <label style={s.label}>Método de pago *</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                {[
                  { valor: 'mercadopago', icono: '💳', label: 'Mercado Pago' },
                  { valor: 'efectivo', icono: '💵', label: 'Efectivo' },
                ].map(({ valor, icono, label }) => {
                  const activo = form.metodoPago === valor
                  return (
                    <button key={valor} type="button" onClick={() => setForm(p => ({ ...p, metodoPago: valor }))}
                      style={{
                        ...s.metodoBtnBase,
                        borderColor: activo ? '#c9a035' : '#2a2a2a',
                        background: activo ? '#1e1a0a' : '#1a1a1a',
                        color: activo ? '#e8bc4a' : '#888',
                      }}>
                      {icono} {label}
                    </button>
                  )
                })}
              </div>
              {form.metodoPago === 'efectivo' && (
                <p style={{ color: '#888', fontSize: '12px', marginTop: '6px' }}>Te vamos a abrir WhatsApp para coordinar el pago.</p>
              )}
              {form.metodoPago === 'mercadopago' && (
                <p style={{ color: '#66bb6a', fontSize: '12px', marginTop: '6px' }}>El vendedor confirmará tu pago.</p>
              )}
            </div>

            {error && <div style={s.error}>⚠️ {error}</div>}

            <button type="submit" disabled={disabled} style={disabled ? s.btnConfirmarDis : s.btnConfirmar}>
              {cargando ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>

        <p style={s.footer}>Tus datos solo los ve el vendedor</p>
      </div>
    </div>
  )
}
