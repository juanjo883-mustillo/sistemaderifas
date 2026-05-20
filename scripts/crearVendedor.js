// Script de uso único — crea el usuario vendedor en Firebase Auth
const API_KEY = 'AIzaSyA5IY4Z9RulucnlfhnYh4DGswbpmBgxw2A'
const EMAIL = 'juanjo_883@hotmail.com'
const PASSWORD = '33443399'

async function crearUsuario() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    }
  )
  const data = await res.json()
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      console.log('✓ El usuario ya existe, todo bien.')
    } else {
      console.error('✗ Error:', data.error.message)
    }
  } else {
    console.log(`✓ Usuario creado: ${data.email}`)
    console.log(`  UID: ${data.localId}`)
  }
}

crearUsuario()
