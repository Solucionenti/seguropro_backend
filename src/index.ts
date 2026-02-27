import { app } from '@/app'
import { envConfig } from '@/config/env'

app.listen(envConfig.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${envConfig.PORT}`)
  console.log(`📖 OpenAPI docs at http://localhost:${envConfig.PORT}/openapi`)
  console.log(`🌍 Environment: ${envConfig.NODE_ENV}`)
})
