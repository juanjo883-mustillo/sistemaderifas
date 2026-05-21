import { useState } from 'react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { useNavigate } from 'react-router-dom'

async function hashTexto(texto) {
  const data = new TextEncoder().encode(texto)
  const buffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function validarCodigo(codigo) {
  const snap = await getDoc(doc(db, 'config', 'registro'))
  if (!snap.exists()) return false
  const hashIngresado = await hashTexto(codigo)
  return hashIngresado === snap.data().codigoHash
}

const s = {
  page: { minHeight: '100vh', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  card: { background: '#fff', border: '1px solid #ddd', borderRadius: '18px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '380px' },
  label: { display: 'block', color: '#111', fontSize: '13px', fontWeight: '600', marginBottom: '4px' },
  input: { width: '100%', border: '1.5px solid #ccc', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#111', background: '#fff', outline: 'none', boxSizing: 'border-box' },
  btnPrimary: { width: '100%', background: '#111', color: '#fff', fontWeight: '700', fontSize: '16px', padding: '12px', borderRadius: '50px', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', marginTop: '4px' },
  btnSecondary: { width: '100%', background: 'transparent', color: '#555', fontSize: '13px', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginTop: '8px' },
  error: { background: '#fff0f0', border: '1px solid #fcc', color: '#c00', fontSize: '13px', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' },
  success: { background: '#f0fff0', border: '1px solid #9d9', color: '#070', fontSize: '13px', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' },
  tabs: { display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid #ddd', marginBottom: '20px' },
  tabActive: { flex: 1, padding: '10px', background: '#111', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
  tabInactive: { flex: 1, padding: '10px', background: '#fff', color: '#555', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px' },
}

export default function Login() {
  const [modo, setModo] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codigoAcceso, setCodigoAcceso] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  function limpiar() { setError(''); setMensaje(''); setPassword(''); setConfirmPassword(''); setCodigoAcceso('') }
  function cambiarModo(m) { limpiar(); setModo(m) }

  async function handleLogin(e) {
    e.preventDefault(); setCargando(true); setError('')
    try { await signInWithEmailAndPassword(auth, email, password); navigate('/vendedor') }
    catch { setError('Email o contraseña incorrectos'); setCargando(false) }
  }

  async function handleRegistro(e) {
    e.preventDefault(); setError('')
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setCargando(true)
    try {
      const codigoValido = await validarCodigo(codigoAcceso)
      if (!codigoValido) { setError('Código de acceso incorrecto'); setCargando(false); return }
      await createUserWithEmailAndPassword(auth, email, password)
      navigate('/vendedor')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Ese email ya está registrado')
      else if (err.code === 'auth/invalid-email') setError('El email no es válido')
      else setError('Error al crear la cuenta. Intentá de nuevo.')
      setCargando(false)
    }
  }

  async function handleReset(e) {
    e.preventDefault(); setError(''); setCargando(true)
    try { await sendPasswordResetEmail(auth, email); setMensaje(`Link enviado a ${email}. Revisá tu bandeja y el spam.`) }
    catch { setError('No encontramos ese email.') }
    finally { setCargando(false) }
  }

  return (
    <div style={s.page}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/logo.jpeg" alt="El Rincón Criollo" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 8px', display: 'block', border: '2px solid #c9a035' }} />
          <p style={{ color: '#111', fontSize: '11px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase' }}>Panel de Vendedor</p>
        </div>

        <div style={s.card}>
          {/* Tabs */}
          {modo !== 'reset' && (
            <div style={s.tabs}>
              <button onClick={() => cambiarModo('login')} style={modo === 'login' ? s.tabActive : s.tabInactive}>Iniciar sesión</button>
              <button onClick={() => cambiarModo('registro')} style={modo === 'registro' ? s.tabActive : s.tabInactive}>Crear cuenta</button>
            </div>
          )}

          {/* LOGIN */}
          {modo === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={s.input} placeholder="vendedor@email.com" />
              </div>
              <div>
                <label style={s.label}>Contraseña</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={s.input} />
              </div>
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" disabled={cargando} style={{ ...s.btnPrimary, opacity: cargando ? 0.6 : 1 }}>
                {cargando ? 'Ingresando...' : 'Ingresar'}
              </button>
              <button type="button" onClick={() => cambiarModo('reset')} style={s.btnSecondary}>
                Olvidé mi contraseña
              </button>
            </form>
          )}

          {/* REGISTRO */}
          {modo === 'registro' && (
            <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={s.label}>Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={s.input} placeholder="vendedor@email.com" />
              </div>
              <div>
                <label style={s.label}>Contraseña</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={s.input} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label style={s.label}>Confirmar contraseña</label>
                <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Código de acceso</label>
                <input type="password" required value={codigoAcceso} onChange={e => setCodigoAcceso(e.target.value)} style={s.input} placeholder="Código del administrador" />
                <p style={{ color: '#888', fontSize: '11px', marginTop: '4px' }}>Solo pueden registrarse quienes tengan el código</p>
              </div>
              {error && <div style={s.error}>{error}</div>}
              <button type="submit" disabled={cargando} style={{ ...s.btnPrimary, opacity: cargando ? 0.6 : 1 }}>
                {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </form>
          )}

          {/* RESET */}
          {modo === 'reset' && (
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <p style={{ fontSize: '28px' }}>🔑</p>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '20px', fontWeight: '700', color: '#111' }}>Recuperar contraseña</h3>
                <p style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>Te enviamos un link a tu email</p>
              </div>
              <div>
                <label style={s.label}>Tu email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={s.input} placeholder="vendedor@email.com" />
              </div>
              {error && <div style={s.error}>{error}</div>}
              {mensaje && <div style={s.success}>{mensaje}</div>}
              {!mensaje && (
                <button type="submit" disabled={cargando} style={{ ...s.btnPrimary, opacity: cargando ? 0.6 : 1 }}>
                  {cargando ? 'Enviando...' : 'Enviar link de recuperación'}
                </button>
              )}
              <button type="button" onClick={() => cambiarModo('login')} style={s.btnSecondary}>
                ← Volver al inicio de sesión
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#999', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
            ← Volver a la rifa
          </button>
        </div>
        <p style={{ textAlign: 'center', color: '#999', fontSize: '11px', marginTop: '8px' }}>El Rincón Criollo · Panel de vendedor</p>
      </div>
    </div>
  )
}
