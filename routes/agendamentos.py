from flask import Blueprint, request, jsonify
from utils.db import execute_query, execute_procedure
from utils.auth import token_required, admin_required, atendente_required
from utils.validators import validate_agendamento_data, validate_avaliacao_data
from datetime import datetime

agendamentos_bp = Blueprint('agendamentos', __name__)

@agendamentos_bp.route('', methods=['GET'])
@token_required
def get_agendamentos():
    """Rota para listar agendamentos do usuário logado."""
    user_id = request.user['id_usuario']
    tipo_usuario = request.user['tipo_usuario']
    
    # Parâmetros de filtro
    situacao = request.args.get('situacao')
    data_inicio = request.args.get('data_inicio')
    data_fim = request.args.get('data_fim')
    
    # Constrói a consulta SQL com os filtros
    query = """
        SELECT ag.id_agendamento, ag.data_horario, ag.situacao,
               u.nome as nome_usuario, at.nome as nome_atendente,
               s.nome as nome_servico, s.duracao
        FROM agendamento ag
        JOIN usuario u ON ag.id_usuario = u.id_usuario
        JOIN usuario at ON ag.id_atendente = at.id_usuario
        JOIN servicos s ON ag.id_servico = s.id_servico
        WHERE 1=1
    """
    params = []
    
    # Filtra por usuário ou atendente dependendo do tipo de usuário
    if tipo_usuario == 'usuario':
        query += " AND ag.id_usuario = %s"
        params.append(user_id)
    elif tipo_usuario == 'atendente':
        query += " AND ag.id_atendente = %s"
        params.append(user_id)
    elif tipo_usuario == 'admin':
        # Administradores podem ver todos os agendamentos
        pass
    
    if situacao:
        query += " AND ag.situacao = %s"
        params.append(situacao)
    
    if data_inicio:
        query += " AND DATE(ag.data_horario) >= %s"
        params.append(data_inicio)
    
    if data_fim:
        query += " AND DATE(ag.data_horario) <= %s"
        params.append(data_fim)
    
    # Ordena por data e hora
    query += " ORDER BY ag.data_horario"
    
    # Executa a consulta
    agendamentos = execute_query(query, params)
    
    return jsonify({
        'message': 'Agendamentos listados com sucesso!',
        'agendamentos': agendamentos
    }), 200

@agendamentos_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_agendamento(id):
    """Rota para obter detalhes de um agendamento específico."""
    user_id = request.user['id_usuario']
    tipo_usuario = request.user['tipo_usuario']
    
    # Busca o agendamento
    query = """
        SELECT ag.id_agendamento, ag.data_horario, ag.situacao,
               u.id_usuario, u.nome as nome_usuario, u.email as email_usuario,
               at.id_usuario as id_atendente, at.nome as nome_atendente, at.email as email_atendente,
               s.id_servico, s.nome as nome_servico, s.descricao as descricao_servico, 
               s.categoria, s.duracao
        FROM agendamento ag
        JOIN usuario u ON ag.id_usuario = u.id_usuario
        JOIN usuario at ON ag.id_atendente = at.id_usuario
        JOIN servicos s ON ag.id_servico = s.id_servico
        WHERE ag.id_agendamento = %s
    """
    
    agendamento = execute_query(query, (id,), fetch_all=False)
    
    if not agendamento:
        return jsonify({'message': 'Agendamento não encontrado!'}), 404
    
        # Verifica se o usuário tem permissão para ver este agendamento
    if tipo_usuario != 'admin' and user_id != agendamento['id_usuario'] and user_id != agendamento['id_atendente']:
        return jsonify({'message': 'Acesso negado!'}), 403
    
    # Busca a avaliação, se existir
    avaliacao = execute_query("""
        SELECT id_avaliacao, nota, comentario, horario
        FROM avaliacao
        WHERE id_agendamento = %s
    """, (id,), fetch_all=False)
    
    if avaliacao:
        agendamento['avaliacao'] = avaliacao
    
    return jsonify({
        'message': 'Agendamento encontrado com sucesso!',
        'agendamento': agendamento
    }), 200

@agendamentos_bp.route('', methods=['POST'])
@token_required
def create_agendamento():
    """Rota para criar um novo agendamento."""
    data = request.json
    user_id = request.user['id_usuario']
    
    # Valida os dados do agendamento
    errors = validate_agendamento_data(data)
    if errors:
        return jsonify({'message': 'Dados inválidos!', 'errors': errors}), 400
    
    # Verifica se o usuário está tentando agendar para si mesmo
    if data.get('id_usuario') != user_id and request.user['tipo_usuario'] != 'admin':
        return jsonify({'message': 'Você só pode criar agendamentos para si mesmo!'}), 403
    
    # Se o ID do usuário não for fornecido, usa o ID do usuário logado
    if 'id_usuario' not in data:
        data['id_usuario'] = user_id
    
    # Verifica se o atendente existe e está aprovado
    atendente = execute_query("""
        SELECT u.id_usuario
        FROM usuario u
        WHERE u.id_usuario = %s
        AND u.tipo_usuario = 'atendente'
        AND u.situacao = 'aprovado'
    """, (data['id_atendente'],), fetch_all=False)
    
    if not atendente:
        return jsonify({'message': 'Atendente não encontrado ou não aprovado!'}), 404
    
    # Verifica se o serviço existe
    servico = execute_query("""
        SELECT id_servico
        FROM servicos
        WHERE id_servico = %s
    """, (data['id_servico'],), fetch_all=False)
    
    if not servico:
        return jsonify({'message': 'Serviço não encontrado!'}), 404
    
    # Verifica se o atendente oferece este serviço
    servico_atendente = execute_query("""
        SELECT id_atendente
        FROM atendente_servico
        WHERE id_atendente = %s
        AND id_servico = %s
        AND habilitado = TRUE
    """, (data['id_atendente'], data['id_servico']), fetch_all=False)
    
    if not servico_atendente:
        return jsonify({'message': 'Este atendente não oferece o serviço selecionado!'}), 400
    
    # Verifica disponibilidade usando a função do banco de dados
    disponivel = execute_query("""
        SELECT verificar_disponibilidade(%s, %s, %s) as disponivel
    """, (data['data_horario'], data['id_usuario'], data['id_atendente']), fetch_all=False)
    
    if not disponivel or not disponivel['disponivel']:
        return jsonify({'message': 'Horário indisponível!'}), 409
    
    # Cria o agendamento usando a stored procedure
    try:
        resultado = execute_procedure('criar_agendamento', (
            data['id_usuario'],
            data['id_atendente'],
            data['id_servico'],
            data['data_horario']
        ))
        
        if resultado and 'novo_agendamento_id' in resultado[0]:
            agendamento_id = resultado[0]['novo_agendamento_id']
            
            return jsonify({
                'message': 'Agendamento criado com sucesso!',
                'id_agendamento': agendamento_id
            }), 201
        else:
            return jsonify({'message': 'Erro ao criar agendamento!'}), 500
    
    except Exception as e:
        return jsonify({'message': f'Erro ao criar agendamento: {str(e)}'}), 500

@agendamentos_bp.route('/<int:id>/cancelar', methods=['POST'])
@token_required
def cancelar_agendamento(id):
    """Rota para cancelar um agendamento."""
    data = request.json
    user_id = request.user['id_usuario']
    tipo_usuario = request.user['tipo_usuario']
    
    # Verifica se o motivo foi fornecido
    if not data or 'motivo' not in data:
        return jsonify({'message': 'Motivo do cancelamento é obrigatório!'}), 400
    
    motivo = data['motivo']
    
    # Busca o agendamento
    agendamento = execute_query("""
        SELECT id_agendamento, id_usuario, id_atendente, situacao, data_horario
        FROM agendamento
        WHERE id_agendamento = %s
    """, (id,), fetch_all=False)
    
    if not agendamento:
        return jsonify({'message': 'Agendamento não encontrado!'}), 404
    
    # Verifica se o agendamento já foi cancelado
    if agendamento['situacao'] == 'cancelado':
        return jsonify({'message': 'Este agendamento já foi cancelado!'}), 400
    
    # Verifica se o usuário tem permissão para cancelar este agendamento
    if tipo_usuario != 'admin' and user_id != agendamento['id_usuario'] and user_id != agendamento['id_atendente']:
        return jsonify({'message': 'Acesso negado!'}), 403
    
    # Verifica se o agendamento já ocorreu
    data_agendamento = datetime.strptime(str(agendamento['data_horario']), '%Y-%m-%d %H:%M:%S')
    if data_agendamento < datetime.now():
        return jsonify({'message': 'Não é possível cancelar um agendamento que já ocorreu!'}), 400
    
    # Cancela o agendamento usando a stored procedure
    try:
        execute_procedure('cancelar_agendamento', (id, motivo))
        
        return jsonify({
            'message': 'Agendamento cancelado com sucesso!'
        }), 200
    
    except Exception as e:
        return jsonify({'message': f'Erro ao cancelar agendamento: {str(e)}'}), 500

@agendamentos_bp.route('/<int:id>/confirmar', methods=['POST'])
@token_required
def confirmar_agendamento(id):
    """Rota para confirmar um agendamento."""
    user_id = request.user['id_usuario']
    tipo_usuario = request.user['tipo_usuario']
    
    # Busca o agendamento
    agendamento = execute_query("""
        SELECT id_agendamento, id_usuario, id_atendente, situacao, data_horario
        FROM agendamento
        WHERE id_agendamento = %s
    """, (id,), fetch_all=False)
    
    if not agendamento:
        return jsonify({'message': 'Agendamento não encontrado!'}), 404
    
    # Verifica se o agendamento já foi confirmado ou cancelado
    if agendamento['situacao'] != 'pendente':
        return jsonify({'message': f'Este agendamento já está {agendamento["situacao"]}!'}), 400
    
    # Verifica se o usuário tem permissão para confirmar este agendamento
    # Apenas o atendente ou um admin pode confirmar
    if tipo_usuario != 'admin' and (tipo_usuario != 'atendente' or user_id != agendamento['id_atendente']):
        return jsonify({'message': 'Acesso negado!'}), 403
    
    # Confirma o agendamento
    execute_query("""
        UPDATE agendamento
        SET situacao = 'confirmado'
        WHERE id_agendamento = %s
    """, (id,), fetch_all=False)
    
    return jsonify({
        'message': 'Agendamento confirmado com sucesso!'
    }), 200

@agendamentos_bp.route('/<int:id>/avaliar', methods=['POST'])
@token_required
def avaliar_agendamento(id):
    """Rota para avaliar um agendamento."""
    data = request.json
    user_id = request.user['id_usuario']
    
    # Valida os dados da avaliação
    errors = validate_avaliacao_data(data)
    if errors:
        return jsonify({'message': 'Dados inválidos!', 'errors': errors}), 400
    
    # Busca o agendamento
    agendamento = execute_query("""
        SELECT id_agendamento, id_usuario, situacao, data_horario
        FROM agendamento
        WHERE id_agendamento = %s
    """, (id,), fetch_all=False)
    
    if not agendamento:
        return jsonify({'message': 'Agendamento não encontrado!'}), 404
    
    # Verifica se o usuário é o dono do agendamento
    if user_id != agendamento['id_usuario']:
        return jsonify({'message': 'Acesso negado!'}), 403
    
    # Verifica se o agendamento foi confirmado
    if agendamento['situacao'] != 'confirmado':
        return jsonify({'message': 'Apenas agendamentos confirmados podem ser avaliados!'}), 400
    
    # Verifica se o agendamento já ocorreu
    data_agendamento = datetime.strptime(str(agendamento['data_horario']), '%Y-%m-%d %H:%M:%S')
    if data_agendamento > datetime.now():
        return jsonify({'message': 'Não é possível avaliar um agendamento que ainda não ocorreu!'}), 400
    
    # Verifica se o agendamento já foi avaliado
    avaliacao_existente = execute_query("""
        SELECT id_avaliacao
        FROM avaliacao
        WHERE id_agendamento = %s
    """, (id,), fetch_all=False)
    
    if avaliacao_existente:
        return jsonify({'message': 'Este agendamento já foi avaliado!'}), 400
    
    # Cria a avaliação usando a stored procedure
    try:
        resultado = execute_procedure('inserir_avaliacao', (
            id,
            data['nota'],
            data.get('comentario', '')
        ))
        
        if resultado and 'nova_avaliacao_id' in resultado[0]:
            avaliacao_id = resultado[0]['nova_avaliacao_id']
            
            return jsonify({
                'message': 'Avaliação registrada com sucesso!',
                'id_avaliacao': avaliacao_id
            }), 201
        else:
            return jsonify({'message': 'Erro ao registrar avaliação!'}), 500
    
    except Exception as e:
        return jsonify({'message': f'Erro ao registrar avaliação: {str(e)}'}), 500

@agendamentos_bp.route('/horarios-disponiveis', methods=['GET'])
@token_required
def get_horarios_disponiveis():
    """Rota para verificar horários disponíveis de um atendente."""
    id_atendente = request.args.get('id_atendente')
    data = request.args.get('data')  # Formato: YYYY-MM-DD
    
    if not id_atendente or not data:
        return jsonify({'message': 'ID do atendente e data são obrigatórios!'}), 400
    
    # Verifica se o atendente existe
    atendente = execute_query("""
        SELECT u.id_usuario
        FROM usuario u
        WHERE u.id_usuario = %s
        AND u.tipo_usuario = 'atendente'
        AND u.situacao = 'aprovado'
    """, (id_atendente,), fetch_all=False)
    
    if not atendente:
        return jsonify({'message': 'Atendente não encontrado ou não aprovado!'}), 404
    
    # Busca os agendamentos do atendente na data especificada
    agendamentos = execute_query("""
        SELECT TIME_FORMAT(data_horario, '%H:%i') as horario
        FROM agendamento
        WHERE id_atendente = %s
        AND DATE(data_horario) = %s
        AND situacao IN ('pendente', 'confirmado')
    """, (id_atendente, data))
    
    # Horários ocupados
    horarios_ocupados = [a['horario'] for a in agendamentos]
    
    # Horários de atendimento padrão (8h às 18h, de hora em hora)
    horarios_padrao = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    
    # Horários disponíveis
    horarios_disponiveis = [h for h in horarios_padrao if h not in horarios_ocupados]
    
    return jsonify({
        'message': 'Horários disponíveis listados com sucesso!',
        'data': data,
        'id_atendente': id_atendente,
        'horarios_disponiveis': horarios_disponiveis
    }), 200

@agendamentos_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard():
    """Rota para obter dados para o dashboard administrativo."""
    # Total de agendamentos
    total_agendamentos = execute_query("""
        SELECT COUNT(*) as total
        FROM agendamento
    """, fetch_all=False)
    
    # Agendamentos por status
    agendamentos_por_status = execute_query("""
        SELECT situacao, COUNT(*) as total
        FROM agendamento
        GROUP BY situacao
    """)
    
    # Agendamentos por categoria de serviço
    agendamentos_por_categoria = execute_query("""
        SELECT s.categoria, COUNT(*) as total
        FROM agendamento ag
        JOIN servicos s ON ag.id_servico = s.id_servico
        GROUP BY s.categoria
    """)
    
    # Serviços mais populares
    servicos_populares = execute_query("""
        SELECT *
        FROM vw_servicos_populares
        LIMIT 5
    """)
    
    # Atendentes com melhor avaliação
    atendentes_top = execute_query("""
        SELECT *
        FROM vw_avaliacao_atendentes
        ORDER BY media_nota DESC
        LIMIT 5
    """)
    
    # Usuários pendentes de aprovação
    usuarios_pendentes = execute_query("""
        SELECT *
        FROM vw_usuarios_aguardando_aprovacao
    """)
    
    return jsonify({
        'message': 'Dados do dashboard obtidos com sucesso!',
        'total_agendamentos': total_agendamentos['total'],
        'agendamentos_por_status': agendamentos_por_status,
        'agendamentos_por_categoria': agendamentos_por_categoria,
        'servicos_populares': servicos_populares,
        'atendentes_top': atendentes_top,
        'usuarios_pendentes': usuarios_pendentes
    }), 200