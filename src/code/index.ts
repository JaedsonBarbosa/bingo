import Alpine from 'alpinejs'

Alpine.data('index', () => ({
  instalar: undefined as undefined | (() => void),

  init() {
    function analisar() {
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      const fullscreen = window.matchMedia('(display-mode: fullscreen)').matches
      if (standalone || fullscreen) window.open('./app.html', '_self')
    }
    analisar()
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.instalar = (e as any).prompt as () => void
    })
    window.addEventListener('appinstalled', () => {
      this.instalar = undefined
      alert('Aplicativo instalado com sucesso.')
      analisar()
    })
  },
}))
Alpine.start()
