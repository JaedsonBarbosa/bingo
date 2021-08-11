import Alpine from 'alpinejs'

Alpine.data('index', () => ({
  instalar: undefined as undefined | Event,

  init() {
    function analisar() {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches
      if (standalone || fullscreen) window.open('./app.html', '_self')
    }
    analisar()
    window.addEventListener('beforeinstallprompt', (e) => (this.instalar = e))
    window.addEventListener('appinstalled', () => {
      this.instalar = undefined
      alert('Aplicativo instalado com sucesso.')
      analisar()
    })
  },
}))
Alpine.start()
