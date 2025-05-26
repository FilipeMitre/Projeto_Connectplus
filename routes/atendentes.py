from flask import Blueprint, request, jsonify
from utils.db import execute_query, execute_procedure, update_record
from utils.auth import token_required, admin_required

atendentes_bp = Blueprint('atendentes', __name__)

@atendentes_bp.route('', methods=['GET'])
@token_required
def get_atendentes():
    """Rota para listar todos os atendentes."""
    # Parâmetros de filtro
    categoria = request.args.get('categoria')
    situacao = request.args.get('situacao', 'aprovado')  # Por padrão, mostra apenas aprovados
    
    # Constrói a consulta SQL com os filtros
    query = """
        SELECT u.id_usuario, u.nome, u.email, u.tipo_usuario, u.genero, 
               u.situacao, u.data_criacao, a.qualificacao
        FROM usuario u
        JOIN atendente a ON u.id_usuario = a.id_usuario
        WHERE u.tipo_usuario = 'atendente'
    """
    params = []
    
    if situacao:
        query += " AND u.situacao = %s"
        params.append(situacao)
    
    # Se uma categoria específica for solicitada, filtra por serviços dessa categoria
    if categoria:
        query += """
            AND EXISTS (
                SELECT 1 FROM atendente_servico ats
                JOIN servicos s ON ats.id_servico = s.id_servico
                WHERE ats.id_atendente = u.id_usuario
                AND s.categoria = %s
                AND ats.habilitado = TRUE
            )
        """
        params.append(categoria)
    
    # Executa a consulta
    atendentes = execute_query(query, params)
    
    # Para cada atendente, busca os serviços que ele oferece
    for atendente in atendentes:
        servicos = execute_query("""
            SELECT s.id_servico, s.nome, s.descricao, s.categoria, s.duracao
            FROM atendente_servico ats
            JOIN servicos s ON ats.id_servico = s.id_servico
            WHERE ats.id_atendente = %s
            AND ats.habilitado = TRUE
        """, (atendente['id_usuario'],))
        
        atendente['servicos'] = servicos
        
        # Busca a média de avaliações
        media = execute_query("""
            SELECT calcular_nota_media(%s) as media
        """, (atendente['id_usuario'],), fetch_all=False)
        
        atendente['avaliacao_media'] = float(media['media']) if media else 0
    
    return jsonify({
        'message': 'Atendentes listados com sucesso!',
        'atendentes': atendentes
    }), 200

@atendentes_bp.route('/pendentes', methods=['GET'])
@admin_required
def get_atendentes_pendentes():
    """Rota para listar atendentes pendentes de aprovação (apenas para administradores)."""
    # Busca os atendentes pendentes
    atendentes = execute_query("""
        SELECT u.id_usuario, u.nome, u.email, u.cpf, u.genero, 
               u.data_criacao, a.qualificacao
        FROM usuario u
        JOIN atendente a ON u.id_usuario = a.id_usuario
        WHERE u.tipo_usuario = 'atendente'
        AND u.situacao = 'pendente'
    """)
    
    return jsonify({
        'message': 'Atendentes pendentes listados com sucesso!',
        'atendentes': atendentes
    }), 200

@atendentes_bp.route('/<int:id>/aprovar', methods=['POST'])
@admin_required
def aprovar_atendente(id):
    """Rota para aprovar um atendente (apenas para administradores)."""
    data = request.json
    
    # Verifica se o motivo foi fornecido
    if not data or 'motivo' not in data:
        return jsonify({'message': 'Motivo da aprovação é obrigatório!'}), 400
    
    motivo = data['motivo']
    admin_id = request.user['id_usuario']
    
    # Verifica se o atendente existe e está pendente
    atendente = execute_query("""
        SELECT u.id_usuario, u.situacao
        FROM usuario u
        WHERE u.id_usuario = %s
        AND u.tipo_usuario = 'atendente'
    """, (id,), fetch_all=False)
    
    if not atendente:
        return jsonify({'message': 'Atendente não encontrado!'}), 404
    
    if atendente['situacao'] != 'pendente':
        return jsonify({'message': 'Este atendente já foi processado!'}), 400
    
    # Executa a procedure para aprovar o atendente
    try:
        execute_procedure('aprovar_atendente', (id, admin_id, motivo))
        
        return jsonify({
            'message': 'Atendente aprovado com sucesso!'
        }), 200
    
    except Exception as e:
        return jsonify({'message': f'Erro ao aprovar atendente: {str(e)}'}), 500

@atendentes_bp.route('/<int:id>/bloquear', methods=['POST'])
@admin_required
def bloquear_atendente(id):
    """Rota para bloquear um atendente (apenas para administradores)."""
    data = request.json
    
    # Verifica se o motivo foi fornecido
    if not data or 'motivo' not in data:
        return jsonify({'message': 'Motivo do bloqueio é obrigatório!'}), 400
    
    motivo = data['motivo']
    admin_id = request.user['id_usuario']
    
    # Verifica se o atendente existe
    atendente = execute_query("""
        SELECT u.id_usuario, u.situacao
        FROM usuario u
        WHERE u.id_usuario = %s
        AND u.tipo_usuario = 'atendente'
    """, (id,), fetch_all=False)
    
    if not atendente:
        return jsonify({'message': 'Atendente não encontrado!'}), 404
    
    # Atualiza o status do atendente para bloqueado
    update_record('usuario', {'situacao': 'bloqueado'}, {'id_usuario': id})
    
    # Registra o log de alteração de status
    insert_record('usuario_status_log', {
        'id_usuario': id,
        'novo_status': 'bloqueado',
        'id_admin': admin_id,
        'motivo': motivo
    })
    
    return jsonify({
        'message': 'Atendente bloqueado com sucesso!'
    }), 200

@atendentes_bp.route('/<int:id>/servicos', methods=['GET'])
@token_required
def get_servicos_atendente(id):
    """Rota para listar os serviços oferecidos por um atendente."""
    # Verifica se o atendente existe
    atendente = execute_query("""
        SELECT u.id_usuario
        FROM usuario u
        WHERE u.id_usuario = %s
        AND u.tipo_usuario = 'atendente'
    """, (id,), fetch_all=False)
    
    if not atendente:
        return jsonify({'message': 'Atendente não encontrado!'}), 404
    
    # Busca os serviços do atendente
    servicos = execute_query("""
        SELECT s.id_servico, s.nome, s.descricao, s.categoria, s.duracao, ats.habilitado
        FROM atendente_servico ats
        JOIN servicos s ON ats.id_servico = s.id_servico
        WHERE ats.id_atendente = %s
    """, (id,))
    
    return jsonify({
        'message': 'Serviços do atendente listados com sucesso!',
        'servicos': servicos
    }), 200

@atendentes_bp.route('/<int:id>/servicos', methods=['POST'])
@token_required
def adicionar_servico_atendente(id):
    """Rota para adicionar um serviço a um atendente."""
    # Verifica se o usuário tem permissão
    if request.user['id_usuario'] != id and request.user['tipo_usuario'] != 'admin':
        return jsonify({'message': 'Acesso negado!'}), 403
    
    data = request.json
    
    # Verifica se o ID do serviço foi fornecido
    if not data or 'id_servico' not in data:
        return jsonify({'message': 'ID do serviço é obrigatório!'}), 400
    
    id_servico = data['id_servico']
    
    # Verifica se o atendente existe
    atendente = execute_query("""
        SELECT u.id_usuario
        FROM usuario u
        WHERE u.id_usuario = %s
        AND u.tipo_usuario = 'atendente'
    """, (id,), fetch_all=False)
    
    if not atendente:
        return jsonify({'message': 'Atendente não encontrado!'}), 404
    
    # Verifica se o serviço existe
    servico = execute_query("""
        SELECT id_servico
        FROM servicos
        WHERE id_servico = %s
    """, (id_servico,), fetch_all=False)
    
    if not servico:
        return jsonify({'message': 'Serviço não encontrado!'}), 404
    
    # Verifica se o atendente já oferece este serviço
    existente = execute_query("""
        SELECT id_atendente
        FROM atendente_servico
        WHERE id_atendente = %s AND id_servico = %s
    """, (id, id_servico), fetch_all=False)
    
    if existente:
        # Atualiza para habilitado
        update_record('atendente_servico', {'habilitado': True}, {
            'id_atendente': id,
            'id_servico': id_servico
        })
        
        return jsonify({
            'message': 'Serviço atualizado com sucesso!'
        }), 200
    
    # Adiciona o serviço ao atendente
    insert_record('atendente_servico', {
        'id_atendente': id,
        'id_servico': id_servico,
        'habilitado': True
    })
    
    return jsonify({
        'message': 'Serviço adicionado com sucesso!'
    }), 201

@atendentes_bp.route('/<int:id_atendente>/servicos/<int:id_servico>', methods=['DELETE'])
@token_required
def remover_servico_atendente(id_atendente, id_servico):
    """Rota para remover um serviço de um atendente."""
    # Verifica se o usuário tem permissão
    if request.user['id_usuario'] != id_atendente and request.user['tipo_usuario'] != 'admin':
        return jsonify({'message': 'Acesso negado!'}), 403
    
    # Verifica se o atendente oferece este serviço
    existente = execute_query("""
        SELECT id_atendente
        FROM atendente_servico
        WHERE id_atendente = %s AND id_servico = %s
    """, (id_atendente, id_servico), fetch_all=False)
    
    if not existente:
        return jsonify({'message': 'Serviço não encontrado para este atendente!'}), 404
    
    # Desabilita o serviço (não remove completamente)
    update_record('atendente_servico', {'habilitado': False}, {
        'id_atendente': id_atendente,
        'id_servico': id_servico
    })
    
    return jsonify({
        'message': 'Serviço removido com sucesso!'
    }), 200