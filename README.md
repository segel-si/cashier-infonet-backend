# API de Comercios Bancard - RedPagos

Esta API implementa el servicio de pagos de servicios para comercios según las especificaciones técnicas de Bancard/Infonet Cobranzas v1.9.

## Inicio Rápido

### Instalación

```bash
npm install
```

### Ejecutar en desarrollo

```bash
npm run start:dev
```

### Ejecutar en producción

```bash
npm run build
npm run start:prod
```

## Autenticación

La API utiliza Basic Authentication según las especificaciones:

```
Authorization: Basic <base64(apps/publicKey:privateKey)>
```

**Ejemplo de credenciales de prueba:**
- Public Key: `apps/y24gDAN3rjOESvpZ4UrmqF6sjjLqAut9`
- Private Key: `m8F1,NmHoD9xfuOWJr)UKoz,(QQ(TF4DELFtR1fj`

## Endpoints Disponibles

### 1. Listar Marcas y Servicios

```http
GET /0.1/brands
```

Retorna la lista de empresas facturadoras y sus servicios disponibles.

### 2. Obtener Detalles de Servicio

```http
GET /0.1/services/{serviceId}
```

**Query Parameters opcionales:**
- `extra_response_attributes[]`: Para obtener campos adicionales como `component_type`, `component_value`, `is_cashout`, etc.

### 3. Consultar Facturas Pendientes

```http
GET /0.1/invoices?service_id={serviceId}&customer_fields[]={field1}&customer_fields[]={field2}
```

### 4. Calcular Comisiones

```http
GET /0.1/services/{serviceId}/commissions?amount={amount}&customer_fields[]={field}
```

### 5. Realizar Pago

```http
POST /0.1/services/{serviceId}/payment
```

**Body:**
```json
{
  "amount": 15000,
  "transaction_id": "unique-transaction-id",
  "customer_fields": ["0971333444"],
  "customer_temporary_fields": [],
  "bill_fields": [],
  "additional_data_fields": [],
  "mean_of_payment": 0,
  "commission_bill_fields": [],
  "commerce_code": 123,
  "commerce_branch_code": 1
}
```

**Medios de pago:**
- `0`: Efectivo
- `1`: Tarjeta de Crédito
- `2`: Tarjeta de Débito
- `3`: Cheque

### 6. Pago con Tarjeta (Sin confirmar)

```http
POST /0.1/services/{serviceId}/payment/cards
```

### 7. Anular Pago

```http
POST /0.1/services/{serviceId}/reverse
```

### 8. Extracciones (Cashouts)

#### Crear Extracción
```http
POST /0.1/cashouts
```

#### Información de Extracción
```http
POST /0.1/cashouts/info
```

#### Estado de Extracción
```http
POST /0.1/cashouts/status
```

#### Anular Extracción
```http
POST /0.1/cashouts/{serviceId}/reverse
```

### 9. Pagos con QR

#### Generar QR de Pago
```http
POST /0.1/services/{serviceId}/payment-qr
```

#### Deshabilitar QR
```http
PUT /0.1/payment-hooks/{hookAlias}/disable
```

## Flujos de Trabajo

### Flujo de Pago con Consulta de Factura

1. `GET /0.1/brands` - Obtener servicios disponibles
2. `GET /0.1/services/{serviceId}` - Obtener detalles del servicio
3. `GET /0.1/invoices` - Consultar facturas pendientes
4. `GET /0.1/services/{serviceId}/commissions` - Calcular comisión (si aplica)
5. `POST /0.1/services/{serviceId}/payment` - Realizar pago

### Flujo de Pago Directo (Sin consulta)

1. `GET /0.1/brands` - Obtener servicios disponibles
2. `GET /0.1/services/{serviceId}` - Obtener detalles del servicio
3. `GET /0.1/services/{serviceId}/commissions` - Calcular comisión (si aplica)
4. `POST /0.1/services/{serviceId}/payment` - Realizar pago

### Flujo de Extracciones

Dependiendo del `cashout_validation_type`:

**Tipo OTP (0):**
1. `POST /0.1/cashouts/info` - Consultar información
2. `POST /0.1/cashouts` - Crear extracción con OTP
3. `POST /0.1/cashouts/status` - Verificar estado (si es necesario)

**Tipo Token (1):**
1. `POST /0.1/cashouts/info` - Consultar y obtener token
2. `POST /0.1/cashouts/status` - Verificar estado si es pendiente
3. `POST /0.1/cashouts` - Crear extracción con token

**Tipo Direct (2):**
1. `POST /0.1/cashouts` - Crear extracción directa
2. `POST /0.1/cashouts/status` - Verificar estado si hay timeout

##  Ambientes

La API detecta automáticamente el ambiente basado en `NODE_ENV`:

- **Desarrollo**: `https://desa.infonet.com.py/epos-public-proxy/api`
- **Producción**: `https://comercios.bancard.com.py/epos-public-proxy/api`

## Manejo de Errores

La API retorna errores en el formato estándar:

```json
{
  "status": "error",
  "messages": [
    {
      "level": "error",
      "key": "ErrorCode",
      "dsc": "Descripción del error"
    }
  ]
}
```

### Códigos de Error Comunes

- `MissingParametersError`: Falta un parámetro requerido
- `ServiceNotFound`: Servicio no encontrado
- `CommerceNotFound`: Comercio no encontrado
- `DuplicatedTransactionId`: ID de transacción duplicado
- `UnauthorizedPaymentError`: Pago no autorizado
- `RemoteConnectivityError`: Error de conectividad con servicio remoto
- `InternalServerError`: Error interno del servidor

## 🧪 Servicios de Prueba

Para certificación, probar los siguientes servicios de prueba (IDs 801-816):

- **801**: Prueba de comisión (100.000 gs)
- **802-803**: Múltiples facturas
- **804-808**: Identificadores de factura variados
- **809**: Pago directo (50.000 gs)
- **810**: Pagos parciales (5.000-50.000 gs)
- **814-815**: Campos de usuario variados
- **816**: Datos adicionales en ticket

## Variables de Entorno

```bash
NODE_ENV=development # o production
PORT=3000
HOST=0.0.0.0
```

## Tecnologías Utilizadas

- **NestJS**: Framework Node.js
- **Fastify**: Servidor HTTP rápido
- **Axios**: Cliente HTTP para llamadas a API externa
- **Class Validator**: Validación de DTOs
- **TypeScript**: Tipado estático

## Documentación Adicional

Para más detalles, consultar las especificaciones técnicas originales de Bancard API de Comercios v1.9.