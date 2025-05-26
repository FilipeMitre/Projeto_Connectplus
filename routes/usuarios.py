from flask import Blueprint, request, jsonify
from utils.db import execute_query, insert_record, update_record, delete_record
from utils.auth import token_required, admin_required, hash_password
from utils.validators import validate_user_data

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('', methods=['GET'])
@admin_required
def get_usuarios():
    """Rota para listar todos os usuários (apenas para administradores)."""
    # Parâmetros de filtro
    tipo = request.args.get('tipo')
    situacao = request.args.get('situacao')
    
    # Constrói a consulta SQL com os filtros
    query = """
        SELECT u.id_usuario, u.nome, u.email, u.cpf, u.tipo_usuario, u.genero, 
               u.situacao, u.data_criacao, u.data_modificacao
        FROM usuario u
        WHERE 1=1
    """
    params = []
    
    if tipo:
        query += " AND u.tipo_usuario = %s"
        params.append(tipo)
    
    if situacao:
        query += " AND u.situacao = %s"
        params.append(situacao)
    
    # Executa a consulta
    usuarios = execute_query(query, params)
    
    return jsonify({
        'message': 'Usuários listados com sucesso!',
        'usuarios': usuarios
    }), 200

@usuarios_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_usuario(id):
    """Rota para obter detalhes de um usuário específico."""
    # Verifica se o usuário tem permissão para acessar esses dados
    if request.user['id_usuario'] != id and request.user['tipo_usuario'] != 'admin':
        return jsonify({'message': 'Acesso negado!'}), 403
    
    # Busca os dados do usuário
    usuario = execute_query("""
        SELECT u.id_usuario, u.nome, u.email, u.cpf, u.tipo_usuario, u.genero, 
               u.situacao, u.data_criacao, u.data_modificacao
        FROM usuario u
        WHERE u.id_usuario = %s
    """, (id,), fetch_all=False)
    
    if not usuario:
        return jsonify({'message': 'Usuário não encontrado!'}), 404
    
    # Busca o telefone do usuário
    telefone = execute_query("""
        SELECT id_tel, telefone
        FROM telefone
        WHERE id_usuario = %s
    """, (id,), fetch_all=False)
    
    # Busca o endereço do usuário
    endereco = execute_query("""
        SELECT id_end, rua, cidade, cep, bairro, numero
        FROM endereco
        WHERE id_usuario = %s
    """, (id,), fetch_all=False)
    
    # Busca qualificação se for atendente
    qualificacao = None
    if usuario['tipo_usuario'] == 'atendente':
        atendente = execute_query("""
            SELECT qualificacao
            FROM atendente
            WHERE id_usuario = %s
        """, (id,), fetch_all=False)
        
        if atendente:
            qualificacao = atendente['qualificacao']
    
    # Adiciona os dados adicionais ao objeto do usuário
    usuario['telefone'] = telefone['telefone'] if telefone else None
    usuario['endereco'] = endereco if endereco else None
    usuario['qualificacao'] = qualificacao
    
    return jsonify({
        'message': 'Usuário encontrado com sucesso!',
        'usuario': usuario
    }), 200

@usuarios_bp.route('/<int:id>', methods=['PUT'])
@token_required
def update_usuario(id):
    """Rota para atualizar os dados de um usuário."""
    # Verifica se o usuário tem permissão para atualizar esses dados
    if request.user['id_usuario'] != id and request.user['tipo_usuario'] != 'admin':
        return jsonify({'message': 'Acesso negado!'}), 403
    
    data = request.json
    
    # Valida os dados do usuário
    errors = validate_user_data(data, is_update=True)
    if errors:
        return jsonify({'message': 'Dados inválidos!', 'errors': errors}), 400
    
    # Verifica se o usuário existe
    usuario = execute_query(
        "SELECT id_usuario, tipo_usuario FROM usuario WHERE id_usuario = %s",
        (id,),
        fetch_all=False
    )
    
    if not usuario:
        return jsonify({'message': 'Usuário não encontrado!'}), 404
    
    # Prepara os dados para atualização
    update_data = {}
    
    # Campos que podem ser atualizados
    allowed_fields = ['nome', 'email', 'genero']
    for field in allowed_fields:
        if field in data and data[field]:
            update_data[field] = data[field]
    
    # Se for uma atualização de senha
    if 'senha' in data and data['senha']:
        update_data['senha'] = hash_password(data['senha'])
    
    # Atualiza os dados do usuário
    if update_data:
        rows_updated = update_record('usuario', update_data, {'id_usuario': id})
        
        if rows_updated == 0:
            return jsonify({'message': 'Nenhum dado foi atualizado!'}), 400
    
    # Atualiza o telefone, se fornecido
    if 'telefone' in data and data['telefone']:
        # Verifica se já existe um telefone para este usuário
        telefone = execute_query(
            "SELECT id_tel FROM telefone WHERE id_usuario = %s",
            (id,),
            fetch_all=False
        )
        
        if telefone:
            # Atualiza o telefone existente
            update_record('telefone', {'telefone': data['telefone']}, {'id_usuario': id})
        else:
            # Insere um novo telefone
            insert_record('telefone', {'telefone': data['telefone'], 'id_usuario': id})
    
    # Atualiza o endereço, se todos os campos necessários forem fornecidos
    endereco_fields = ['rua', 'cidade', 'cep', 'bairro', 'numero']
    if all(field in data for field in endereco_fields):
        # Verifica se já existe um endereço para este usuário
        endereco = execute_query(
            "SELECT id_end FROM endereco WHERE id_usuario = %s",
            (id,),
            fetch_all=False
        )
        
        endereco_data = {
            'rua': data['rua'],
            'cidade': data['cidade'],
            'cep': data['cep'],
            'bairro': data['bairro'],
            'numero': data['numero']
        }
        
        if endereco:
            # Atualiza o endereço existente
            update_record('endereco', endereco_data, {'id_usuario': id})
        else:
            # Insere um novo endereço
            endereco_data['id_usuario'] = id
            insert_record('endereco', endereco_data)
    
    # Atualiza a qualificação, se for um atendente
    if usuario['tipo_usuario'] == 'atendente' and 'qualificacao' in data:
        update_record('atendente', {'qualificacao': data['qualificacao']}, {'id_usuario': id})
    
    return jsonify({
        'message': 'Usuário atualizado com sucesso!'
    }), 200

@usuarios_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_usuario(id):
    """Rota para excluir um usuário (apenas para administradores)."""
    # Verifica se o usuário existe
    usuario = execute_query(
        "SELECT id_usuario FROM usuario WHERE id_usuario = %s",
        (id,),
        fetch_all=False
    )
    
    if not usuario:
        return jsonify({'message': 'Usuário não encontrado!'}), 404
    
    # Em um sistema real, geralmente não excluímos usuários, apenas os desativamos
    # Aqui, vamos bloquear o usuário em vez de excluí-lo
    rows_updated = update_record('usuario', {'situacao': 'bloqueado'}, {'id_usuario': id})
    
    if rows_updated == 0:
        return jsonify({'message': 'Erro ao bloquear usuário!'}), 500
    
    return jsonify({
        'message': 'Usuário bloqueado com sucesso!'
    }), 200

@usuarios_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Rota para obter os dados do usuário logado."""
    user_id = request.user['id_usuario']
    
    # Busca os dados do usuário
    usuario = execute_query("""
        SELECT u.id_usuario, u.nome, u.email, u.cpf, u.tipo_usuario, u.genero, 
               u.situacao, u.data_criacao, u.data_modificacao
        FROM usuario u
        WHERE u.id_usuario = %s
    """, (user_id,), fetch_all=False)
    
    # Busca o telefone do usuário
    telefone = execute_query("""
        SELECT id_tel, telefone
        FROM telefone
        WHERE id_usuario = %s
    """, (user_id,), fetch_all=False)
    
    # Busca o endereço do usuário
    endereco = execute_query("""
        SELECT id_end, rua, cidade, cep, bairro, numero
        FROM endereco
        WHERE id_usuario = %s
    """, (user_id,), fetch_all=False)
    
    # Busca qualificação se for atendente
    qualificacao = None
    if usuario['tipo_usuario'] == 'atendente':
        atendente = execute_query("""
            SELECT qualificacao
            FROM atendente
            WHERE id_usuario = %s
        """, (user_id,), fetch_all=False)
        
        if atendente:
            qualificacao = atendente['qualificacao']
    
    # Adiciona os dados adicionais ao objeto do usuário
    usuario['telefone'] = telefone['telefone'] if telefone else None
    usuario['endereco'] = endereco if endereco else None
    usuario['qualificacao'] = qualificacao
    
    return jsonify({
        'message': 'Dados do usuário obtidos com sucesso!',
        'usuario': usuario
    }), 200