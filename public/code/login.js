document.addEventListener('alpine:init', () => {
  const params = new URLSearchParams(window.location.search)
  const adminRequest = params.has('admin')

  const webapp = './webapp.html'

  Alpine.data('login', () => ({
    exibir: false,
    telefone: '',
    nome: '',
    estado: '',
    municipio: '',

    init() {
      auth.onAuthStateChanged(async (v) => {
        if (!v) {
          const loginDialog = document.querySelector('#loginDialog')
          if (!loginDialog) return
          const ui = new firebaseui.auth.AuthUI(auth)
          ui.start('#loginDialog', {
            callbacks: {
              signInSuccess: () => {
                loginDialog.remove()
                return false
              },
            },
            signInOptions: [
              {
                provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
                defaultCountry: 'BR',
              },
            ],
          })
          return
        }
        const doc = await usuarios.doc(v.uid).get()
        if (!doc.exists) {
          this.exibir = true
          return
        }
        const data = doc.data()
        this.telefone = v.phoneNumber
        this.nome = data.nome
        this.estado = data.estado
        this.municipio = data.municipio
        if (isAdmin(data, v.uid)) {
          window.location.replace(adminRequest ? './adm.html' : webapp)
        } else {
          if (adminRequest) alert('Você não é um administrador.')
          window.location.replace(webapp)
        }
      })
    },

    async atualizar() {
      await usuarios.doc(auth.currentUser.uid).set(
        {
          telefone: this.telefone,
          nome: this.nome,
          estado: this.estado,
          municipio: this.municipio,
        },
        { merge: true }
      )
      window.location.replace(webapp)
    },
  }))
})
