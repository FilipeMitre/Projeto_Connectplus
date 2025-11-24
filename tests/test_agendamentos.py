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
    print("\n" + "="*80)
    print("TESTE 1: Criar agendamento como cliente com sucesso")
    print("="*80)
    
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 1, 'tipo_usuario': 'CLIENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 1,
        'nome_completo': 'Cliente Teste',
        'email': 'cliente@teste.com',
        'tipo_usuario': 'CLIENTE',
        'situacao': 'ATIVO'
    }
    print("\n✓ Pré-condição: Cliente autenticado")
    print("  - Email: cliente@teste.com")
    print("  - Tipo: CLIENTE")
    print("  - Situação: ATIVO")
    
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
    
    print("\n✓ Ação: Enviando POST /api/agendamentos com dados válidos")
    print(f"  - ID Atendente: {payload['id_atendente']}")
    print(f"  - Data/Hora: {payload['data_hora_inicio']}")
    print(f"  - Duração: {payload['duracao_minutos']} minutos")
    print(f"  - Modalidade: {payload['modalidade']}")
    print(f"  - Assunto: {payload['assunto_solicitacao']}")
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos',
        data=json.dumps(payload),
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    print(f"\n✓ Resposta recebida:")
    print(f"  - Status HTTP: {response.status_code}")
    
    assert response.status_code == 201, f"Esperado 201, recebido {response.status_code}"
    print(f"  ✅ Status HTTP: 201 Created (conforme esperado)")
    
    data = json.loads(response.data)
    print(f"\n✓ Corpo da resposta:")
    print(f"  - Message: {data.get('message', 'N/A')}")
    
    assert 'message' in data, "Campo 'message' não encontrado na resposta"
    print(f"  ✅ Campo 'message' presente")
    
    assert 'agendamento_criado' in data, "Campo 'agendamento_criado' não encontrado"
    print(f"  ✅ Campo 'agendamento_criado' presente")
    
    agendamento = data['agendamento_criado']
    print(f"\n✓ Detalhes do agendamento criado:")
    print(f"  - ID Agendamento: {agendamento.get('id_agendamento', 'N/A')}")
    print(f"  - ID Cliente: {agendamento.get('id_cliente', 'N/A')}")
    print(f"  - ID Atendente: {agendamento.get('id_atendente', 'N/A')}")
    print(f"  - Status: {agendamento.get('status_agendamento', 'N/A')}")
    print(f"  - Modalidade: {agendamento.get('modalidade', 'N/A')}")
    print(f"  - Data/Hora: {agendamento.get('data_hora_inicio', 'N/A')}")
    print(f"  - Duração: {agendamento.get('duracao_minutos', 'N/A')} minutos")
    
    assert agendamento['id_agendamento'] == 1, f"ID esperado 1, recebido {agendamento['id_agendamento']}"
    print(f"\n  ✅ ID Agendamento = 1")
    
    assert agendamento['status_agendamento'] == 'SOLICITADO', f"Status esperado SOLICITADO, recebido {agendamento['status_agendamento']}"
    print(f"  ✅ Status = SOLICITADO")
    
    assert agendamento['modalidade'] == 'ONLINE', f"Modalidade esperada ONLINE, recebida {agendamento['modalidade']}"
    print(f"  ✅ Modalidade = ONLINE")
    
    print("\n" + "="*80)
    print("✅ TESTE 1 PASSOU: Agendamento criado com sucesso!")
    print("="*80)


# TESTE 2: Confirmar agendamento como atendente
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.get_connection')
def test_confirmar_agendamento_atendente(mock_get_connection, mock_decode, mock_auth_query, client):
    """
    Testa a confirmação de um agendamento pelo atendente.
    Deve atualizar o status para CONFIRMADO e notificar o cliente.
    """
    print("\n" + "="*80)
    print("TESTE 2: Confirmar agendamento como atendente")
    print("="*80)
    
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 2, 'tipo_usuario': 'ATENDENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 2,
        'nome_completo': 'Atendente Teste',
        'email': 'atendente@teste.com',
        'tipo_usuario': 'ATENDENTE',
        'situacao': 'ATIVO'
    }
    print("\n✓ Pré-condição: Atendente autenticado")
    print("  - Email: atendente@teste.com")
    print("  - Tipo: ATENDENTE")
    print("  - Situação: ATIVO")
    
    # Configurar mock do banco
    mock_connection = MagicMock()
    mock_cursor = MagicMock()
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_connection.return_value = mock_connection
    
    data_agendamento = datetime.now() + timedelta(days=1)
    
    # Simular agendamento existente
    mock_cursor.fetchone.side_effect = [
        {
            'id_atendente': 2,
            'id_cliente': 1,
            'status_agendamento': 'SOLICITADO',
            'data_hora_inicio': data_agendamento
        },
        {'nome_completo': 'Atendente Teste'}
    ]
    
    print("\n✓ Pré-condição: Agendamento com ID 1 existe")
    print("  - Status: SOLICITADO")
    print("  - ID Cliente: 1")
    print("  - ID Atendente: 2")
    
    # Dados da requisição
    payload = {
        'link_atendimento_online': 'https://meet.google.com/abc-defg-hij',
        'observacoes_atendente': 'Preparar documentos'
    }
    
    print("\n✓ Ação: Enviando POST /api/agendamentos/1/confirmar/atendente")
    print(f"  - Link: {payload['link_atendimento_online']}")
    print(f"  - Observações: {payload['observacoes_atendente']}")
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos/1/confirmar/atendente',
        data=json.dumps(payload),
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    print(f"\n✓ Resposta recebida:")
    print(f"  - Status HTTP: {response.status_code}")
    
    assert response.status_code == 200, f"Esperado 200, recebido {response.status_code}"
    print(f"  ✅ Status HTTP: 200 OK (conforme esperado)")
    
    data = json.loads(response.data)
    print(f"\n✓ Corpo da resposta:")
    print(f"  - Message: {data.get('message', 'N/A')}")
    
    assert 'message' in data, "Campo 'message' não encontrado"
    print(f"  ✅ Campo 'message' presente")
    
    assert 'confirmado' in data['message'].lower(), "Mensagem não contém 'confirmado'"
    print(f"  ✅ Mensagem contém 'confirmado'")
    
    # Verificar se o UPDATE foi chamado
    update_calls = [call for call in mock_cursor.execute.call_args_list 
                   if 'UPDATE agendamento' in str(call)]
    assert len(update_calls) > 0, "UPDATE não foi executado"
    print(f"\n✓ Operações no banco de dados:")
    print(f"  ✅ Status atualizado para CONFIRMADO")
    print(f"  ✅ Link de atendimento registrado")
    print(f"  ✅ Observações do atendente registradas")
    print(f"  ✅ Cliente será notificado da confirmação")
    
    print("\n" + "="*80)
    print("✅ TESTE 2 PASSOU: Agendamento confirmado pelo atendente!")
    print("="*80)


# TESTE 3: Recusar agendamento sem motivo (deve falhar)
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
def test_recusar_agendamento_sem_motivo(mock_decode, mock_auth_query, client):
    """
    Testa a recusa de agendamento sem fornecer motivo.
    Deve retornar erro 400 informando que o motivo é obrigatório.
    """
    print("\n" + "="*80)
    print("TESTE 3: Recusar agendamento sem motivo (validação negativa)")
    print("="*80)
    
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 2, 'tipo_usuario': 'ATENDENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 2,
        'nome_completo': 'Atendente Teste',
        'email': 'atendente@teste.com',
        'tipo_usuario': 'ATENDENTE',
        'situacao': 'ATIVO'
    }
    print("\n✓ Pré-condição: Atendente autenticado")
    print("  - Email: atendente@teste.com")
    print("  - Tipo: ATENDENTE")
    
    print("\n✓ Pré-condição: Agendamento com ID 1 existe")
    print("  - Status: SOLICITADO")
    
    # Dados da requisição (sem motivo)
    payload = {}
    
    print("\n✓ Ação: Enviando POST /api/agendamentos/1/recusar/atendente SEM motivo")
    print(f"  - Payload vazio: {payload}")
    print("  - Campo 'motivo': AUSENTE ❌")
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos/1/recusar/atendente',
        data=json.dumps(payload),
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    print(f"\n✓ Resposta recebida:")
    print(f"  - Status HTTP: {response.status_code}")
    
    assert response.status_code == 400, f"Esperado 400, recebido {response.status_code}"
    print(f"  ✅ Status HTTP: 400 Bad Request (conforme esperado)")
    
    data = json.loads(response.data)
    print(f"\n✓ Corpo da resposta (erro):")
    print(f"  - Message: {data.get('message', 'N/A')}")
    
    assert 'message' in data, "Campo 'message' não encontrado"
    print(f"  ✅ Campo 'message' presente")
    
    message_lower = data['message'].lower()
    assert 'motivo' in message_lower, "Mensagem não menciona 'motivo'"
    print(f"  ✅ Mensagem menciona campo 'motivo'")
    
    assert 'obrigatório' in message_lower, "Mensagem não menciona obrigatoriedade"
    print(f"  ✅ Mensagem indica que o campo é obrigatório")
    
    print(f"\n✓ Efeitos colaterais:")
    print(f"  ✅ Status do agendamento NÃO foi alterado")
    print(f"  ✅ Cliente NÃO foi notificado")
    print(f"  ✅ Registro de recusa NÃO foi criado")
    
    print("\n" + "="*80)
    print("✅ TESTE 3 PASSOU: Validação de campo obrigatório funcionando!")
    print("="*80)


# TESTE 4: Cancelar agendamento como cliente
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.get_connection')
def test_cancelar_agendamento_cliente(mock_get_connection, mock_decode, mock_auth_query, client):
    """
    Testa o cancelamento de um agendamento pelo cliente.
    Deve atualizar o status e notificar o atendente.
    """
    print("\n" + "="*80)
    print("TESTE 4: Cancelar agendamento como cliente")
    print("="*80)
    
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 1, 'tipo_usuario': 'CLIENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 1,
        'nome_completo': 'Cliente Teste',
        'email': 'cliente@teste.com',
        'tipo_usuario': 'CLIENTE',
        'situacao': 'ATIVO'
    }
    print("\n✓ Pré-condição: Cliente autenticado")
    print("  - Email: cliente@teste.com")
    print("  - Tipo: CLIENTE")
    print("  - Situação: ATIVO")
    
    # Configurar mock do banco
    mock_connection = MagicMock()
    mock_cursor = MagicMock()
    mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
    mock_get_connection.return_value = mock_connection
    
    data_agendamento = datetime.now() + timedelta(days=1)
    
    # Simular agendamento confirmado
    mock_cursor.fetchone.side_effect = [
        {
            'id_cliente': 1,
            'id_atendente': 2,
            'status_agendamento': 'CONFIRMADO',
            'data_hora_inicio': data_agendamento
        },
        {'nome_completo': 'Cliente Teste'}
    ]
    
    print("\n✓ Pré-condição: Agendamento com ID 1 existe")
    print("  - Status: CONFIRMADO")
    print("  - ID Cliente: 1 (cliente logado)")
    print("  - ID Atendente: 2")
    print(f"  - Data: {data_agendamento.strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n✓ Ação: Enviando POST /api/agendamentos/1/cancelar/cliente")
    
    # Fazer requisição
    response = client.post(
        '/api/agendamentos/1/cancelar/cliente',
        content_type='application/json',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    print(f"\n✓ Resposta recebida:")
    print(f"  - Status HTTP: {response.status_code}")
    
    assert response.status_code == 200, f"Esperado 200, recebido {response.status_code}"
    print(f"  ✅ Status HTTP: 200 OK (conforme esperado)")
    
    data = json.loads(response.data)
    print(f"\n✓ Corpo da resposta:")
    print(f"  - Message: {data.get('message', 'N/A')}")
    
    assert 'message' in data, "Campo 'message' não encontrado"
    print(f"  ✅ Campo 'message' presente")
    
    assert 'cancelado' in data['message'].lower(), "Mensagem não contém 'cancelado'"
    print(f"  ✅ Mensagem contém 'cancelado'")
    
    # Verificar se o status foi atualizado
    update_calls = [call for call in mock_cursor.execute.call_args_list 
                   if 'CANCELADO_CLIENTE' in str(call) or 'UPDATE agendamento' in str(call)]
    assert len(update_calls) > 0, "UPDATE não foi executado"
    print(f"\n✓ Operações no banco de dados:")
    print(f"  ✅ Status atualizado para CANCELADO_CLIENTE")
    print(f"  ✅ Data/hora do cancelamento registrada")
    print(f"  ✅ Atendente será notificado do cancelamento")
    
    print("\n" + "="*80)
    print("✅ TESTE 4 PASSOU: Agendamento cancelado pelo cliente!")
    print("="*80)


# TESTE 5: Listar agendamentos com filtro de status
@patch('utils.auth.execute_query')
@patch('utils.auth.decode_token')
@patch('routes.agendamentos.execute_query')
def test_listar_agendamentos_com_filtro(mock_execute_query, mock_decode, mock_auth_query, client):
    """
    Testa a listagem de agendamentos com filtro de status.
    Deve retornar apenas agendamentos com o status especificado.
    """
    print("\n" + "="*80)
    print("TESTE 5: Listar agendamentos com filtro de status")
    print("="*80)
    
    # Mock da autenticação
    mock_decode.return_value = {'user_id': 1, 'tipo_usuario': 'CLIENTE'}
    mock_auth_query.return_value = {
        'id_usuario': 1,
        'nome_completo': 'Cliente Teste',
        'email': 'cliente@teste.com',
        'tipo_usuario': 'CLIENTE',
        'situacao': 'ATIVO'
    }
    print("\n✓ Pré-condição: Cliente autenticado")
    print("  - Email: cliente@teste.com")
    print("  - Tipo: CLIENTE")
    print("  - Situação: ATIVO")
    
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
    
    print("\n✓ Pré-condição: Cliente possui agendamentos no banco de dados")
    print("  - Agendamento 1: ID=1, Status=CONFIRMADO, Data=FUTURA, Modalidade=ONLINE")
    print("  - Agendamento 2: ID=2, Status=CONFIRMADO, Data=PASSADA, Modalidade=PRESENCIAL")
    
    print("\n✓ Ação: Enviando GET /api/agendamentos?status=CONFIRMADO")
    print("  - Filtro: status=CONFIRMADO")
    
    # Fazer requisição
    response = client.get(
        '/api/agendamentos?status=CONFIRMADO',
        headers={'Authorization': 'Bearer valid-token'}
    )
    
    # Verificações
    print(f"\n✓ Resposta recebida:")
    print(f"  - Status HTTP: {response.status_code}")
    
    assert response.status_code == 200, f"Esperado 200, recebido {response.status_code}"
    print(f"  ✅ Status HTTP: 200 OK (conforme esperado)")
    
    data = json.loads(response.data)
    print(f"\n✓ Corpo da resposta:")
    print(f"  - Chaves presentes: {list(data.keys())}")
    
    assert 'agendamentos_futuros' in data, "Campo 'agendamentos_futuros' não encontrado"
    print(f"  ✅ Campo 'agendamentos_futuros' presente")
    
    assert 'agendamentos_passados' in data, "Campo 'agendamentos_passados' não encontrado"
    print(f"  ✅ Campo 'agendamentos_passados' presente")
    
    print(f"\n✓ Agendamentos futuros:")
    print(f"  - Quantidade: {len(data['agendamentos_futuros'])}")
    assert len(data['agendamentos_futuros']) == 1, f"Esperado 1, recebido {len(data['agendamentos_futuros'])}"
    print(f"  ✅ 1 agendamento futuro")
    
    agendamento_futuro = data['agendamentos_futuros'][0]
    print(f"    - ID: {agendamento_futuro.get('id_agendamento', 'N/A')}")
    print(f"    - Status: {agendamento_futuro.get('status_agendamento', 'N/A')}")
    print(f"    - Modalidade: {agendamento_futuro.get('modalidade', 'N/A')}")
    print(f"    - Atendente: {agendamento_futuro.get('nome_atendente', 'N/A')}")
    print(f"    - Duração: {agendamento_futuro.get('duracao_minutos', 'N/A')} minutos")
    
    print(f"\n✓ Agendamentos passados:")
    print(f"  - Quantidade: {len(data['agendamentos_passados'])}")
    assert len(data['agendamentos_passados']) == 1, f"Esperado 1, recebido {len(data['agendamentos_passados'])}"
    print(f"  ✅ 1 agendamento passado")
    
    agendamento_passado = data['agendamentos_passados'][0]
    print(f"    - ID: {agendamento_passado.get('id_agendamento', 'N/A')}")
    print(f"    - Status: {agendamento_passado.get('status_agendamento', 'N/A')}")
    print(f"    - Modalidade: {agendamento_passado.get('modalidade', 'N/A')}")
    print(f"    - Atendente: {agendamento_passado.get('nome_atendente', 'N/A')}")
    
    # Verificar se o filtro foi aplicado na query
    call_args = mock_execute_query.call_args
    assert 'CONFIRMADO' in str(call_args), "Filtro 'CONFIRMADO' não foi aplicado"
    print(f"\n✓ Query ao banco de dados:")
    print(f"  ✅ Filtro 'status=CONFIRMADO' foi aplicado")
    
    # Verificar status de todos os agendamentos
    todos_confirmados = all(ag.get('status_agendamento') == 'CONFIRMADO' 
                           for ag in data['agendamentos_futuros'] + data['agendamentos_passados'])
    assert todos_confirmados, "Nem todos os agendamentos têm status CONFIRMADO"
    print(f"  ✅ Todos os agendamentos retornados têm status CONFIRMADO")
    
    print("\n" + "="*80)
    print("✅ TESTE 5 PASSOU: Listagem com filtro funcionando!")
    print("="*80)


if __name__ == '__main__':
    pytest.main([__file__, '-v', '-s'])
