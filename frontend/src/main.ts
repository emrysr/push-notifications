import { createApp } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import 'bulma/css/bulma.min.css'
import './style.css'
import App from './App.vue'
import router from './router'
import { setLastNotification } from './store/notification'

useRegisterSW({ immediate: true })

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'push-navigate') return
    setLastNotification({
      url: event.data.url,
      title: event.data.title,
      body: event.data.body,
    })
    router.push(event.data.url)
  })
}

createApp(App).use(router).mount('#app')
