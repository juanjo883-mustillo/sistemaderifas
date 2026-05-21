import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase/config'
import { suscribirParticipantes, togglePagado, resetearNumeros, eliminarParticipante } from '../firebase/rifaService'
import { useRifa } from '../hooks/useRifa'
import RifaEditor from '../components/RifaEditor'

const s = {
  page: { minHeight: '100vh', background: '#1a1a1a', paddingBottom: '40px' },
  header: { background: '#111', borderBottom: '1px solid #2a2a2a', padding: '14px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' },
  headerInner: { maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a035' },
  titulo: { fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '700', color: '#fff', margin: 0 },
  emailText: { fontSize: '11px', color: '#777', margin: 0 },
  btnEditar: { background: '#c9a035', color: '#000', fontWeight: '700', fontSize: '12px', padding: '7px 14px', borderRadius: '50px', border: 'none', cursor: 'pointer' },
  btnSalir: { background: 'transparent', color: '#888', fontSize: '13px', border: '1px solid #333', padding: '6px 14px', borderRadius: '50px', cursor: 'pointer' },
  inner: { maxWidth: '760px', margin: '0 auto', padding: '20px 16px' },
  card: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '16px', marginBottom: '16px' },
  cardGold: { background: '#111', border: '1px solid #c9a035', borderRadius: '14px', padding: '16px', marginBottom: '16px' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' },
  statCard: { background: '#111', border: '1px solid #2a2a2a', borderRadius: '12px', padding: '12px', textAlign: 'center' },
  statCardGreen: { background: '#1a3a1a', border: '1px solid #2e7d32', borderRadius: '12px', padding: '12px', textAlign: 'center' },
  statNum: { fontSize: '22px', fontWeight: '700', color: '#fff', margin: 0 },
  statNumGreen: { fontSize: '22px', fontWeight: '700', color: '#66bb6a', margin: 0 },
  statLabel: { fontSize: '11px', color: '#777', marginTop: '2px' },
  sectionTitle: { fontFamily: 'Georgia, serif', fontSize: '15px', fontWeight: '700', color: '#fff' },
  btnNuevaRifa: { background: 'transparent', color: '#ef5350', fontSize: '11px', border: '1px solid #4a1515', padding: '5px 12px', borderRadius: '50px', cursor: 'pointer' },
  numCell: (ocupado) => ({
    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', fontWeight: '700', borderRadius: '5px',
    background: ocupado ? '#c9a035' : '#1e1e1e',
    color: ocupado ? '#000' : '#555',
    border: ocupado ? '1px solid #e8bc4a' : '1px solid #2a2a2a',
  }),
  filterBar: { display: 'flex', gap: '8px', marginBottom: '12px' },
  filterBtn: (active) => ({
    padding: '6px 16px', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
    background: active ? '#c9a035' : 'transparent',
    color: active ? '#000' : '#888',
    border: active ? '1px solid #e8bc4a' : '1px solid #333',
  }),
  participantCard: (pagado) => ({
    background: '#111', border: `2px solid ${pagado ? '#2e7d32' : '#2a2a2a'}`,
    borderRadius: '14px', padding: '16px', marginBottom: '12px',
  }),
  badge: (pagado) => ({
    fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '50px', whiteSpace: 'nowrap',
    background: pagado ? '#1a3a1a' : '#3a1a1a',
    color: pagado ? '#66bb6a' : '#ef5350',
  }),
  btnToggle: (pagado) => ({
    fontSize: '11px', padding: '5px 12px', borderRadius: '50px', fontWeight: '600', cursor: 'pointer',
    background: 'transparent',
    color: pagado ? '#ef5350' : '#66bb6a',
    border: `1px solid ${pagado ? '#4a1515' : '#1a4a1a'}`,
  }),
  numeroBadge: { background: '#1e1e1e', border: '1px solid #c9a035', color: '#e8bc4a', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '50px' },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  modalCard: { background: '#111', border: '1px solid #333', borderRadius: '20px', padding: '28px', maxWidth: '360px', width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.6)' },
}

function exportarCSV(participantes, precio) {
  const headers = ['Nombre', 'Apellido', 'Teléfono', 'Números', 'Total', 'Método de pago', 'Estado', 'Fecha']
  const filas = participantes.map(p => [
    p.nombre,
    p.apellido,
    p.telefono,
    p.numeros?.sort((a, b) => a - b).join(' - ') || '',
    (p.numeros?.length || 0) * (precio || 0),
    p.metodoPago === 'mercadopago' ? 'Mercado Pago' : 'Efectivo',
    p.pagado ? 'Pagado' : 'Pendiente',
    p.creadoEn ? new Date(p.creadoEn.seconds * 1000).toLocaleDateString('es-AR') : '',
  ])
  const csv = [headers, ...filas]
    .map(fila => fila.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `participantes-${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Vendedor() {
  const navigate = useNavigate()
  const { rifa } = useRifa()
  const [participantes, setParticipantes] = useState([])
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmEliminar, setConfirmEliminar] = useState(null)
  const [nuevasReservas, setNuevasReservas] = useState(0)
  const prevCountRef = useRef(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { if (!u) { navigate('/login'); return }; setUsuario(u) })
    return unsub
  }, [navigate])

  useEffect(() => {
    const unsub = suscribirParticipantes((lista) => {
      const activos = lista.filter(p => !p._eliminado)
      setCargando(false)
      if (prevCountRef.current !== null && activos.length > prevCountRef.current) {
        setNuevasReservas(n => n + (activos.length - prevCountRef.current))
      }
      prevCountRef.current = activos.length
      setParticipantes(activos)
    })
    return unsub
  }, [])

  const filtrados = participantes
    .filter(p => {
      const matchFiltro = filtro === 'todos' || (filtro === 'pagados' && p.pagado) || (filtro === 'pendientes' && !p.pagado)
      if (!busqueda.trim()) return matchFiltro
      const q = busqueda.toLowerCase()
      return matchFiltro && (
        p.nombre?.toLowerCase().includes(q) ||
        p.apellido?.toLowerCase().includes(q) ||
        p.telefono?.includes(q) ||
        p.numeros?.some(n => String(n).includes(q))
      )
    })
    .sort((a, b) => (b.creadoEn?.seconds || 0) - (a.creadoEn?.seconds || 0))

  const totalRecaudado = participantes.filter(p => p.pagado).reduce((a, p) => a + (p.numeros?.length || 0) * (rifa?.precio || 0), 0)
  const totalEsperado = participantes.reduce((a, p) => a + (p.numeros?.length || 0) * (rifa?.precio || 0), 0)
  const numerosVendidos = participantes.reduce((a, p) => a + (p.numeros?.length || 0), 0)
  const pendientes = participantes.filter(p => !p.pagado).length

  if (cargando) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/logo.jpeg" alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a035', margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#e8bc4a', fontFamily: 'Georgia, serif', fontSize: '16px' }}>Cargando panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.jpeg" alt="Logo" style={s.logo} />
            <div>
              <p style={s.titulo}>Panel Vendedor</p>
              <p style={s.emailText}>{usuario?.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {nuevasReservas > 0 && (
              <button
                onClick={() => setNuevasReservas(0)}
                style={{ background: '#ef5350', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '5px 12px', borderRadius: '50px', border: 'none', cursor: 'pointer', animation: 'pulse 1.5s infinite' }}
              >
                🔔 +{nuevasReservas} nueva{nuevasReservas > 1 ? 's' : ''}
              </button>
            )}
            <button onClick={() => setEditando(true)} style={s.btnEditar}>✏️ Editar rifa</button>
            <button onClick={() => { signOut(auth); navigate('/login') }} style={s.btnSalir}>Salir</button>
          </div>
        </div>
      </div>

      <div style={s.inner}>

        {/* Info rifa */}
        {rifa && (
          <div style={s.cardGold}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <p style={{ fontFamily: 'Georgia, serif', fontWeight: '700', color: '#fff', fontSize: '15px', margin: 0 }}>{rifa.titulo}</p>
                <p style={{ color: '#c9a035', fontSize: '12px', margin: '2px 0 0' }}>${rifa.precio?.toLocaleString()} por número</p>
                {rifa.fechaFin && (
                  <p style={{ color: '#888', fontSize: '11px', margin: '2px 0 0' }}>
                    Cierre: {(rifa.fechaFin.toDate ? rifa.fechaFin.toDate() : new Date(rifa.fechaFin)).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {rifa.premios?.map((p, i) => (
                  <span key={p.id} style={{ background: '#1e1e1e', color: '#e8bc4a', fontSize: '11px', padding: '4px 10px', borderRadius: '50px', border: '1px solid #333' }}>
                    {p.nombre || `Premio ${i + 1}`}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={s.statGrid}>
          {[
            { valor: participantes.length, label: 'Participantes', verde: false },
            { valor: numerosVendidos, label: 'Números vendidos', verde: false },
            { valor: `$${totalRecaudado.toLocaleString()}`, label: 'Cobrado', verde: true },
            { valor: `$${totalEsperado.toLocaleString()}`, label: 'Esperado', verde: false },
          ].map(({ valor, label, verde }) => (
            <div key={label} style={verde ? s.statCardGreen : s.statCard}>
              <p style={verde ? s.statNumGreen : s.statNum}>{valor}</p>
              <p style={s.statLabel}>{label}</p>
            </div>
          ))}
        </div>

        {/* Cuadrícula números */}
        {rifa && (
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={s.sectionTitle}>Estado de números</p>
              <button onClick={() => setConfirmReset(true)} style={s.btnNuevaRifa}>🔄 Nueva rifa</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10,1fr)', gap: '4px' }}>
              {Array.from({ length: 100 }, (_, i) => i + 1).map(n => {
                const ocupado = rifa.numeros?.[String(n)]?.estado === 'ocupado'
                return (
                  <div key={n} style={s.numCell(ocupado)}>
                    {ocupado ? '✓' : n}
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: '#777', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '3px', display: 'inline-block' }} /> Libre
              </span>
              <span style={{ fontSize: '11px', color: '#777', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', background: '#c9a035', border: '1px solid #e8bc4a', borderRadius: '3px', display: 'inline-block' }} /> Tomado
              </span>
            </div>
          </div>
        )}

        {/* Buscador y exportar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'center' }}>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, teléfono o número..."
            style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '9px 14px', fontSize: '13px', color: '#fff', outline: 'none' }}
          />
          <button
            onClick={() => exportarCSV(participantes, rifa?.precio)}
            title="Exportar a CSV"
            style={{ background: '#1a3a1a', border: '1px solid #2e7d32', color: '#66bb6a', fontSize: '12px', fontWeight: '700', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ⬇ CSV
          </button>
        </div>

        {/* Filtros */}
        <div style={s.filterBar}>
          {['todos', 'pagados', 'pendientes'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={s.filterBtn(filtro === f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pendientes' && pendientes > 0 && (
                <span style={{ marginLeft: '6px', background: '#ef5350', color: '#fff', fontSize: '10px', borderRadius: '50px', padding: '1px 6px' }}>{pendientes}</span>
              )}
            </button>
          ))}
        </div>

        {/* Lista participantes */}
        <div>
          {filtrados.length === 0 && (
            <p style={{ color: '#555', textAlign: 'center', padding: '40px 0', fontSize: '14px' }}>
              {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay participantes aún'}
            </p>
          )}
          {filtrados.map(p => (
            <div key={p.id} style={s.participantCard(p.pagado)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '700', color: '#fff', fontSize: '14px', margin: '0 0 2px' }}>{p.nombre} {p.apellido}</p>
                  <p style={{ color: '#888', fontSize: '12px', margin: '0 0 1px' }}>{p.telefono}</p>
                  <p style={{ color: '#666', fontSize: '12px', margin: '0 0 8px' }}>
                    Pago a nombre de: <span style={{ color: '#ccc', fontWeight: '600' }}>{p.nombrePago}</span>
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
                    {p.numeros?.sort((a, b) => a - b).map(n => (
                      <span key={n} style={s.numeroBadge}>#{n}</span>
                    ))}
                  </div>
                  <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                    {p.metodoPago === 'mercadopago' ? '💳 Mercado Pago' : '💵 Efectivo'} ·{' '}
                    <span style={{ color: '#e8bc4a', fontWeight: '700' }}>${((p.numeros?.length || 0) * (rifa?.precio || 0)).toLocaleString()}</span>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                  <span style={s.badge(p.pagado)}>{p.pagado ? '✓ Pagado' : '⏳ Pendiente'}</span>
                  <button onClick={() => togglePagado(p.id, !p.pagado)} style={s.btnToggle(p.pagado)}>
                    {p.pagado ? 'Marcar pendiente' : 'Marcar pagado'}
                  </button>
                  <button onClick={() => setConfirmEliminar(p)}
                    style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '50px', fontWeight: '600', cursor: 'pointer', background: 'transparent', color: '#ef5350', border: '1px solid #4a1515' }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editando && rifa && <RifaEditor rifa={rifa} onClose={() => setEditando(false)} />}

      {confirmEliminar && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <p style={{ fontSize: '36px', margin: '0 0 10px' }}>🗑️</p>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>
              ¿Eliminar a {confirmEliminar.nombre} {confirmEliminar.apellido}?
            </h3>
            <p style={{ color: '#777', fontSize: '13px', margin: '0 0 6px' }}>
              Se liberarán los números:{' '}
              <span style={{ color: '#e8bc4a', fontWeight: '700' }}>
                {confirmEliminar.numeros?.sort((a, b) => a - b).join(', ')}
              </span>
            </p>
            <p style={{ color: '#555', fontSize: '12px', margin: '0 0 20px' }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmEliminar(null)}
                style={{ flex: 1, border: '1px solid #333', color: '#ccc', fontWeight: '600', padding: '10px', borderRadius: '50px', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={async () => { await eliminarParticipante(confirmEliminar.id, confirmEliminar.numeros); setConfirmEliminar(null) }}
                style={{ flex: 1, background: '#c62828', color: '#fff', fontWeight: '600', padding: '10px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReset && (
        <div style={s.modalOverlay}>
          <div style={s.modalCard}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>⚠️</p>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 8px' }}>¿Iniciar nueva rifa?</h3>
            <p style={{ color: '#777', fontSize: '13px', margin: '0 0 20px' }}>Se resetean todos los números. Los participantes actuales quedan archivados.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setConfirmReset(false)}
                style={{ flex: 1, border: '1px solid #333', color: '#ccc', fontWeight: '600', padding: '10px', borderRadius: '50px', background: 'transparent', cursor: 'pointer', fontSize: '14px' }}>
                Cancelar
              </button>
              <button onClick={async () => { await resetearNumeros(); setConfirmReset(false) }}
                style={{ flex: 1, background: '#c62828', color: '#fff', fontWeight: '600', padding: '10px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
