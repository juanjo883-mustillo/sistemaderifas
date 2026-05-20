export default function NumeroCell({ numero, estado, seleccionado, onClick }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    aspectRatio: '1', fontSize: '11px', fontWeight: 'bold',
    borderRadius: '6px', cursor: 'pointer', userSelect: 'none',
    transition: 'all 0.12s ease', width: '100%', border: '1.5px solid',
  }

  const estilos = {
    libre: { ...base, background: '#fff', borderColor: '#555', color: '#222' },
    ocupado: { ...base, background: '#000', borderColor: '#333', color: '#888', cursor: 'not-allowed' },
    seleccionado: { ...base, background: '#c9a035', borderColor: '#e8bc4a', color: '#000', transform: 'scale(1.08)', boxShadow: '0 2px 6px rgba(201,160,53,0.4)' },
  }

  const estilo = seleccionado ? estilos.seleccionado : estilos[estado] || estilos.libre

  return (
    <button
      style={estilo}
      onClick={() => estado === 'libre' && onClick(numero)}
      disabled={estado === 'ocupado'}
      onMouseEnter={e => { if (estado === 'libre' && !seleccionado) { e.currentTarget.style.background = '#f5d98840'; e.currentTarget.style.borderColor = '#c9a035' } }}
      onMouseLeave={e => { if (estado === 'libre' && !seleccionado) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#555' } }}
    >
      {estado === 'ocupado' ? 'X' : numero}
    </button>
  )
}
