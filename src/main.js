import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import { focusDirective } from './directives'
import 'element-plus/dist/index.css'
import './styles/global.scss'


const app = createApp(App)

app.directive('focus', focusDirective)

app.use(router)
app.use(store)
app.use(ElementPlus)

app.mount('#app')
