import {
  error,
  warning,
  notice,
  type AnnotationProperties
} from '@actions/core'

const logger = {
  log: (message: string, properties?: AnnotationProperties) => {
    notice(message, properties)
  },
  error: (message: string, properties?: AnnotationProperties) => {
    error(message, properties)
  },
  warning: (message: string, properties?: AnnotationProperties) => {
    warning(message, properties)
  }
}

export default logger
