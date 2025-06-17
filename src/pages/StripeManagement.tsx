import React, { useState, useEffect } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Tabs, 
  Alert,
  Statistic
} from 'antd';
import { 
  SettingOutlined, 
  LinkOutlined, 
  DollarOutlined,
  CreditCardOutlined 
} from '@ant-design/icons';
import { 
  StripeConfigForm, 
  PaymentLinkGenerator, 
  PaymentLinksList 
} from '../components/stripe';
import stripeService from '../services/stripeService';
import { StripeStats } from '../interfaces/stripe';

const { Title, Paragraph } = Typography;

const StripeManagement: React.FC = () => {
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [stats, setStats] = useState<StripeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStripeStatus();
  }, []);

  const loadStripeStatus = async () => {
    try {
      setLoading(true);
      
      // Verificar configuración
      const configResponse = await stripeService.getConfig();
      setConfigured(configResponse.success && configResponse.configured);
      
      // Cargar estadísticas si está configurado
      if (configResponse.success && configResponse.configured) {
        try {
          const statsResponse = await stripeService.getStats();
          if (statsResponse.success) {
            setStats(statsResponse.stats);
          }
        } catch (error) {
          // Si hay error en stats, usar valores por defecto
          setStats({
            paymentLinks: { total: 0, active: 0, completed: 0 },
            subscriptions: { total: 0, active: 0, canceled: 0 },
            webhooks: { total: 0, processed: 0, pending: 0, today: 0 }
          });
        }
      }
    } catch (error) {
      console.error('Error cargando estado de Stripe:', error);
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  };

  const statsData = stats ? [
    {
      title: 'Payment Links Activos',
      value: stats.paymentLinks.active,
      prefix: <LinkOutlined />,
      suffix: null,
    },
    {
      title: 'Payment Links Total',
      value: stats.paymentLinks.total,
      prefix: <CreditCardOutlined />,
      suffix: null,
    },
    {
      title: 'Webhooks Procesados',
      value: stats.webhooks.processed,
      prefix: <DollarOutlined />,
      suffix: null,
    },
  ] : [
    {
      title: 'Payment Links Activos',
      value: 0,
      prefix: <LinkOutlined />,
      suffix: null,
    },
    {
      title: 'Payment Links Total',
      value: 0,
      prefix: <CreditCardOutlined />,
      suffix: null,
    },
    {
      title: 'Webhooks Procesados',
      value: 0,
      prefix: <DollarOutlined />,
      suffix: null,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Gestión de Stripe</Title>
        <Paragraph>
          Administra los pagos, suscripciones y enlaces de pago de Stripe desde un solo lugar.
        </Paragraph>
      </div>

      {!configured && (
        <Alert
          message="Configuración Requerida"
          description="Para usar las funcionalidades de Stripe, primero debes configurar tus credenciales en la pestaña de Configuración."
          type="warning"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {statsData.map((stat, index) => (
          <Col xs={24} sm={8} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                precision={stat.title.includes('Total') ? 2 : 0}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs 
        defaultActiveKey="payment-links"
        items={[
          {
            key: 'payment-links',
            label: (
              <Space>
                <LinkOutlined />
                Payment Links
              </Space>
            ),
            children: (
              <>
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<LinkOutlined />}
                      onClick={() => setShowPaymentLinkModal(true)}
                      disabled={!configured}
                    >
                      Crear Payment Link
                    </Button>
                  </Space>
                </div>
                
                <PaymentLinksList />

                <PaymentLinkGenerator
                  visible={showPaymentLinkModal}
                  onClose={() => setShowPaymentLinkModal(false)}
                />
              </>
            )
          },
          {
            key: 'configuration',
            label: (
              <Space>
                <SettingOutlined />
                Configuración
              </Space>
            ),
            children: (
              <StripeConfigForm
                onConfigSaved={() => {
                  setConfigured(true);
                  loadStripeStatus();
                }}
              />
            )
          }
        ]}
      />
    </div>
  );
};

export default StripeManagement; 