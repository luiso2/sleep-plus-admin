const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jsonServer = require('json-server');
const path = require('path');
const stripe = require('stripe');
const fs = require('fs').promises;
const config = require('./config');

const app = express();
const PORT = config.port;

// Middleware básico
app.use(cors(config.cors));
// Aumentar límite para manejar imágenes en base64 (aunque ya no las enviamos)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware mejorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.path.startsWith('/api/shopify')) {
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    server: 'express-shopify-proxy',
    timestamp: new Date().toISOString()
  });
});

// ======================
// SHOPIFY PROXY ENDPOINTS
// ======================

// Test connection
app.post('/api/shopify/test-connection', async (req, res) => {
  console.log('🔌 Testing Shopify connection...');
  
  try {
    const { shopifyDomain, accessToken } = req.body;
    
    if (!shopifyDomain || !accessToken) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'Dominio y Access Token son requeridos' 
      });
    }

    console.log(`📡 Connecting to: ${shopifyDomain}`);
    console.log(`🔑 Token: ${accessToken.substring(0, 10)}...`);
    
    // Construir URL completa
    const shopUrl = `https://${shopifyDomain}/admin/api/2024-01/shop.json`;
    console.log(`📍 URL: ${shopUrl}`);
    
    // Hacer petición a Shopify
    const response = await axios.get(shopUrl, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 segundos timeout
    });

    console.log('✅ Connection successful!');
    console.log('Shop data:', JSON.stringify(response.data.shop, null, 2));
    
    res.json({
      success: true,
      message: `Conectado exitosamente a ${response.data.shop.name}`,
      shop: response.data.shop,
    });
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
      
      if (error.response.status === 401) {
        res.status(401).json({
          success: false,
          message: 'Credenciales inválidas. Verifique su Access Token',
          error: error.response.data
        });
      } else if (error.response.status === 404) {
        res.status(404).json({
          success: false,
          message: 'Tienda no encontrada. Verifique el dominio',
          error: error.response.data
        });
      } else {
        res.status(error.response.status).json({
          success: false,
          message: error.response.data?.errors || error.message || 'Error al conectar con Shopify',
          error: error.response.data
        });
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      res.status(500).json({
        success: false,
        message: 'No se pudo conectar con Shopify. Verifique su conexión a Internet.',
        error: error.message
      });
    } else {
      console.error('Error setting up request:', error.message);
      res.status(500).json({
        success: false,
        message: 'Error al configurar la petición',
        error: error.message
      });
    }
  }
});

// Get products
app.post('/api/shopify/products', async (req, res) => {
  console.log('📦 Fetching Shopify products...');
  
  try {
    const { shopifyDomain, accessToken } = req.body;
    
    if (!shopifyDomain || !accessToken) {
      return res.status(400).json({ 
        error: 'Dominio y Access Token son requeridos' 
      });
    }
    
    const url = `https://${shopifyDomain}/admin/api/2024-01/products.json?limit=250`;
    console.log(`📍 URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`✅ Fetched ${response.data.products.length} products`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.errors || error.message || 'Error al obtener productos',
    });
  }
});

// Get customers
app.post('/api/shopify/customers', async (req, res) => {
  console.log('👥 Fetching Shopify customers...');
  
  try {
    const { shopifyDomain, accessToken } = req.body;
    
    if (!shopifyDomain || !accessToken) {
      return res.status(400).json({ 
        error: 'Dominio y Access Token son requeridos' 
      });
    }
    
    const url = `https://${shopifyDomain}/admin/api/2024-01/customers.json?limit=250`;
    console.log(`📍 URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`✅ Fetched ${response.data.customers.length} customers`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error fetching customers:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.errors || error.message || 'Error al obtener clientes',
    });
  }
});

// Get price rules
app.post('/api/shopify/price-rules', async (req, res) => {
  console.log('💰 Fetching Shopify price rules...');
  
  try {
    const { shopifyDomain, accessToken } = req.body;
    
    if (!shopifyDomain || !accessToken) {
      return res.status(400).json({ 
        error: 'Dominio y Access Token son requeridos' 
      });
    }
    
    const url = `https://${shopifyDomain}/admin/api/2024-01/price_rules.json?limit=250`;
    console.log(`📍 URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`✅ Fetched ${response.data.price_rules.length} price rules`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error fetching price rules:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.errors || error.message || 'Error al obtener reglas de precio',
    });
  }
});

// Get discount codes for a price rule
app.post('/api/shopify/discount-codes/:priceRuleId', async (req, res) => {
  console.log('🎟️ Fetching discount codes...');
  
  try {
    const { shopifyDomain, accessToken } = req.body;
    const { priceRuleId } = req.params;
    
    if (!shopifyDomain || !accessToken) {
      return res.status(400).json({ 
        error: 'Dominio y Access Token son requeridos' 
      });
    }
    
    const url = `https://${shopifyDomain}/admin/api/2024-01/price_rules/${priceRuleId}/discount_codes.json`;
    console.log(`📍 URL: ${url}`);
    
    const response = await axios.get(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    console.log(`✅ Fetched discount codes for rule ${priceRuleId}`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error fetching discount codes:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.errors || error.message || 'Error al obtener códigos de descuento',
    });
  }
});

// Create a new price rule
app.post('/api/shopify/price-rules/create', async (req, res) => {
  console.log('💰 Creating new price rule...');
  
  try {
    const { shopifyDomain, accessToken, priceRule } = req.body;
    
    if (!shopifyDomain || !accessToken || !priceRule) {
      return res.status(400).json({ 
        error: 'Dominio, Access Token y datos de la regla son requeridos' 
      });
    }
    
    const url = `https://${shopifyDomain}/admin/api/2024-01/price_rules.json`;
    console.log(`📍 URL: ${url}`);
    console.log('📝 Price Rule Data:', JSON.stringify(priceRule, null, 2));
    
    const response = await axios.post(url, 
      { price_rule: priceRule },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`✅ Created price rule: ${response.data.price_rule.id}`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error creating price rule:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.errors || error.message || 'Error al crear regla de precio',
      details: error.response?.data
    });
  }
});

// Create discount code for a price rule
app.post('/api/shopify/price-rules/:priceRuleId/discount-codes', async (req, res) => {
  console.log('🎟️ Creating discount code...');
  
  try {
    const { shopifyDomain, accessToken, discountCode } = req.body;
    const { priceRuleId } = req.params;
    
    if (!shopifyDomain || !accessToken || !discountCode) {
      return res.status(400).json({ 
        error: 'Dominio, Access Token y código de descuento son requeridos' 
      });
    }
    
    const url = `https://${shopifyDomain}/admin/api/2024-01/price_rules/${priceRuleId}/discount_codes.json`;
    console.log(`📍 URL: ${url}`);
    console.log('📝 Discount Code:', discountCode);
    
    const response = await axios.post(url,
      { discount_code: { code: discountCode } },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log(`✅ Created discount code: ${discountCode}`);
    res.json(response.data);
  } catch (error) {
    console.error('❌ Error creating discount code:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.errors || error.message || 'Error al crear código de descuento',
      details: error.response?.data
    });
  }
});

// ======================
// WEBHOOK ENDPOINTS
// ======================

// Trade-in evaluation webhook
app.post('/api/webhooks/trade-evaluation', async (req, res) => {
  console.log('🛏️ Processing trade-in evaluation...');
  
  try {
    const {
      customer,
      mattress,
      credit,
      photos
    } = req.body;
    
    // Validar datos requeridos
    if (!customer || !customer.email || !credit) {
      return res.status(400).json({
        success: false,
        error: 'Datos del cliente y crédito son requeridos'
      });
    }
    
    console.log('👤 Cliente:', customer.email);
    console.log('💰 Crédito aprobado: $' + credit);
    
    // Generar código único para el cupón
    const couponCode = `TRADE${Date.now().toString().slice(-8)}`;
    const couponTitle = `Trade-In Credit - ${customer.firstName} ${customer.lastName}`;
    
    // Obtener configuración de Shopify
    const shopifySettings = await axios.get(`${req.protocol}://${req.get('host')}/shopifySettings/shop-001`);
    const { shopifyDomain, accessToken } = shopifySettings.data;
    
    if (!shopifyDomain || !accessToken) {
      throw new Error('Configuración de Shopify no disponible');
    }
    
    // Crear regla de precio en Shopify
    const priceRule = {
      title: couponTitle,
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'fixed_amount',
      value: `-${credit}`,
      customer_selection: 'all',
      once_per_customer: true,
      usage_limit: 1,
      starts_at: new Date().toISOString(),
      ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 días
    };
    
    // 1. Crear la regla de precio
    console.log('📝 Creando regla de precio en Shopify...');
    const priceRuleResponse = await axios.post(
      `https://${shopifyDomain}/admin/api/2024-01/price_rules.json`,
      { price_rule: priceRule },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    const createdPriceRule = priceRuleResponse.data.price_rule;
    console.log('✅ Regla creada:', createdPriceRule.id);
    
    // 2. Crear el código de descuento
    console.log('🎟️ Creando código de descuento...');
    const discountCodeResponse = await axios.post(
      `https://${shopifyDomain}/admin/api/2024-01/price_rules/${createdPriceRule.id}/discount_codes.json`,
      { discount_code: { code: couponCode } },
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    
    const createdDiscountCode = discountCodeResponse.data.discount_code;
    console.log('✅ Código creado:', createdDiscountCode.code);
    
    // 3. Guardar en la base de datos local
    const evaluationData = {
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: customer.email,
      mattress: mattress,
      photos: photos || [],
      creditApproved: credit,
      status: 'approved',
      couponCode: couponCode,
      shopifyPriceRuleId: createdPriceRule.id.toString(),
      shopifyDiscountCodeId: createdDiscountCode.id.toString(),
      customer: customer,
      createdAt: new Date().toISOString(),
      expiresAt: priceRule.ends_at
    };
    
    // Guardar evaluación
    await axios.post(
      `${req.protocol}://${req.get('host')}/evaluations`,
      evaluationData
    );
    
    // 4. Registrar actividad
    await axios.post(
      `${req.protocol}://${req.get('host')}/activityLogs`,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: 'system',
        customerId: customer.email,
        resourceType: 'evaluation',
        resourceId: evaluationData.id,
        action: 'trade_in_approved',
        description: `Trade-in aprobado por $${credit}. Cupón: ${couponCode}`,
        metadata: {
          credit: credit,
          couponCode: couponCode,
          mattress: mattress
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
      }
    );
    
    // 5. Enviar email al cliente (simulado)
    console.log('📧 Email enviado a:', customer.email);
    
    // Responder con éxito
    res.json({
      success: true,
      data: {
        evaluationId: evaluationData.id,
        couponCode: couponCode,
        credit: credit,
        expiresAt: priceRule.ends_at,
        message: 'Tu cupón ha sido creado exitosamente'
      }
    });
    
  } catch (error) {
    console.error('❌ Error procesando trade-in:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar la evaluación'
    });
  }
});

// Generic webhook receiver
app.post('/api/webhooks/shopify/:event', async (req, res) => {
  const { event } = req.params;
  const webhookId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📨 Webhook received: ${event}`);
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  
  try {
    // Store webhook in database
    const webhook = {
      id: webhookId,
      source: 'shopify',
      event: event,
      status: 'pending',
      receivedAt: new Date().toISOString(),
      processedAt: null,
      attempts: 0,
      headers: {
        'x-shopify-topic': req.headers['x-shopify-topic'] || event,
        'x-shopify-shop-domain': req.headers['x-shopify-shop-domain'] || '',
        'x-shopify-webhook-id': req.headers['x-shopify-webhook-id'] || '',
        'x-shopify-hmac-sha256': req.headers['x-shopify-hmac-sha256'] || ''
      },
      payload: req.body,
      response: null,
      error: null
    };
    
    // In a real implementation, you would:
    // 1. Verify the webhook signature
    // 2. Store it in the database
    // 3. Process it asynchronously
    // 4. Update the webhook status
    
    // For now, we'll just acknowledge receipt
    res.status(200).json({
      success: true,
      message: `Webhook ${event} received`,
      webhookId: webhookId
    });
    
    console.log(`✅ Webhook ${webhookId} acknowledged`);
    
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({
      success: false,
      error: 'Error processing webhook'
    });
  }
});

// List webhook events configuration
app.get('/api/webhook-events', async (req, res) => {
  const events = [
    {
      id: 'whe-001',
      source: 'shopify',
      event: 'orders/create',
      enabled: true,
      endpoint: '/api/webhooks/shopify/orders/create',
      description: 'Se activa cuando se crea una nueva orden en Shopify'
    },
    {
      id: 'whe-002',
      source: 'shopify',
      event: 'orders/updated',
      enabled: true,
      endpoint: '/api/webhooks/shopify/orders/updated',
      description: 'Se activa cuando se actualiza una orden existente'
    },
    {
      id: 'whe-003',
      source: 'shopify',
      event: 'customers/create',
      enabled: true,
      endpoint: '/api/webhooks/shopify/customers/create',
      description: 'Se activa cuando se crea un nuevo cliente'
    },
    {
      id: 'whe-004',
      source: 'shopify',
      event: 'customers/updated',
      enabled: true,
      endpoint: '/api/webhooks/shopify/customers/updated',
      description: 'Se activa cuando se actualiza un cliente'
    },
    {
      id: 'whe-005',
      source: 'shopify',
      event: 'discounts/create',
      enabled: true,
      endpoint: '/api/webhooks/shopify/discounts/create',
      description: 'Se activa cuando se crea un nuevo descuento'
    }
  ];
  
  res.json(events);
});

// ======================
// STRIPE ENDPOINTS
// ======================

let stripeClient = null;

// Helper para leer la base de datos
async function readDatabase() {
  try {
    const dbPath = path.join(__dirname, '..', 'db.json');
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error leyendo database:', error);
    throw error;
  }
}

// Helper para escribir la base de datos
async function writeDatabase(data) {
  try {
    const dbPath = path.join(__dirname, '..', 'db.json');
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error escribiendo database:', error);
    throw error;
  }
}

// Configurar Stripe
app.post('/api/stripe/config', async (req, res) => {
  console.log('🔧 Configurando Stripe...');
  
  try {
    const { publicKey, secretKey, webhookSecret, testMode } = req.body;
    
    if (!publicKey || !secretKey) {
      return res.status(400).json({
        success: false,
        message: 'Public Key y Secret Key son requeridos'
      });
    }

    // Inicializar cliente de Stripe
    stripeClient = stripe(secretKey);
    
    // Probar conexión
    await stripeClient.customers.list({ limit: 1 });
    
    // Guardar configuración en base de datos
    const db = await readDatabase();
    if (!db.stripeConfig) {
      db.stripeConfig = [];
    }
    
    const config = {
      id: 'stripe-config-001',
      publicKey,
      secretKey,
      webhookSecret: webhookSecret || '',
      currency: 'USD',
      testMode: testMode || true,
      enabledFeatures: {
        paymentLinks: true,
        subscriptions: true,
        oneTimePayments: true,
        webhooks: true
      },
      updatedAt: new Date().toISOString()
    };
    
    // Actualizar o crear configuración
    const existingIndex = db.stripeConfig.findIndex(c => c.id === config.id);
    if (existingIndex >= 0) {
      db.stripeConfig[existingIndex] = { ...db.stripeConfig[existingIndex], ...config };
    } else {
      config.createdAt = new Date().toISOString();
      db.stripeConfig.push(config);
    }
    
    await writeDatabase(db);
    
    console.log('✅ Stripe configurado exitosamente');
    res.json({
      success: true,
      message: 'Stripe configurado exitosamente',
      testMode: config.testMode
    });
    
  } catch (error) {
    console.error('❌ Error configurando Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando Stripe',
      error: error.message
    });
  }
});

// Obtener configuración de Stripe
app.get('/api/stripe/config', async (req, res) => {
  try {
    const db = await readDatabase();
    const config = db.stripeConfig?.[0];
    
    if (!config) {
      return res.json({
        success: false,
        message: 'Stripe no configurado',
        configured: false
      });
    }
    
    // No enviar el secretKey al frontend
    const safeConfig = {
      ...config,
      secretKey: config.secretKey ? '***' : '',
      webhookSecret: config.webhookSecret ? '***' : ''
    };
    
    res.json({
      success: true,
      configured: true,
      config: safeConfig
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo configuración'
    });
  }
});

// Crear Payment Link
app.post('/api/stripe/payment-links', async (req, res) => {
  console.log('💳 Creando Payment Link...');
  
  try {
    if (!stripeClient) {
      return res.status(400).json({
        success: false,
        message: 'Stripe no configurado'
      });
    }
    
    const { customerId, productName, description, amount, currency = 'USD', metadata = {} } = req.body;
    
    // Crear producto en Stripe
    const product = await stripeClient.products.create({
      name: productName,
      description: description,
      metadata: metadata
    });
    
    // Crear precio en Stripe
    const price = await stripeClient.prices.create({
      product: product.id,
      unit_amount: Math.round(amount * 100), // Convertir a centavos
      currency: currency.toLowerCase(),
      metadata: metadata
    });
    
    // Crear payment link en Stripe
    const paymentLink = await stripeClient.paymentLinks.create({
      line_items: [{
        price: price.id,
        quantity: 1
      }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_creation: 'if_required',
      metadata: {
        ...metadata,
        customerId: customerId
      }
    });
    
    // Guardar en base de datos
    const db = await readDatabase();
    if (!db.paymentLinks) {
      db.paymentLinks = [];
    }
    
    const paymentLinkRecord = {
      id: `pl-${Date.now()}`,
      stripePaymentLinkId: paymentLink.id,
      customerId: customerId,
      productName: productName,
      description: description,
      amount: amount,
      currency: currency,
      status: 'active',
      type: 'one_time',
      url: paymentLink.url,
      metadata: metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db.paymentLinks.push(paymentLinkRecord);
    await writeDatabase(db);
    
    console.log('✅ Payment Link creado:', paymentLink.url);
    res.json({
      success: true,
      message: 'Payment Link creado exitosamente',
      paymentLink: paymentLinkRecord,
      url: paymentLink.url
    });
    
  } catch (error) {
    console.error('❌ Error creando Payment Link:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando Payment Link',
      error: error.message
    });
  }
});

// Listar Payment Links
app.get('/api/stripe/payment-links', async (req, res) => {
  try {
    const db = await readDatabase();
    const paymentLinks = db.paymentLinks || [];
    
    res.json({
      success: true,
      paymentLinks: paymentLinks
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo Payment Links:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo Payment Links'
    });
  }
});

// Webhook de Stripe
app.post('/api/stripe/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log('📡 Webhook de Stripe recibido...');
  
  try {
    const payload = req.body;
    const signature = req.headers['stripe-signature'];
    
    // En un entorno real, verificar la firma del webhook aquí
    // const event = stripeClient.webhooks.constructEvent(payload, signature, webhookSecret);
    
    // Por ahora, simular el evento
    const event = JSON.parse(payload.toString());
    
    console.log(`📋 Evento: ${event.type}`);
    
    // Guardar webhook en base de datos
    const db = await readDatabase();
    if (!db.stripeWebhooks) {
      db.stripeWebhooks = [];
    }
    
    const webhookRecord = {
      id: `wh-${Date.now()}`,
      eventType: event.type,
      stripeEventId: event.id || `evt-${Date.now()}`,
      processed: true,
      processedAt: new Date().toISOString(),
      data: event.data || {},
      createdAt: new Date().toISOString()
    };
    
    db.stripeWebhooks.push(webhookRecord);
    await writeDatabase(db);
    
    // Procesar evento según tipo
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Pago exitoso');
        break;
      case 'customer.subscription.created':
        console.log('🔄 Suscripción creada');
        break;
      case 'customer.subscription.updated':
        console.log('🔄 Suscripción actualizada');
        break;
      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }
    
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    res.status(400).json({
      success: false,
      message: 'Error procesando webhook'
    });
  }
});

// Estadísticas de Stripe
app.get('/api/stripe/stats', async (req, res) => {
  try {
    const db = await readDatabase();
    
    const paymentLinks = db.paymentLinks || [];
    const subscriptions = db.stripeSubscriptions || [];
    const webhooks = db.stripeWebhooks || [];
    
    const stats = {
      paymentLinks: {
        total: paymentLinks.length,
        active: paymentLinks.filter(pl => pl.status === 'active').length,
        completed: paymentLinks.filter(pl => pl.status === 'completed').length
      },
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.filter(s => s.status === 'active').length,
        canceled: subscriptions.filter(s => s.status === 'canceled').length
      },
      webhooks: {
        total: webhooks.length,
        processed: webhooks.filter(w => w.processed).length,
        today: webhooks.filter(w => 
          new Date(w.createdAt).toDateString() === new Date().toDateString()
        ).length
      }
    };
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// ======================
// SUBSCRIPTIONS ENDPOINTS
// ======================

// Pausar suscripción
app.post('/api/subscriptions/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const db = await readDatabase();
    
    // Encontrar la suscripción
    const subscriptionIndex = db.subscriptions.findIndex(s => s.id === id);
    if (subscriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }
    
    const subscription = db.subscriptions[subscriptionIndex];
    
    // Pausar en Stripe si es necesario
    if (subscription.billing?.stripeSubscriptionId) {
      const stripeSubscription = db.stripeSubscriptions.find(ss => 
        ss.stripeSubscriptionId === subscription.billing.stripeSubscriptionId
      );
      if (stripeSubscription) {
        stripeSubscription.status = 'paused';
        stripeSubscription.pausedAt = new Date().toISOString();
        stripeSubscription.updatedAt = new Date().toISOString();
      }
    }
    
    // Actualizar suscripción local
    subscription.status = 'paused';
    subscription.pausedAt = new Date().toISOString();
    if (reason) subscription.pauseReason = reason;
    subscription.updatedAt = new Date().toISOString();
    
    await writeDatabase(db);
    
    res.json({
      success: true,
      message: 'Suscripción pausada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error pausando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error pausando suscripción'
    });
  }
});

// Reanudar suscripción
app.post('/api/subscriptions/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await readDatabase();
    
    // Encontrar la suscripción
    const subscriptionIndex = db.subscriptions.findIndex(s => s.id === id);
    if (subscriptionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }
    
    const subscription = db.subscriptions[subscriptionIndex];
    
    // Reanudar en Stripe si es necesario
    if (subscription.billing?.stripeSubscriptionId) {
      const stripeSubscription = db.stripeSubscriptions.find(ss => 
        ss.stripeSubscriptionId === subscription.billing.stripeSubscriptionId
      );
      if (stripeSubscription) {
        stripeSubscription.status = 'active';
        stripeSubscription.pausedAt = null;
        stripeSubscription.updatedAt = new Date().toISOString();
      }
    }
    
    // Actualizar suscripción local
    subscription.status = 'active';
    subscription.pausedAt = null;
    subscription.pauseReason = null;
    subscription.updatedAt = new Date().toISOString();
    
    await writeDatabase(db);
    
    res.json({
      success: true,
      message: 'Suscripción reactivada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error reactivando suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error reactivando suscripción'
    });
  }
});

// Sincronizar suscripciones con Stripe
app.post('/api/subscriptions/sync-stripe', async (req, res) => {
  try {
    const db = await readDatabase();
    let syncedCount = 0;
    let updatedSubscriptions = [];
    
    console.log('🔄 Iniciando sincronización con Stripe...');
    
    // Verificar si Stripe está configurado
    if (!stripeClient) {
      const stripeConfig = db.stripeConfig?.[0];
      if (stripeConfig?.secretKey) {
        stripeClient = stripe(stripeConfig.secretKey);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Stripe no está configurado',
          synced: 0
        });
      }
    }
    
    // Sincronizar cada suscripción que tenga Stripe ID
    for (const subscription of db.subscriptions) {
      if (subscription.billing?.stripeSubscriptionId) {
        try {
          // Obtener datos actualizados de Stripe
          const stripeSubscription = await stripeClient.subscriptions.retrieve(
            subscription.billing.stripeSubscriptionId
          );
          
          // Mapear estado de Stripe a estado local
          let localStatus = subscription.status;
          switch (stripeSubscription.status) {
            case 'active':
              localStatus = 'active';
              break;
            case 'paused':
              localStatus = 'paused';
              break;
            case 'canceled':
              localStatus = 'cancelled';
              break;
            case 'past_due':
              localStatus = 'paused';
              break;
            default:
              localStatus = subscription.status;
          }
          
          // Actualizar si hay cambios
          if (subscription.status !== localStatus) {
            subscription.status = localStatus;
            subscription.updatedAt = new Date().toISOString();
            syncedCount++;
            updatedSubscriptions.push({
              id: subscription.id,
              customerId: subscription.customerId,
              oldStatus: subscription.status,
              newStatus: localStatus
            });
            console.log(`✅ Actualizada suscripción ${subscription.id}: ${subscription.status} → ${localStatus}`);
          }
          
          // Actualizar fecha de próximo cobro si está disponible
          if (stripeSubscription.current_period_end) {
            const nextBillingDate = new Date(stripeSubscription.current_period_end * 1000).toISOString();
            if (subscription.billing.nextBillingDate !== nextBillingDate) {
              subscription.billing.nextBillingDate = nextBillingDate;
              subscription.updatedAt = new Date().toISOString();
              if (!updatedSubscriptions.find(s => s.id === subscription.id)) {
                syncedCount++;
              }
            }
          }
          
        } catch (stripeError) {
          console.error(`❌ Error sincronizando suscripción ${subscription.id}:`, stripeError.message);
          // Continuar con las demás suscripciones
        }
      }
    }
    
    // Guardar cambios en la base de datos
    await writeDatabase(db);
    
    console.log(`✅ Sincronización completada: ${syncedCount} suscripciones actualizadas`);
    
    res.json({
      success: true,
      message: `Sincronización completada: ${syncedCount} suscripciones actualizadas`,
      synced: syncedCount,
      details: updatedSubscriptions
    });
    
  } catch (error) {
    console.error('❌ Error sincronizando con Stripe:', error);
    res.status(500).json({
      success: false,
      message: 'Error sincronizando con Stripe: ' + error.message,
      synced: 0
    });
  }
});

// Estadísticas de suscripciones
app.get('/api/subscriptions/stats', async (req, res) => {
  try {
    const db = await readDatabase();
    const subscriptions = db.subscriptions || [];
    
    const stats = {
      total: subscriptions.length,
      active: subscriptions.filter(s => s.status === 'active').length,
      paused: subscriptions.filter(s => s.status === 'paused').length,
      cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
      withStripe: subscriptions.filter(s => 
        s.billing?.paymentMethod === 'stripe' &&
        s.billing?.stripeSubscriptionId
      ).length,
      revenue: {
        monthly: subscriptions
          .filter(s => s.status === 'active' && s.billing?.frequency === 'monthly')
          .reduce((sum, s) => sum + (s.pricing?.monthly || 0), 0),
        annual: subscriptions
          .filter(s => s.status === 'active' && s.billing?.frequency === 'annual')
          .reduce((sum, s) => sum + (s.pricing?.annual || 0), 0)
      }
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// ======================
// JSON SERVER SETUP
// ======================

console.log('📂 Setting up JSON Server...');

// JSON Server - debe ir AL FINAL
const dbPath = path.join(__dirname, '..', 'db.json');
console.log('📄 Database path:', dbPath);

const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults({
  logger: true,
  readOnly: false,
  noCors: false
});

// Aplicar middlewares de json-server
app.use(middlewares);

// Usar el router de json-server para todas las demás rutas
app.use(router);

// ======================
// ERROR HANDLING
// ======================

// 404 handler
app.use((req, res) => {
  console.log(`⚠️ 404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`,
    availableEndpoints: {
      shopify: [
        'POST /api/shopify/test-connection',
        'POST /api/shopify/products',
        'POST /api/shopify/customers',
        'POST /api/shopify/price-rules',
        'POST /api/shopify/price-rules/create',
        'POST /api/shopify/discount-codes/:id',
        'POST /api/shopify/price-rules/:id/discount-codes'
      ],
      webhooks: [
        'POST /api/webhooks/trade-evaluation',
        'POST /api/webhooks/shopify/:event',
        'GET /api/webhook-events'
      ],
      health: 'GET /health'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// ======================
// START SERVER
// ======================

const HOST = config.host;

app.listen(PORT, HOST, () => {
  // Usar la URL pública si está disponible, sino usar host:port local
  const PUBLIC_URL = process.env.API_URL || process.env.VITE_API_URL || `http://${HOST}:${PORT}`;
  
  console.log('');
  console.log('🚀 Server is running!');
  console.log('====================');
  console.log(`📡 Host: ${HOST}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: ${PUBLIC_URL}`);
  console.log('');
  console.log('📋 Available endpoints:');
  console.log('  Health Check:');
  console.log(`    GET  ${PUBLIC_URL}/health`);
  console.log('');
  console.log('  Shopify Proxy:');
  console.log(`    POST ${PUBLIC_URL}/api/shopify/test-connection`);
  console.log(`    POST ${PUBLIC_URL}/api/shopify/products`);
  console.log(`    POST ${PUBLIC_URL}/api/shopify/customers`);
  console.log(`    POST ${PUBLIC_URL}/api/shopify/price-rules`);
  console.log(`    POST ${PUBLIC_URL}/api/shopify/price-rules/create`);
  console.log(`    POST ${PUBLIC_URL}/api/shopify/discount-codes/:id`);
  console.log(`    POST ${PUBLIC_URL}/api/shopify/price-rules/:id/discount-codes`);
  console.log('');
  console.log('  Webhooks:');
  console.log(`    POST ${PUBLIC_URL}/api/webhooks/trade-evaluation`);
  console.log(`    POST ${PUBLIC_URL}/api/webhooks/shopify/:event`);
  console.log(`    GET  ${PUBLIC_URL}/api/webhook-events`);
  console.log('');
  console.log('  JSON Server:');
  console.log(`    GET  ${PUBLIC_URL}/[resource]`);
  console.log(`    POST ${PUBLIC_URL}/[resource]`);
  console.log(`    PUT  ${PUBLIC_URL}/[resource]/:id`);
  console.log(`    DELETE ${PUBLIC_URL}/[resource]/:id`);
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('====================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

// Debug para axios
axios.interceptors.request.use(request => {
  console.log('🔵 Starting Request:', request.method?.toUpperCase(), request.url);
  console.log('Headers:', request.headers);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('🟢 Response:', response.status);
    return response;
  },
  error => {
    console.log('🔴 Error Response:', error.response?.status);
    return Promise.reject(error);
  }
);
