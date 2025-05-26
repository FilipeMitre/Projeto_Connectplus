from flask import Blueprint, request, jsonify
from utils.db import execute_query, insert_record, update_record
from utils.auth import token_required, admin_required
from utils.validators import validate_servico_data

servicos_bp = Blueprint('servicos', __name__)

@servicos_bp.route('', methods=['GET'])
def get_servicos():
    """Rota para listar todos os serviços."""
    # Parâmetros de filtro
    categoria = request.args.get('categoria')
    
    # Constrói a consulta SQL com os filtros
    query = """
        SELECT id_servico, nome, descricao, categoria, duracao, contagem_agendamentos
        FROM servicos
        WHERE 1=1
    """
    params = []
    
    if categoria:
        query += " AND categoria = %s"
        params.append(categoria)
    
    # Executa a consulta
    servicos = execute_query(query, params)
    
    return jsonify({
        'message': 'Serviços listados com sucesso!',
        'servicos': servicos
    }), 200

@servicos_bp.route('/<int:id>', methods=['GET'])
def get_servico(id):
    """Rota para obter detalhes de um serviço específico."""
    # Busca o serviço
    servico = execute_query("""
        SELECT id_servico, nome, descricao, categoria, duracao, contagem_agendamentos
        FROM servicos
        WHERE id_servico = %s
    """, (id,), fetch_all=False)
    
    if not servico:
        return jsonify({'message': 'Serviço não encontrado!'}), 404
    
    # Busca os atendentes que oferecem este serviço
    atendentes = execute_query("""
        SELECT u.id_usuario, u.nome, u.email, a.qualificacao
        FROM atendente_servico ats
        JOIN usuario u ON ats.id_atendente = u.id_usuario
        JOIN atendente a ON u.id_usuario = a.id_usuario
        WHERE ats.id_servico = %s
        AND ats.habilitado = TRUE
        AND u.situacao = 'aprovado'
    """, (id,))
    
    servico['atendentes'] = atendentes
    
    return jsonify({
        'message': 'Serviço encontrado com sucesso!',
        'servico': servico
    }), 200

@servicos_bp.route('', methods=['POST'])
@admin_required
def create_servico():
    """Rota para criar um novo serviço (apenas para administradores)."""
    data = request.json
    
    # Valida os dados do serviço
    errors = validate_servico_data(data)
    if errors:
        return jsonify({'message': 'Dados inválidos!', 'errors': errors}), 400
    
    # Insere o novo serviço
    servico_id = insert_record('servicos', {
        'nome': data['nome'],
        'descricao': data.get('descricao', ''),
        'categoria': data['categoria'],
        'duracao': data['duracao']
    })
    
    return jsonify({
        'message': 'Serviço criado com sucesso!',
        'id_servico': servico_id
    }), 201

@servicos_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_servico(id):
    """Rota para atualizar um serviço existente (apenas para administradores)."""
    data = request.json
    
    # Valida os dados do serviço
    errors = validate_servico_data(data)
    if errors:
        return jsonify({'message': 'Dados inválidos!', 'errors': errors}), 400
    
    # Verifica se o serviço existe
    servico = execute_query("""
        SELECT id_servico
        FROM servicos
        WHERE id_servico = %s
    """, (id,), fetch_all=False)
    
    if not servico:
        return jsonify({'message': 'Serviço não encontrado!'}), 404
    
    # Atualiza o serviço
    update_data = {
        'nome': data['nome'],
        'descricao': data.get('descricao', ''),
        'categoria': data['categoria'],
        'duracao': data['duracao']
    }
    
    rows_updated = update_record('servicos', update_data, {'id_servico': id})
    
    if rows_updated == 0:
        return jsonify({'message': 'Nenhum dado foi atualizado!'}), 400
    
    return jsonify({
        'message': 'Serviço atualizado com sucesso!'
    }), 200

@servicos_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_servico(id):
    """Rota para excluir um serviço (apenas para administradores)."""
    # Verifica se o serviço existe
    servico = execute_query("""
        SELECT id_servico
        FROM servicos
        WHERE id_servico = %s
    """, (id,), fetch_all=False)
    
    if not servico:
        return jsonify({'message': 'Serviço não encontrado!'}), 404
    
    # Verifica se existem agendamentos para este serviço
    agendamentos = execute_query("""
        SELECT COUNT(*) as total
        FROM agendamento
        WHERE id_servico = %s
    """, (id,), fetch_all=False)
    
    if agendamentos and agendamentos['total'] > 0:
        return jsonify({'message': 'Não é possível excluir um serviço com agendamentos!'}), 400
    
    # Exclui as relações com atendentes
    execute_query("""
        DELETE FROM atendente_servico
        WHERE id_servico = %s
    """, (id,), fetch_all=False)
    
    # Exclui o serviço
    execute_query("""
        DELETE FROM servicos
        WHERE id_servico = %s
    """, (id,), fetch_all=False)
    
    return jsonify({
        'message': 'Serviço excluído com sucesso!'
    }), 200

@servicos_bp.route('/populares', methods=['GET'])
def get_servicos_populares():
    """Rota para listar os serviços mais populares."""
    # Busca os serviços mais populares usando a view
    servicos = execute_query("""
        SELECT *
        FROM vw_servicos_populares
        LIMIT 5
    """)
    
    return jsonify({
        'message': 'Serviços populares listados com sucesso!',
        'servicos': servicos
    }), 200