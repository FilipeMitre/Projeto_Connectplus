# tests/test_agendamentos.py
import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
from app import create_app

@pytest.fixture
def app():
    """Fixture para criar a aplicação Flask em modo de teste"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    return app

@pytest.fixture
def client(app):
    """Fixture para criar um cliente de teste"""
    return app.test_client()


# TESTE 1: Criar agendamento como cliente com sucesso
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.get_connection')
@patch('routes.agendamentos.validate_agendamento_data')
def test_criar_agendamento_cliente_sucesso(mock_validate, mock_get_connection, mock_decode, mock_auth_query, client):
    """
    Testa a criação de um agendamento por um cliente com dados válidos.
    Deve retornar status 201 e os dados do agendamento criado.
    """
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 1, 'tipo_usuario': 'CLIENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 1,
        'nome_completo': 'Cliente Teste',
        'email': 'cliente@teste.com',
        'tipo_usuario': 'CLIENTE',
        'situacao': 'ATIVO'
    }
    
    # Mock da validação (sem erros)
    mock_validate.return_value = []
    
    # Configurar mock do banco de dados
    mock_connection = MagicMock()
    mock_cursor = MagicMock()
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_connection.return_value = mock_connection
    
    data_hora = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
    
    # Simular respostas do banco
    mock_cursor.fetchone.side_effect = [
        {'id_usuario': 2},  # Atendente existe
        {'disponivel': True},  # Horário disponível
        {'nome_completo': 'Cliente Teste'},  # Nome do cliente
        {  # Agendamento criado
            'id_agendamento': 1,
            'id_cliente': 1,
            'id_atendente': 2,
            'data_hora_inicio': data_hora,
            'duracao_minutos': 60,
            'status_agendamento': 'SOLICITADO',
            'modalidade': 'ONLINE',
            'assunto_solicitacao': 'Consulta de rotina'
        }
    ]
    mock_cursor.lastrowid = 1
    
    # Dados da requisição
    payload = {
        'id_atendente': 2,
        'data_hora_inicio': data_hora,
        'duracao_minutos': 60,
        'assunto_solicitacao': 'Consulta de rotina',
        'modalidade': 'ONLINE'
    }
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos',
        data=json.dumps(payload),
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    assert response.status_code == 201
    data = json.loads(response.data)
    assert 'message' in data
    assert 'agendamento_criado' in data
    assert data['agendamento_criado']['id_agendamento'] == 1
    assert data['agendamento_criado']['status_agendamento'] == 'SOLICITADO'
    print("✅ Teste 1 passou: Agendamento criado com sucesso")


# TESTE 2: Confirmar agendamento como atendente
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.get_connection')
def test_confirmar_agendamento_atendente(mock_get_connection, mock_decode, mock_auth_query, client):
    """
    Testa a confirmação de um agendamento pelo atendente.
    Deve atualizar o status para CONFIRMADO e notificar o cliente.
    """
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 2, 'tipo_usuario': 'ATENDENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 2,
        'nome_completo': 'Atendente Teste',
        'email': 'atendente@teste.com',
        'tipo_usuario': 'ATENDENTE',
        'situacao': 'ATIVO'
    }
    
    # Configurar mock do banco
    mock_connection = MagicMock()
    mock_cursor = MagicMock()
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_connection.return_value = mock_connection
    
    # Simular agendamento existente
    mock_cursor.fetchone.side_effect = [
        {
            'id_atendente': 2,
            'id_cliente': 1,
            'status_agendamento': 'SOLICITADO',
            'data_hora_inicio': datetime.now() + timedelta(days=1)
        },
        {'nome_completo': 'Atendente Teste'}
    ]
    
    # Dados da requisição
    payload = {
        'link_atendimento_online': 'https://meet.google.com/abc-defg-hij',
        'observacoes_atendente': 'Preparar documentos'
    }
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos/1/confirmar/atendente',
        data=json.dumps(payload),
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'confirmado' in data['message'].lower()
    
    # Verificar se o UPDATE foi chamado
    update_calls = [call for call in mock_cursor.execute.call_args_list 
                   if 'UPDATE agendamento' in str(call)]
    assert len(update_calls) > 0
    print("✅ Teste 2 passou: Agendamento confirmado pelo atendente")


# TESTE 3: Recusar agendamento sem motivo (deve falhar)
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
def test_recusar_agendamento_sem_motivo(mock_decode, mock_auth_query, client):
    """
    Testa a recusa de agendamento sem fornecer motivo.
    Deve retornar erro 400 informando que o motivo é obrigatório.
    """
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 2, 'tipo_usuario': 'ATENDENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 2,
        'nome_completo': 'Atendente Teste',
        'email': 'atendente@teste.com',
        'tipo_usuario': 'ATENDENTE',
        'situacao': 'ATIVO'
    }
    
    # Dados da requisição (sem motivo)
    payload = {}
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos/1/recusar/atendente',
        data=json.dumps(payload),
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    assert response.status_code == 400
    data = json.loads(response.data)
    assert 'message' in data
    assert 'motivo' in data['message'].lower()
    assert 'obrigatório' in data['message'].lower()
    print("✅ Teste 3 passou: Validação de motivo obrigatório funcionando")


# TESTE 4: Cancelar agendamento como cliente
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.get_connection')
def test_cancelar_agendamento_cliente(mock_get_connection, mock_decode, mock_auth_query, client):
    """
    Testa o cancelamento de um agendamento pelo cliente.
    Deve atualizar o status e notificar o atendente.
    """
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 1, 'tipo_usuario': 'CLIENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 1,
        'nome_completo': 'Cliente Teste',
        'email': 'cliente@teste.com',
        'tipo_usuario': 'CLIENTE',
        'situacao': 'ATIVO'
    }
    
    # Configurar mock do banco
    mock_connection = MagicMock()
    mock_cursor = MagicMock()
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_connection.return_value = mock_connection
    
    # Simular agendamento confirmado
    mock_cursor.fetchone.side_effect = [
        {
            'id_cliente': 1,
            'id_atendente': 2,
            'status_agendamento': 'CONFIRMADO',
            'data_hora_inicio': datetime.now() + timedelta(days=1)
        },
        {'nome_completo': 'Cliente Teste'}
    ]
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos/1/cancelar/cliente',
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'message' in data
    assert 'cancelado' in data['message'].lower()
    
    # Verificar se o status foi atualizado
    update_calls = [call for call in mock_cursor.execute.call_args_list 
                   if 'CANCELADO_CLIENTE' in str(call)]
    assert len(update_calls) > 0
    print("✅ Teste 4 passou: Agendamento cancelado pelo cliente")


# TESTE 5: Listar agendamentos com filtro de status
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.execute_query')
def test_listar_agendamentos_com_filtro(mock_execute_query, mock_decode, mock_auth_query, client):
    """
    Testa a listagem de agendamentos com filtro de status.
    Deve retornar apenas agendamentos com o status especificado.
    """
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 1, 'tipo_usuario': 'CLIENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 1,
        'nome_completo': 'Cliente Teste',
        'email': 'cliente@teste.com',
        'tipo_usuario': 'CLIENTE',
        'situacao': 'ATIVO'
    }
    
    # Simular agendamentos retornados do banco
    agendamentos_mock = [
        {
            'id_agendamento': 1,
            'data_hora_inicio': datetime.now() + timedelta(days=1),
            'duracao_minutos': 60,
            'modalidade': 'ONLINE',
            'status_agendamento': 'CONFIRMADO',
            'nome_atendente': 'Atendente Teste',
            'id_atendente': 2,
            'nome_cliente': 'Cliente Teste',
            'id_cliente': 1,
            'area_atendente': 'Psicologia',
            'avaliacao_existente': False,
            'assunto_solicitacao': 'Consulta',
            'link_atendimento_online': None,
            'observacoes_atendente': None
        },
        {
            'id_agendamento': 2,
            'data_hora_inicio': datetime.now() - timedelta(days=1),
            'duracao_minutos': 60,
            'modalidade': 'PRESENCIAL',
            'status_agendamento': 'CONFIRMADO',
            'nome_atendente': 'Atendente Teste',
            'id_atendente': 2,
            'nome_cliente': 'Cliente Teste',
            'id_cliente': 1,
            'area_atendente': 'Psicologia',
            'avaliacao_existente': False,
            'assunto_solicitacao': 'Consulta',
            'link_atendimento_online': None,
            'observacoes_atendente': None
        }
    ]
    
    mock_execute_query.return_value = agendamentos_mock
    
    # Fazer requisição
    response = client.get(
        '/api/agendamentos?status=CONFIRMADO',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'agendamentos_futuros' in data
    assert 'agendamentos_passados' in data
    
    # Verificar se os agendamentos foram separados corretamente
    assert len(data['agendamentos_futuros']) == 1
    assert len(data['agendamentos_passados']) == 1
    
    # Verificar se o filtro foi aplicado na query
    call_args = mock_execute_query.call_args
    assert 'CONFIRMADO' in str(call_args)
    print("✅ Teste 5 passou: Listagem com filtro funcionando")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
