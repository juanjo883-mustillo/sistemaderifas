import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buscarPorTelefono } from '../firebase/rifaService'
import { useRifa } from '../hooks/useRifa'

export default function MiReserva() {
  const [telefono, setTelefono] = useState('')
  const [reservas, setReservas] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')
  const { rifa } = useRifa()
  const navigate = useNavigate()

  async function buscar(e) {
    e.preventDefault()
    setBuscando(true)
    setError('')
    setReservas(null)
    try {
      const res = await buscarPorTelefono(telefono.trim())
      setReservas(res)
      if (res.length === 0) setError('No encontramos reservas con ese número de teléfono.')
    } catch {
      setError('No se pudo buscar. Verificá tu conexión e intentá de nuevo.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#1a1a1a', padding: '32px 16px' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/logo.jpeg" alt="El Rincón Criollo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #c9a035', margin: '0 auto 10px', display: 'block' }} />
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>Mi Reserva</h1>
          <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Consultá el estado de tu reserva</p>
        </div>

        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', fontSize: '13px', cursor: 'pointer', marginBottom: '20px', padding: 0 }}>
          ← Volver al inicio
        </button>

        {/* Formulario */}
        <form onSubmit={buscar} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '18px', padding: '24px', marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#ccc', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            Tu número de teléfono
          </label>
          <input
            type="tel"
            required
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="Ej: 11 2233 4455"
            style={{ width: '100%', background: '#1a1a1a', border: '1.5px solid #2a2a2a', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#fff', outline: 'none', boxSizing: 'border-box', marginBottom: '14px' }}
          />
          <button
            type="submit"
            disabled={buscando}
            style={{ width: '100%', background: '#c9a035', color: '#000', fontWeight: '700', fontSize: '15px', padding: '12px', borderRadius: '50px', border: 'none', cursor: buscando ? 'not-allowed' : 'pointer', opacity: buscando ? 0.7 : 1, fontFamily: 'Georgia, serif' }}
          >
            {buscando ? 'Buscando...' : 'Buscar mi reserva'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div style={{ background: '#3a1a1a', border: '1px solid #4a1515', color: '#ef5350', fontSize: '13px', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Resultados */}
        {reservas && reservas.length > 0 && (
          <div>
            <p style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
              {reservas.length} reserva{reservas.length > 1 ? 's' : ''} encontrada{reservas.length > 1 ? 's' : ''}
            </p>
            {reservas.map(r => (
              <div key={r.id} style={{ background: '#111', border: `2px solid ${r.pagado ? '#2e7d32' : '#c9a03566'}`, borderRadius: '16px', padding: '18px', marginBottom: '12px' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#fff', fontSize: '15px', margin: '0 0 3px' }}>{r.nombre} {r.apellido}</p>
                    <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>
                      {r.metodoPago === 'mercadopago' ? '💳 Mercado Pago' : '💵 Efectivo'}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '50px', background: r.pagado ? '#1a3a1a' : '#3a1a1a', color: r.pagado ? '#66bb6a' : '#ef5350', whiteSpace: 'nowrap' }}>
                    {r.pagado ? '✓ Confirmado' : '⏳ Pendiente'}
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <p style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Números reservados</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {r.numeros?.sort((a, b) => a - b).map(n => (
                      <span key={n} style={{ background: '#1e1e1e', border: '1px solid #c9a035', color: '#e8bc4a', fontSize: '12px', fontWeight: '700', padding: '3px 10px', borderRadius: '50px' }}>
                        #{n}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #2a2a2a', paddingTop: '10px' }}>
                  <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Total</p>
                  <p style={{ color: '#e8bc4a', fontWeight: '700', fontSize: '15px', margin: 0 }}>
                    ${((r.numeros?.length || 0) * (rifa?.precio || 0)).toLocaleString()}
                  </p>
                </div>

                {!r.pagado && (
                  <p style={{ color: '#666', fontSize: '11px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #2a2a2a' }}>
                    Tu pago está siendo verificado. Si ya pagaste, aguardá la confirmación del vendedor.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <p style={{ textAlign: 'center', color: '#444', fontSize: '11px', marginTop: '24px' }}>
          El Rincón Criollo · Rifas con tradición
        </p>
      </div>
    </div>
  )
}
