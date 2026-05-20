import { useEffect, useState } from 'react'
import { suscribirRifa, inicializarRifa } from '../firebase/rifaService'

export function useRifa() {
  const [rifa, setRifa] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorFirebase, setErrorFirebase] = useState(false)

  useEffect(() => {
    let unsub = () => {}
    inicializarRifa()
      .then(() => {
        unsub = suscribirRifa((data) => {
          setRifa(data)
          setCargando(false)
        })
      })
      .catch(() => {
        setErrorFirebase(true)
        setCargando(false)
      })
    return () => unsub()
  }, [])

  return { rifa, cargando, errorFirebase }
}
