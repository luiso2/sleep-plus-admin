import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select, Card, Alert, Button } from "antd";
import { useParams, useNavigate } from "react-router-dom";
import type { IScript } from "../../interfaces";

export const ScriptEditSimple: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { formProps, saveButtonProps, queryResult } = useForm<IScript>({
    resource: "scripts",
    id: id,
    action: "edit",
  });
  
  const scriptData = queryResult?.data?.data;

  console.log("ScriptEditSimple - Debug Info:", {
    id,
    isLoading: queryResult?.isLoading,
    isError: queryResult?.isError,
    error: queryResult?.error,
    scriptData,
    queryResult
  });

  if (queryResult?.isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Cargando script...</h2>
        <p>ID: {id}</p>
      </div>
    );
  }

  if (queryResult?.isError) {
    return (
      <Alert
        message="Error al cargar el script"
        description={
          <div>
            <p><strong>ID solicitado:</strong> {id}</p>
            <p><strong>Error:</strong> {queryResult.error?.message || "Error desconocido"}</p>
            <p><strong>Status:</strong> {(queryResult.error as any)?.response?.status}</p>
            <Button onClick={() => navigate('/scripts')}>Volver a la lista</Button>
          </div>
        }
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  if (!scriptData) {
    return (
      <Alert
        message="Script no encontrado"
        description={
          <div>
            <p>No se encontró el script con ID: {id}</p>
            <Button onClick={() => navigate('/scripts')}>Volver a la lista</Button>
          </div>
        }
        type="warning"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Editar Script (Versión Simple)</h1>
      <p><strong>ID:</strong> {id}</p>
      <p><strong>Datos cargados:</strong> {scriptData ? 'Sí' : 'No'}</p>
      
      <Edit 
        title={`Editando: ${scriptData.name || 'Sin nombre'}`}
        saveButtonProps={saveButtonProps}
      >
        <Form {...formProps} layout="vertical">
          <Card title="Información Básica" bordered={false}>
            <Form.Item
              label="Nombre del Script"
              name="name"
              rules={[{ required: true, message: "Este campo es requerido" }]}
            >
              <Input placeholder="Nombre del script" />
            </Form.Item>

            <Form.Item
              label="Tipo"
              name="type"
              rules={[{ required: true, message: "Selecciona un tipo" }]}
            >
              <Select placeholder="Seleccionar tipo">
                <Select.Option value="cold">Llamada fría</Select.Option>
                <Select.Option value="warm">Llamada cálida</Select.Option>
                <Select.Option value="winback">Recuperación</Select.Option>
                <Select.Option value="renewal">Renovación</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Versión"
              name="version"
              rules={[{ required: true, message: "Este campo es requerido" }]}
            >
              <Input placeholder="1.0" />
            </Form.Item>

            <Form.Item label="Estado" name="status">
              <Select>
                <Select.Option value="draft">Borrador</Select.Option>
                <Select.Option value="active">Activo</Select.Option>
                <Select.Option value="archived">Archivado</Select.Option>
              </Select>
            </Form.Item>
          </Card>
          
          <Card title="Debug Info" style={{ marginTop: 16 }}>
            <pre>{JSON.stringify(scriptData, null, 2)}</pre>
          </Card>
        </Form>
      </Edit>
    </div>
  );
}; 