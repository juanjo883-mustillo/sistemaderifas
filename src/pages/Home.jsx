import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NumeroCell from '../components/NumeroCell'
import { useRifa } from '../hooks/useRifa'

export default function Home() {
  const { rifa, cargando, errorFirebase } = useRifa()
  const [seleccionados, setSeleccionados] = useState([])
  const navigate = useNavigate()

  function toggleNumero(n) {
    setSeleccionados(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n]
    )
  }

  function continuar() {
    if (seleccionados.length === 0) return
    navigate('/pago', { state: { numeros: seleccionados, precio: rifa.precio, whatsapp: rifa.whatsapp, linkMercadoPago: rifa.linkMercadoPago } })
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

  const libres = Object.values(rifa.numeros || {}).filter(n => n.estado === 'libre').length

  return (
    <div className="min-h-screen pb-10" style={{ background: '#1a1a1a' }}>

      {/* Header — foto con altura fija y overlay */}
      <div
        className="relative text-white text-center overflow-hidden"
        style={{
          height: '320px',
          backgroundImage: 'url(/portamate.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 75%',
        }}
      >
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.78) 100%)'
        }} />
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <img
            src="/logo.jpeg"
            alt="El Rincón Criollo"
            className="w-20 h-20 rounded-full mb-3 object-cover shadow-lg"
            style={{ border: '2px solid #c9a035' }}
          />
          <div className="text-xs tracking-widest uppercase mb-2 px-4 py-0.5 rounded-full"
            style={{ border: '1px solid #c9a035', color: '#e8bc4a' }}>
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
                  {premio.foto ? (
                    <img src={premio.foto} alt={premio.nombre} className="w-full h-44 object-cover" />
                  ) : (
                    <div className="w-full h-44 flex items-center justify-center" style={{ background: '#2a2a2a' }}>
                      <span className="text-4xl">🎁</span>
                    </div>
                  )}
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
        <div className="flex gap-5 justify-center mb-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded border-2 border-gray-500 bg-white inline-block" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded inline-block" style={{ background: '#c9a035', border: '2px solid #a07828' }} /> Seleccionado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-black border-2 border-gray-700 inline-block" /> Tomado
          </span>
        </div>

        {/* Cuadrícula */}
        <div className="rounded-xl p-4 shadow-lg" style={{ background: '#111', border: '2px solid #333' }}>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 100 }, (_, i) => i + 1).map(n => (
              <NumeroCell
                key={n}
                numero={n}
                estado={rifa.numeros?.[String(n)]?.estado || 'libre'}
                seleccionado={seleccionados.includes(n)}
                onClick={toggleNumero}
              />
            ))}
          </div>
        </div>

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
            </div>
          )}

          <button
            onClick={continuar}
            disabled={seleccionados.length === 0}
            className="font-rustica font-bold py-3 px-10 rounded-full text-lg shadow-md transition-all"
            style={seleccionados.length === 0
              ? { background: '#333', color: '#777', cursor: 'not-allowed', border: '1px solid #444' }
              : { background: '#c9a035', color: '#000', border: '1px solid #e8bc4a' }
            }
          >
            {seleccionados.length === 0 ? 'Elegí un número' : 'Continuar →'}
          </button>
        </div>

        <p className="text-center text-gray-600 text-xs mt-8">
          El Rincón Criollo · Rifas con tradición 🐄
        </p>
      </div>
    </div>
  )
}
