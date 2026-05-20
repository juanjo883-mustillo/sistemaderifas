import { db } from './config'
import {
  doc, getDoc, setDoc, updateDoc, collection,
  addDoc, onSnapshot, serverTimestamp, getDocs
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
    premios: [
      { id: '1', nombre: '1° Premio: Martín Fierro', descripcion: '', foto: '' }
    ],
    numeros,
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

export async function reservarNumeros({ numeros, nombre, apellido, telefono, nombrePago, metodoPago }) {
  const rifaRef = doc(db, RIFA_COL, RIFA_DOC)
  const snap = await getDoc(rifaRef)
  if (!snap.exists()) throw new Error('Rifa no encontrada')

  const data = snap.data()
  for (const n of numeros) {
    if (data.numeros[String(n)]?.estado !== 'libre') {
      throw new Error(`El número ${n} ya fue tomado. Elegí otro.`)
    }
  }

  const updates = {}
  for (const n of numeros) {
    updates[`numeros.${n}.estado`] = 'ocupado'
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
  await updateDoc(doc(db, RIFA_COL, RIFA_DOC), { numeros })

  const snap = await getDocs(collection(db, PARTICIPANTES_COL))
  await Promise.all(snap.docs.map(d => updateDoc(doc(db, PARTICIPANTES_COL, d.id), { _eliminado: true })))
}
