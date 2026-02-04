# Contexto: Plataforma PARLAY B2B / White-Label

## Rol y enfoque
Actúa como arquitecto de software y desarrollador senior especializado en plataformas de apuestas deportivas, sistemas B2B y motores de reglas.

## Contexto del producto
Estamos construyendo una plataforma web de apuestas deportivas tipo PARLAY, orientada a un modelo B2B / white-label.

La plataforma NO es una casa de apuestas.
Funciona como un motor neutral de construcción de parlays que será rentado a múltiples casas de apuestas (sportsbooks), las cuales usarán la plataforma para vender jugadas a sus usuarios finales.

Cada casa de apuestas:
- Tiene su propia marca
- Provee sus propias cuotas
- Define sus propias reglas de combinación
- Decide qué mercados y deportes habilita
- Ajusta o bloquea combinaciones correlacionadas

La plataforma debe ser multi-tenant y completamente configurable por casa.

## Objetivo
Diseñar e implementar una API y la lógica de negocio que permita:

1. Consumir odds de múltiples APIs externas
2. Normalizar eventos, mercados y selecciones
3. Recibir una lista de jugadas disponibles por evento
4. Resolver AUTOMÁTICAMENTE todas las combinaciones válidas de jugadas
   (parlays y same game parlays) según las reglas de cada casa de apuestas
5. Clasificar cada combinación por:
   - válida / inválida
   - nivel de correlación (bajo / medio / alto)
   - cuota ajustada o no ajustada
6. Exponer estas combinaciones a una aplicación web
7. Enviar la jugada seleccionada a la casa de apuestas correspondiente
   para su procesamiento final

## Tipos de apuestas soportadas
- head_to_head (ganador del partido)
- spread (hándicap de puntos o goles)
- totals (over / under)
- props (si aplica)

## Resolución automática de jugadas
La API debe:
- Tomar una lista de jugadas disponibles de un evento
- Generar todas las combinaciones posibles (parlays)
- Aplicar reglas por casa de apuestas para:
  - permitir
  - bloquear
  - o ajustar cuotas por correlación
- Evitar combinaciones duplicadas o lógicamente incompatibles
- Permitir configurar:
  - número máximo de selecciones por parlay
  - deportes y mercados excluidos
  - reglas específicas por tipo de apuesta

## Reglas base (ejemplo)
- head_to_head + totals → permitido
- spread + totals → permitido
- apuestas idénticas o mutuamente excluyentes → no permitidas

## Restricciones
- La plataforma no asume riesgo financiero
- La casa de apuestas es responsable del payout
- La plataforma solo construye, valida y envía parlays

## Criterio de calidad
Priorizar claridad, escalabilidad y facilidad de mantenimiento.
Evitar sobre-ingeniería innecesaria.
