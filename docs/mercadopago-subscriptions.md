# Suscripciones de AgendaLink con Mercado Pago

> Estado: el código está desplegado en producción y staging con D1/R2 separados. La configuración de cada aplicación de Mercado Pago se carga por separado mediante el script productivo.

## Alcance de la primera fase

- Mercado Pago Checkout de suscripciones para negocios de Chile, en CLP.
- Planes mensuales: Individual $9.900, Equipo $19.990 y Negocio $39.990.
- Nuevos negocios de Chile reciben 7 días de prueba en la aplicación. No se envía ningún cobro al registrarse; al terminar la prueba, el propietario autoriza una preapproval de Mercado Pago.
- Nuevos negocios de México quedan `UNBILLED` durante esta fase. Los negocios existentes sin una fila `BusinessSubscription` se consideran `LEGACY` y conservan acceso.
- Un pago rechazado deja 7 días de gracia. Al terminar la gracia se pausan las nuevas reservas online, pero el propietario conserva el acceso al panel de suscripción.

## Modelo y ciclo de vida

`BusinessSubscription` mantiene el estado de facturación separado de `Business.plan`. Cada negocio tiene como máximo una suscripción vigente (`currentBusinessId`); las suscripciones reemplazadas se conservan como historial. `SubscriptionPayment` registra los pagos recurrentes por ID único del proveedor.

Estados de aplicación: `TRIALING`, `UNBILLED`, `PENDING`, `AUTHORIZED`, `PAST_DUE`, `CANCELED` y `SUSPENDED`. La falta de fila de suscripción significa `LEGACY`, no una suscripción vencida.

1. El onboarding crea la fila `TRIALING`/`UNBILLED` en el mismo batch D1 que crea el negocio y su propietario.
2. Tras el fin del trial, el propietario autoriza el cobro mensual desde el panel e ingresa el correo asociado a su cuenta de Mercado Pago. Mercado Pago.js tokeniza los datos mediante campos seguros; el servidor recibe solo `card_token_id` y el correo del pagador y crea la preapproval autorizada con el plan y referencia interna del negocio.
3. El webhook valida `x-signature`, consulta la preapproval/pago a Mercado Pago y actualiza el estado. El retorno del navegador nunca acredita un pago.
4. Los webhooks repetidos se reconcilian por `providerSubscriptionId` y `providerPaymentId` únicos.
5. Cancelar actualiza la preapproval en Mercado Pago; el acceso puede continuar hasta `currentPeriodEnd`.

## Configuración de Mercado Pago

Usar una aplicación Mercado Pago con credenciales de prueba y cuentas Comprador/Vendedor de prueba del mismo país en un Worker de staging con D1/R2 separados. Para el comprador de prueba, el email de pagador documentado es `test_payer_<USER_ID>@testuser.com`, usando el `User ID` numérico de la cuenta Comprador en el panel; por ejemplo, `test_payer_123456789@testuser.com`. El Worker de producción tiene Worker Routes activos y `workers.dev` deshabilitado; no colocar credenciales de prueba en él.

1. Ejecuta el script desde una terminal interactiva; pide el `MERCADOPAGO_ACCESS_TOKEN` sandbox sin mostrarlo y crea/actualiza los tres planes mensuales:

   ```bash
    MERCADOPAGO_TEST_TOKEN_PREFIX=APP_USR- npm run mercadopago:create-plans
   ```

   El script imprime los IDs de los planes. No imprime ni escribe el access token. La URL de retorno predeterminada apunta al login de staging; si se personaliza con `MERCADOPAGO_BACK_URL`, debe seguir apuntando a staging.

2. En el panel de desarrolladores de Mercado Pago, configura el webhook para:

   ```text
   https://agenda-link-staging.metincacontacto.workers.dev/api/webhooks/mercadopago
   ```

   Habilita las notificaciones de preapproval/suscripción y pagos autorizados de suscripción. Guarda el secreto de firma generado por Mercado Pago.

3. Configura en el Worker de staging, mediante Wrangler Secrets:

   ```bash
   npx wrangler secret put MERCADOPAGO_ACCESS_TOKEN --env staging
   npx wrangler secret put MERCADOPAGO_PUBLIC_KEY --env staging
   npx wrangler secret put MERCADOPAGO_WEBHOOK_SECRET --env staging
   npx wrangler secret put MERCADOPAGO_PLAN_ID_INDIVIDUAL --env staging
   npx wrangler secret put MERCADOPAGO_PLAN_ID_EQUIPO --env staging
   npx wrangler secret put MERCADOPAGO_PLAN_ID_NEGOCIO --env staging
   ```

   Para verificar qué nombres de secretos ya están configurados, usa `npx wrangler secret list --env staging`. No agregues `--name` al usar `--env`: Wrangler resuelve el nombre a partir del entorno. `env.staging.vars` fuerza `MERCADOPAGO_MODE=test` y configura `MERCADOPAGO_TEST_TOKEN_PREFIX=APP_USR-` para la credencial de prueba confirmada. El script requiere ese prefijo explícitamente al crear planes. Producción no hereda esta configuración de staging y utiliza su propio juego de credenciales, IDs de planes y secreto de webhook.

## Verificación y publicación

Para configurar producción de forma interactiva, sin escribir credenciales en archivos, ejecuta:

```bash
npm run mercadopago:configure-production
```

El script exige confirmación explícita, usa un Access Token productivo, crea o actualiza los tres planes, carga los seis secretos en el Worker `agenda-link` y muestra únicamente los IDs de planes. Para actualizar un plan existente, introduce su ID cuando el script lo solicite; deja el campo vacío solo cuando quieras crear uno nuevo.

Si Mercado Pago no permite habilitar ambos productos dentro de una misma aplicación, usa dos aplicaciones productivas: una para suscripciones y otra para Checkout Pro. No se crea un plan de Mercado Pago para cada servicio: AgendaLink genera una preferencia dinámica por reserva usando las credenciales de Checkout Pro y el evento `payment`.

El script pregunta qué quieres configurar: `1` Checkout Pro, `2` Suscripciones o `3` Ambas. Si eliges `3`, pregunta si Checkout Pro usa la misma aplicación; si respondes `n`, solicita las credenciales separadas y las carga con estos nombres:

- `MERCADOPAGO_SUBSCRIPTIONS_ACCESS_TOKEN`
- `MERCADOPAGO_SUBSCRIPTIONS_PUBLIC_KEY`
- `MERCADOPAGO_SUBSCRIPTIONS_WEBHOOK_SECRET`
- `MERCADOPAGO_CHECKOUT_ACCESS_TOKEN`
- `MERCADOPAGO_CHECKOUT_PUBLIC_KEY`
- `MERCADOPAGO_CHECKOUT_WEBHOOK_SECRET`

El script no escribe secretos en el repositorio ni los pasa como argumentos. Para ejecutarlo, usa una terminal interactiva desde la raíz del proyecto:

```bash
npm run mercadopago:configure-production
```

Escribe `CONFIGURAR PRODUCCIÓN` cuando lo solicite. El token productivo debe comenzar con `APP_USR-`; el script carga los secretos en el Worker principal, no en staging.

- En la aplicación productiva de Mercado Pago, configura las notificaciones hacia `https://agendalink.cl/api/webhooks/mercadopago`.
- No uses credenciales ni IDs de sandbox en producción.
- Crear o actualizar planes no realiza cobros; el cobro requiere autorización posterior desde el checkout.

- Probar el trial de siete días con el reloj/fixtures de tests; no acortar ni alterar el trial de cuentas reales.
- En staging, completar una autorización, recibir el webhook firmado, verificar el pago consultando la API, y probar eventos repetidos, firma inválida, cancelación y pago rechazado.
- El formulario usa campos seguros de Mercado Pago.js; el backend recibe solamente `card_token_id`, nunca número/CVV de tarjeta.
- Para sandbox, crear/usar un usuario Comprador de prueba chileno desde la sección **Cuentas de prueba** de la aplicación; formar el email `test_payer_<USER_ID>@testuser.com` con el ID que muestra el panel e ingresarlo en el formulario. El correo de AgendaLink puede ser distinto.
- Confirmar que la cuenta `LEGACY` y México `UNBILLED` no reciben cobros ni se bloquean.
- Confirmar que se pausan nuevas reservas tras expirar la gracia, mientras el panel de facturación sigue accesible.
- Antes de producción, crear/configurar los planes y webhook de la cuenta Mercado Pago de producción, cargar sus secretos por separado, respaldar D1 y aplicar la migración incremental mediante Wrangler. No usar `prisma db push` contra D1.
- El checkout permanece no disponible si falta cualquiera de las credenciales o IDs de plan; nunca se simulan aprobaciones.
