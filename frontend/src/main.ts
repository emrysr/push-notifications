import { createApp } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import 'bulma/css/bulma.min.css'
import './style.css'
import App from './App.vue'
import router from './router'

useRegisterSW({ immediate: true })

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'push-navigate') return
    router.push(event.data.url)
  })
}

createApp(App).use(router).mount('#app')
