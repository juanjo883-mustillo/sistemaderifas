import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import NumeroCell from '../components/NumeroCell'
import { useRifa } from '../hooks/useRifa'
import { liberarReservasExpiradas, crearReservaTemporal } from '../firebase/rifaService'

const MAX_NUMEROS = 20

function useCountdownRifa(fechaFin) {
  const [restante, setRestante] = useState(null)
  useEffect(() => {
    if (!fechaFin) { setRestante(null); return }
    const target = fechaFin.toDate ? fechaFin.toDate() : new Date(fechaFin)
    function tick() { setRestante(Math.max(0, target - new Date())) }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [fechaFin])
  return restante
}

function formatTiempo(ms) {
  if (ms <= 0) return 'FINALIZADA'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  if (d > 0) return `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(seg).padStart(2,'0')}`
}

export default function Home() {
  const { rifa, cargando, errorFirebase } = useRifa()
  const [seleccionados, setSeleccionados] = useState([])
  const [limiteMensaje, setLimiteMensaje] = useState(false)
  const [reservando, setReservando] = useState(false)
  const [errorReserva, setErrorReserva] = useState('')
  const navigate = useNavigate()
  const tiempoRestante = useCountdownRifa(rifa?.fechaFin)

  useEffect(() => {
    liberarReservasExpiradas().catch(() => {})
  }, [])

  function getEstadoNumero(n) {
    const base = rifa?.numeros?.[String(n)]?.estado || 'libre'
    if (base !== 'libre') return base
    const temp = rifa?.reservas_temp?.[String(n)]
    if (temp?.expiraEn?.toDate?.() > new Date()) return 'reservado_temp'
    return 'libre'
  }

  function toggleNumero(n) {
    setErrorReserva('')
    setSeleccionados(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n)
      if (prev.length >= MAX_NUMEROS) {
        setLimiteMensaje(true)
        setTimeout(() => setLimiteMensaje(false), 3000)
        return prev
      }
      return [...prev, n]
    })
  }

  async function continuar() {
    if (seleccionados.length === 0) return
    setReservando(true)
    setErrorReserva('')
    try {
      const { reservaId, expiraEn } = await crearReservaTemporal(seleccionados)
      navigate('/pago', {
        state: {
          numeros: seleccionados,
          precio: rifa.precio,
          whatsapp: rifa.whatsapp,
          linkMercadoPago: rifa.linkMercadoPago,
          reservaId,
          expiraEn,
        }
      })
    } catch (err) {
      setErrorReserva(err.message)
      setReservando(false)
    }
  }

  if (errorFirebase) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a1a1a' }}>
        <div className="text-center max-w-sm">
          <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
          <h2 className="font-rustica text-2xl font-bold text-white mb-2">Firebase no configurado</h2>
          <p className="text-gray-400 text-sm">Configurá las credenciales en <code className="bg-gray-800 px-1 rounded text-xs">src/firebase/config.js</code></p>
        </div>
      </div>
    )
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a1a1a' }}>
        <div className="text-center">
          <img src="/logo.jpeg" alt="El Rincón Criollo" className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-yellow-600" />
          <p className="text-gray-300 font-rustica text-lg animate-pulse">Cargando rifa...</p>
        </div>
      </div>
    )
  }

  const rifaFinalizada = tiempoRestante !== null && tiempoRestante <= 0
  const vendidos = Object.values(rifa.numeros || {}).filter(v => v.estado === 'ocupado').length
  const libres = Array.from({ length: 100 }, (_, i) => i + 1)
    .filter(n => getEstadoNumero(n) === 'libre').length
  const porcentaje = (vendidos / 100) * 100

  return (
    <div className="min-h-screen pb-10" style={{ background: '#1a1a1a' }}>

      {/* Header */}
      <div
        className="relative text-white text-center overflow-hidden"
        style={{ height: '320px', backgroundImage: 'url(/portamate.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center 75%' }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.78) 100%)' }} />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <img src="/logo.jpeg" alt="El Rincón Criollo" className="w-20 h-20 rounded-full mb-3 object-cover shadow-lg" style={{ border: '2px solid #c9a035' }} />
          <div className="text-xs tracking-widest uppercase mb-2 px-4 py-0.5 rounded-full" style={{ border: '1px solid #c9a035', color: '#e8bc4a' }}>
            Rifa Oficial
          </div>
          <h1 className="font-rustica text-4xl font-bold text-white drop-shadow-lg">{rifa.titulo}</h1>
          {rifa.descripcion && <p className="text-gray-300 mt-1 text-sm">{rifa.descripcion}</p>}
          <p className="font-semibold mt-2 text-lg drop-shadow" style={{ color: '#e8bc4a' }}>
            ${rifa.precio?.toLocaleString()} <span className="text-gray-300 text-sm font-normal">por número</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">{libres} números disponibles</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">

        {/* Countdown rifa */}
        {tiempoRestante !== null && (
          <div className="mb-5 rounded-xl p-4 text-center" style={{ background: rifaFinalizada ? '#3a1a1a' : '#111', border: `1px solid ${rifaFinalizada ? '#ef5350' : '#c9a035'}` }}>
            {rifaFinalizada ? (
              <p style={{ color: '#ef5350', fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '16px', margin: 0 }}>
                🔒 Esta rifa ha finalizado
              </p>
            ) : (
              <>
                <p style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 4px' }}>La rifa cierra en</p>
                <p style={{ color: '#e8bc4a', fontFamily: 'Georgia, serif', fontWeight: '700', fontSize: '28px', margin: 0, letterSpacing: '2px' }}>
                  {formatTiempo(tiempoRestante)}
                </p>
              </>
            )}
          </div>
        )}

        {/* Barra de progreso */}
        <div className="mb-5">
          <div style={{ background: '#2a2a2a', borderRadius: '50px', height: '8px', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg, #c9a035, #e8bc4a)', height: '100%', width: `${porcentaje}%`, borderRadius: '50px', transition: 'width 0.6s ease' }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <p style={{ color: '#888', fontSize: '11px' }}>{vendidos} vendidos</p>
            <p style={{ color: '#888', fontSize: '11px' }}>{100 - vendidos} disponibles</p>
          </div>
        </div>

        {/* Premios */}
        {rifa.premios && rifa.premios.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: '#c9a035' }} />
              <h2 className="font-rustica text-xl font-bold text-white">Premios</h2>
              <div className="flex-1 h-px" style={{ background: '#c9a035' }} />
            </div>
            <div className={`grid gap-3 ${rifa.premios.length === 1 ? 'grid-cols-1' : rifa.premios.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {rifa.premios.map((premio, idx) => (
                <div key={premio.id} className="rounded-xl overflow-hidden shadow-md" style={{ border: '1px solid #333' }}>
                  {premio.foto
                    ? <img src={premio.foto} alt={premio.nombre} className="w-full h-44 object-cover" />
                    : <div className="w-full h-44 flex items-center justify-center" style={{ background: '#2a2a2a' }}><span className="text-4xl">🎁</span></div>
                  }
                  <div className="p-3" style={{ background: '#111' }}>
                    <p className="font-bold text-white text-sm">{premio.nombre || `Premio ${idx + 1}`}</p>
                    {premio.descripcion && <p className="text-gray-400 text-xs mt-1">{premio.descripcion}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leyenda */}
        <div className="flex flex-wrap gap-4 justify-center mb-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-gray-500 bg-white inline-block" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded inline-block" style={{ background: '#c9a035', border: '2px solid #a07828' }} /> Seleccionado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded inline-block" style={{ background: '#2a1e08', border: '2px solid #c9a03555' }} /> En proceso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded overflow-hidden inline-block" style={{ border: '2px solid #2a2a2a' }}>
              <img src="/logo.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }} />
            </span> Tomado
          </span>
        </div>

        {/* Cuadrícula */}
        <div className="rounded-xl p-4 shadow-lg" style={{ background: '#111', border: '2px solid #333' }}>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(n => (
              <NumeroCell
                key={n}
                numero={n}
                estado={getEstadoNumero(n)}
                seleccionado={seleccionados.includes(n)}
                onClick={!rifaFinalizada ? toggleNumero : () => {}}
              />
            ))}
          </div>
        </div>

        {/* Mensaje límite */}
        {limiteMensaje && (
          <div className="mt-3 rounded-xl p-3 text-center" style={{ background: '#2a1e08', border: '1px solid #c9a035' }}>
            <p style={{ color: '#e8bc4a', fontSize: '13px', margin: 0 }}>Máximo {MAX_NUMEROS} números por compra</p>
          </div>
        )}

        {/* Error reserva */}
        {errorReserva && (
          <div className="mt-3 rounded-xl p-3" style={{ background: '#3a1a1a', border: '1px solid #4a1515' }}>
            <p style={{ color: '#ef5350', fontSize: '13px', margin: 0 }}>⚠️ {errorReserva}</p>
          </div>
        )}

        {/* Seleccionados y botón */}
        <div className="mt-6 text-center">
          {seleccionados.length > 0 && (
            <div className="mb-4 rounded-xl p-4 shadow-sm" style={{ background: '#111', border: '1px solid #c9a035' }}>
              <p className="text-gray-300 text-sm">
                Números elegidos:{' '}
                <span className="font-bold" style={{ color: '#e8bc4a' }}>{seleccionados.sort((a, b) => a - b).join(', ')}</span>
              </p>
              <p className="text-white text-lg font-bold mt-1">
                Total: ${(seleccionados.length * rifa.precio).toLocaleString()}
              </p>
              <p style={{ color: '#666', fontSize: '11px', marginTop: '4px' }}>
                {seleccionados.length}/{MAX_NUMEROS} números seleccionados
              </p>
            </div>
          )}

          {!rifaFinalizada ? (
            <button
              onClick={continuar}
              disabled={seleccionados.length === 0 || reservando}
              className="font-rustica font-bold py-3 px-10 rounded-full text-lg shadow-md transition-all"
              style={seleccionados.length === 0 || reservando
                ? { background: '#333', color: '#777', cursor: 'not-allowed', border: '1px solid #444' }
                : { background: '#c9a035', color: '#000', border: '1px solid #e8bc4a' }
              }
            >
              {reservando ? 'Reservando...' : seleccionados.length === 0 ? 'Elegí un número' : 'Continuar →'}
            </button>
          ) : (
            <p style={{ color: '#ef5350', fontFamily: 'Georgia, serif', fontSize: '15px' }}>Esta rifa ya cerró. ¡Gracias a todos!</p>
          )}
        </div>

        {/* Link Mi Reserva */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/mi-reserva')}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ¿Ya participaste? Consultá el estado de tu reserva →
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          El Rincón Criollo · Rifas con tradición 🐄
        </p>
      </div>
    </div>
  )
}
