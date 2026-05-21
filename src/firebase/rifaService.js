import { db } from './config'
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, onSnapshot, serverTimestamp, getDocs,
  deleteField, Timestamp, query, where
} from 'firebase/firestore'

const RIFA_DOC = 'activa'
const RIFA_COL = 'rifas'
const PARTICIPANTES_COL = 'participantes'

export async function inicializarRifa() {
  const rifaRef = doc(db, RIFA_COL, RIFA_DOC)
  const snap = await getDoc(rifaRef)
  if (snap.exists()) return

  const numeros = {}
  for (let i = 1; i <= 100; i++) {
    numeros[String(i)] = { estado: 'libre' }
  }

  await setDoc(rifaRef, {
    titulo: 'El Rincón Criollo',
    descripcion: 'Participá y ganá increíbles premios',
    precio: 2500,
    whatsapp: '541137629154',
    premios: [{ id: '1', nombre: '1° Premio: Martín Fierro', descripcion: '', foto: '' }],
    numeros,
    reservas_temp: {},
    fechaFin: null,
    activa: true,
    creadaEn: serverTimestamp(),
  })
}

export function suscribirRifa(callback) {
  const rifaRef = doc(db, RIFA_COL, RIFA_DOC)
  return onSnapshot(rifaRef, (snap) => {
    if (snap.exists()) callback(snap.data())
  })
}

export async function actualizarConfigRifa(datos) {
  await updateDoc(doc(db, RIFA_COL, RIFA_DOC), datos)
}

export async function actualizarPremios(premios) {
  await updateDoc(doc(db, RIFA_COL, RIFA_DOC), { premios })
}

export async function crearReservaTemporal(numeros) {
  const rifaRef = doc(db, RIFA_COL, RIFA_DOC)
  const snap = await getDoc(rifaRef)
  if (!snap.exists()) throw new Error('Rifa no encontrada')

  const data = snap.data()
  const now = new Date()
  const expiraEn = Timestamp.fromDate(new Date(now.getTime() + 10 * 60 * 1000))

  for (const n of numeros) {
    if (data.numeros[String(n)]?.estado !== 'libre') {
      throw new Error(`El número ${n} ya fue tomado. Elegí otro.`)
    }
    const temp = data.reservas_temp?.[String(n)]
    if (temp && temp.expiraEn?.toDate() > now) {
      throw new Error(`El número ${n} está siendo reservado. Intentá en unos minutos.`)
    }
  }

  const reservaId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const updates = {}
  for (const n of numeros) {
    updates[`reservas_temp.${n}`] = { expiraEn, reservaId }
  }
  await updateDoc(rifaRef, updates)

  return { reservaId, expiraEn: expiraEn.toDate().toISOString() }
}

export async function liberarReservaTemporal(numeros) {
  const updates = {}
  for (const n of numeros) {
    updates[`reservas_temp.${n}`] = deleteField()
  }
  await updateDoc(doc(db, RIFA_COL, RIFA_DOC), updates)
}

export async function liberarReservasExpiradas() {
  const snap = await getDoc(doc(db, RIFA_COL, RIFA_DOC))
  if (!snap.exists()) return
  const reservas = snap.data().reservas_temp || {}
  const now = new Date()
  const updates = {}
  let hay = false
  for (const [n, r] of Object.entries(reservas)) {
    if (r.expiraEn?.toDate() <= now) {
      updates[`reservas_temp.${n}`] = deleteField()
      hay = true
    }
  }
  if (hay) await updateDoc(doc(db, RIFA_COL, RIFA_DOC), updates)
}

export async function reservarNumeros({ numeros, nombre, apellido, telefono, nombrePago, metodoPago, reservaId }) {
  const rifaRef = doc(db, RIFA_COL, RIFA_DOC)
  const snap = await getDoc(rifaRef)
  if (!snap.exists()) throw new Error('Rifa no encontrada')

  const data = snap.data()
  const now = new Date()

  for (const n of numeros) {
    if (data.numeros[String(n)]?.estado !== 'libre') {
      throw new Error(`El número ${n} ya fue tomado. Elegí otro.`)
    }
    const temp = data.reservas_temp?.[String(n)]
    if (temp && temp.reservaId !== reservaId && temp.expiraEn?.toDate() > now) {
      throw new Error(`El número ${n} está siendo reservado por alguien más.`)
    }
  }

  const updates = {}
  for (const n of numeros) {
    updates[`numeros.${n}.estado`] = 'ocupado'
    updates[`reservas_temp.${n}`] = deleteField()
  }
  await updateDoc(rifaRef, updates)

  const docRef = await addDoc(collection(db, PARTICIPANTES_COL), {
    numeros,
    nombre,
    apellido,
    telefono,
    nombrePago: nombrePago || `${nombre} ${apellido}`,
    metodoPago,
    pagado: false,
    creadoEn: serverTimestamp(),
  })

  return docRef.id
}

export function suscribirParticipantes(callback) {
  return onSnapshot(collection(db, PARTICIPANTES_COL), (snap) => {
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(lista)
  })
}

export async function togglePagado(id, pagado) {
  await updateDoc(doc(db, PARTICIPANTES_COL, id), { pagado })
}

export async function eliminarParticipante(id, numeros) {
  await updateDoc(doc(db, PARTICIPANTES_COL, id), { _eliminado: true })
  const updates = {}
  for (const n of numeros) {
    updates[`numeros.${n}.estado`] = 'libre'
  }
  await updateDoc(doc(db, RIFA_COL, RIFA_DOC), updates)
}

export async function resetearNumeros() {
  const numeros = {}
  for (let i = 1; i <= 100; i++) {
    numeros[String(i)] = { estado: 'libre' }
  }
  await updateDoc(doc(db, RIFA_COL, RIFA_DOC), { numeros, reservas_temp: {} })
  const snap = await getDocs(collection(db, PARTICIPANTES_COL))
  await Promise.all(snap.docs.map(d => updateDoc(doc(db, PARTICIPANTES_COL, d.id), { _eliminado: true })))
}

export async function buscarPorTelefono(telefono) {
  const q = query(collection(db, PARTICIPANTES_COL), where('telefono', '==', telefono))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => !p._eliminado)
}
