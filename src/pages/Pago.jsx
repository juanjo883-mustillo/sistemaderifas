import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { reservarNumeros, liberarReservaTemporal } from '../firebase/rifaService'
import { APP_CONFIG } from '../firebase/appConfig'

function useReservaCountdown(expiraEnISO, onExpired) {
  const [restante, setRestante] = useState(null)
  const onExpiredRef = useRef(onExpired)
  useEffect(() => { onExpiredRef.current = onExpired }, [onExpired])

  useEffect(() => {
    if (!expiraEnISO) return
    const target = new Date(expiraEnISO)
    function tick() {
      const diff = Math.max(0, target - new Date())
      setRestante(diff)
      if (diff === 0) onExpiredRef.current?.()
      return diff
    }
    if (tick() === 0) return
    const id = setInterval(() => { if (tick() === 0) clearInterval(id) }, 1000)
    return () => clearInterval(id)
  }, [expiraEnISO])

  return restante
}

function formatSegundos(ms) {
  if (ms === null) return ''
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

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
  const [expirado, setExpirado] = useState(false)

  if (!state?.numeros) { navigate('/'); return null }

  const { numeros, precio, whatsapp, linkMercadoPago, reservaId, expiraEn } = state
  const total = numeros.length * precio

  const tiempoRestante = useReservaCountdown(expiraEn, () => setExpirado(true))

  useEffect(() => {
    if (!expirado) return
    liberarReservaTemporal(numeros).catch(() => {})
    const id = setTimeout(() => navigate('/'), 5000)
    return () => clearTimeout(id)
  }, [expirado])

  async function handleVolver() {
    if (numeros && reservaId) {
      await liberarReservaTemporal(numeros).catch(() => {})
    }
    navigate('/')
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.metodoPago) { setError('Elegí un método de pago'); return }
    setCargando(true)
    setError('')
    try {
      await reservarNumeros({ numeros, ...form, reservaId })

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

  const tiempoUrgente = tiempoRestante !== null && tiempoRestante < 120000

  return (
    <div style={s.page}>
      <div style={s.inner}>

        {/* Banner expirado */}
        {expirado && (
          <div style={{ background: '#3a1a1a', border: '1px solid #ef5350', borderRadius: '14px', padding: '16px', textAlign: 'center', marginBottom: '16px' }}>
            <p style={{ color: '#ef5350', fontWeight: '700', fontSize: '14px', margin: '0 0 4px' }}>⏰ Tu reserva expiró</p>
            <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Los números fueron liberados. Volvés al inicio en unos segundos...</p>
          </div>
        )}

        {/* Countdown reserva */}
        {tiempoRestante !== null && !expirado && (
          <div style={{ background: tiempoUrgente ? '#3a1e08' : '#111', border: `1px solid ${tiempoUrgente ? '#ef8c35' : '#333'}`, borderRadius: '12px', padding: '10px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Tiempo para completar</p>
            <p style={{ color: tiempoUrgente ? '#ef8c35' : '#e8bc4a', fontWeight: '700', fontSize: '16px', margin: 0, fontFamily: 'Georgia, serif' }}>
              ⏱ {formatSegundos(tiempoRestante)}
            </p>
          </div>
        )}

        {/* Header */}
        <div style={s.headerCard}>
          <img src="/logo.jpeg" alt="El Rincón Criollo" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', border: '2px solid #c9a035' }} />
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Tus datos</h2>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
            Números: <span style={{ color: '#e8bc4a', fontWeight: '700' }}>{numeros.sort((a, b) => a - b).join(', ')}</span>
          </p>
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '18px', margin: '4px 0 0' }}>${total.toLocaleString()}</p>
        </div>

        <button onClick={handleVolver} style={s.btnVolver}>← Volver</button>

        <form onSubmit={handleSubmit} style={{ ...s.form, opacity: expirado ? 0.5 : 1, pointerEvents: expirado ? 'none' : 'auto' }}>
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
                      style={{ ...s.metodoBtnBase, borderColor: activo ? '#c9a035' : '#2a2a2a', background: activo ? '#1e1a0a' : '#1a1a1a', color: activo ? '#e8bc4a' : '#888' }}>
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

            <button type="submit" disabled={cargando} style={cargando ? s.btnConfirmarDis : s.btnConfirmar}>
              {cargando ? 'Reservando...' : 'Confirmar reserva'}
            </button>
          </div>
        </form>

        <p style={s.footer}>Tus datos solo los ve el vendedor</p>
      </div>
    </div>
  )
}
