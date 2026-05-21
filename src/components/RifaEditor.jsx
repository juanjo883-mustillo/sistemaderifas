import { useState } from 'react'
import { actualizarConfigRifa, actualizarPremios } from '../firebase/rifaService'

function comprimirImagen(archivo, maxWidth = 800, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', calidad))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(archivo)
  })
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '24px 16px' },
  modal: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '20px', width: '100%', maxWidth: '640px', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' },
  header: { background: '#0a0a0a', borderBottom: '1px solid #2a2a2a', padding: '16px 24px', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  body: { padding: '24px' },
  sectionTitle: { color: '#c9a035', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' },
  label: { display: 'block', color: '#ccc', fontSize: '13px', fontWeight: '600', marginBottom: '5px' },
  input: { width: '100%', background: '#1a1a1a', border: '1.5px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#1a1a1a', border: '1.5px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none', resize: 'none', boxSizing: 'border-box' },
  premioCard: { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px', marginBottom: '12px' },
  btnAgregar: { background: '#c9a035', color: '#000', fontWeight: '700', fontSize: '12px', padding: '7px 14px', borderRadius: '50px', border: 'none', cursor: 'pointer' },
  btnEliminar: { background: 'transparent', color: '#ef5350', fontSize: '12px', border: 'none', cursor: 'pointer', fontWeight: '600' },
  btnGuardar: { width: '100%', background: '#c9a035', color: '#000', fontWeight: '700', fontSize: '16px', padding: '13px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif' },
  btnGuardarDis: { width: '100%', background: '#2a2a2a', color: '#555', fontWeight: '700', fontSize: '16px', padding: '13px', borderRadius: '50px', border: 'none', cursor: 'not-allowed', fontFamily: 'Georgia, serif' },
}

export default function RifaEditor({ rifa, onClose }) {
  const [titulo, setTitulo] = useState(rifa.titulo || '')
  const [descripcion, setDescripcion] = useState(rifa.descripcion || '')
  const [precio, setPrecio] = useState(rifa.precio || 2500)
  const [whatsapp, setWhatsapp] = useState(rifa.whatsapp || '')
  const [linkMP, setLinkMP] = useState(rifa.linkMercadoPago || '')
  const [premios, setPremios] = useState(rifa.premios || [])
  const [fechaFinDate, setFechaFinDate] = useState(() => {
    if (!rifa.fechaFin) return ''
    try {
      const d = rifa.fechaFin.toDate ? rifa.fechaFin.toDate() : new Date(rifa.fechaFin)
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return local.toISOString().slice(0, 10)
    } catch { return '' }
  })
  const [fechaFinTime, setFechaFinTime] = useState(() => {
    if (!rifa.fechaFin) return '20:00'
    try {
      const d = rifa.fechaFin.toDate ? rifa.fechaFin.toDate() : new Date(rifa.fechaFin)
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      return local.toISOString().slice(11, 16)
    } catch { return '20:00' }
  })
  const [guardando, setGuardando] = useState(false)
  const [subiendo, setSubiendo] = useState(null)
  const [mensaje, setMensaje] = useState('')

  function agregarPremio() {
    setPremios(prev => [...prev, { id: Date.now().toString(), nombre: '', descripcion: '', foto: '' }])
  }

  function eliminarPremio(id) { setPremios(prev => prev.filter(p => p.id !== id)) }
  function updatePremio(id, campo, valor) { setPremios(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p)) }

  async function handleFoto(id, archivo) {
    if (!archivo) return
    setSubiendo(id)
    try { updatePremio(id, 'foto', await comprimirImagen(archivo)) }
    catch { alert('No se pudo procesar la imagen. Probá con otra.') }
    finally { setSubiendo(null) }
  }

  async function guardar() {
    setGuardando(true); setMensaje('')
    try {
      const fechaFinValue = fechaFinDate ? new Date(`${fechaFinDate}T${fechaFinTime}`) : null
      await actualizarConfigRifa({ titulo, descripcion, precio: Number(precio), whatsapp, linkMercadoPago: linkMP, fechaFin: fechaFinValue })
      await actualizarPremios(premios)
      setMensaje('¡Rifa guardada correctamente!')
      setTimeout(() => { setMensaje(''); onClose() }, 1500)
    } catch {
      setMensaje('Error al guardar. La imagen puede ser muy grande, probá con una más chica.')
    } finally {
      setGuardando(false)
    }
  }

  const disabled = guardando || subiendo !== null

  return (
    <div style={s.overlay}>
      <div style={s.modal}>

        <div style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpeg" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #c9a035' }} />
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0 }}>Configurar Rifa</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: '24px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={s.body}>

          {/* Datos generales */}
          <div style={{ marginBottom: '24px' }}>
            <p style={s.sectionTitle}>Datos generales</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={s.label}>Título de la rifa</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} style={s.input} placeholder="El Rincón Criollo - Rifa N°1" />
              </div>
              <div>
                <label style={s.label}>Descripción</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={2} style={s.textarea} placeholder="Participá y ganá increíbles premios" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Precio por número ($)</label>
                  <input type="number" value={precio} onChange={e => setPrecio(e.target.value)} style={s.input} />
                </div>
                <div>
                  <label style={s.label}>WhatsApp (con código país)</label>
                  <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={s.input} placeholder="541137629154" />
                </div>
              </div>
              <div>
                <label style={s.label}>Link de Mercado Pago</label>
                <input value={linkMP} onChange={e => setLinkMP(e.target.value)} style={s.input} placeholder="https://mpago.la/..." />
              </div>
              <div>
                <label style={s.label}>Fecha límite de la rifa (opcional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                  <input
                    type="date"
                    value={fechaFinDate}
                    onChange={e => setFechaFinDate(e.target.value)}
                    style={s.input}
                    placeholder="Fecha"
                  />
                  <input
                    type="time"
                    value={fechaFinTime}
                    onChange={e => setFechaFinTime(e.target.value)}
                    style={{ ...s.input, width: '110px' }}
                    disabled={!fechaFinDate}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <p style={{ color: '#555', fontSize: '11px', margin: 0 }}>Si la ponés, aparece cuenta regresiva en la rifa</p>
                  {fechaFinDate && (
                    <button type="button" onClick={() => { setFechaFinDate(''); setFechaFinTime('20:00') }} style={{ background: 'none', border: 'none', color: '#ef5350', fontSize: '11px', cursor: 'pointer', padding: 0 }}>
                      ✕ Quitar fecha
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Premios */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={s.sectionTitle}>Premios</p>
              <button onClick={agregarPremio} style={s.btnAgregar}>+ Agregar premio</button>
            </div>

            {premios.length === 0 && (
              <p style={{ color: '#555', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hay premios. Agregá al menos uno.</p>
            )}

            {premios.map((premio, idx) => (
              <div key={premio.id} style={s.premioCard}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span style={{ color: '#c9a035', fontWeight: '700', fontSize: '13px' }}>Premio {idx + 1}</span>
                  <button onClick={() => eliminarPremio(premio.id)} style={s.btnEliminar}>Eliminar</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input value={premio.nombre} onChange={e => updatePremio(premio.id, 'nombre', e.target.value)}
                    placeholder="Ej: 1° Premio - Martín Fierro" style={s.input} />
                  <textarea value={premio.descripcion} onChange={e => updatePremio(premio.id, 'descripcion', e.target.value)}
                    placeholder="Descripción del premio (opcional)" rows={2} style={s.textarea} />

                  {premio.foto ? (
                    <div style={{ position: 'relative' }}>
                      <img src={premio.foto} alt="Premio" style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #333' }} />
                      <button onClick={() => updatePremio(premio.id, 'foto', '')}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: '#c62828', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '50px', border: 'none', cursor: 'pointer' }}>
                        Quitar foto
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      width: '100%', height: '120px', border: `2px dashed ${subiendo === premio.id ? '#c9a035' : '#333'}`,
                      borderRadius: '10px', cursor: 'pointer', background: subiendo === premio.id ? '#1e1a0a' : 'transparent',
                      transition: 'all 0.2s',
                    }}>
                      {subiendo === premio.id ? (
                        <p style={{ color: '#c9a035', fontSize: '13px', fontWeight: '600' }}>Procesando imagen...</p>
                      ) : (
                        <>
                          <p style={{ fontSize: '24px', margin: '0 0 4px' }}>📷</p>
                          <p style={{ color: '#ccc', fontSize: '13px', fontWeight: '600', margin: 0 }}>Subir foto</p>
                          <p style={{ color: '#555', fontSize: '11px', margin: '2px 0 0' }}>JPG, PNG, WEBP</p>
                        </>
                      )}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        disabled={subiendo === premio.id}
                        onChange={e => handleFoto(premio.id, e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          {mensaje && (
            <div style={{
              padding: '12px', borderRadius: '10px', textAlign: 'center', fontSize: '13px', fontWeight: '600', marginBottom: '16px',
              background: mensaje.includes('Error') ? '#3a1a1a' : '#1a3a1a',
              color: mensaje.includes('Error') ? '#ef5350' : '#66bb6a',
              border: `1px solid ${mensaje.includes('Error') ? '#4a1515' : '#1a4a1a'}`,
            }}>{mensaje}</div>
          )}

          <button onClick={guardar} disabled={disabled} style={disabled ? s.btnGuardarDis : s.btnGuardar}>
            {guardando ? 'Guardando...' : 'Guardar rifa'}
          </button>
        </div>
      </div>
    </div>
  )
}
