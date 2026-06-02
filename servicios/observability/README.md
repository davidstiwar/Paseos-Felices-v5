# Observability / Monitoring

La configuración de observabilidad (Prometheus, Jaeger, ELK, Grafana, etc.) ha sido removida
de este repositorio para simplificar la arquitectura. El proyecto utiliza una arquitectura
simplificada enfocada en microservicios con MySQL.

Si necesita monitoreo en producción, considere:
- Usar servicios gestionados (Datadog, New Relic, CloudWatch)
- Desplegar un stack separado de observabilidad

