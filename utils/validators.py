import re
from flask import jsonify

def validate_email(email):
    """Valida o formato do email."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_cpf(cpf):
    """Valida o formato do CPF."""
    # Remove caracteres não numéricos
    cpf = re.sub(r'[^0-9]', '', cpf)
    
    # Verifica se tem 11 dígitos
    if len(cpf) != 11:
        return False
    
    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False
    
    # Valida o primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf[i]) * (10 - i)
    resto = soma % 11
    if resto < 2:
        dv1 = 0
    else:
        dv1 = 11 - resto
    
    if int(cpf[9]) != dv1:
        return False
    
    # Valida o segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf[i]) * (11 - i)
    resto = soma % 11
    if resto < 2:
        dv2 = 0
    else:
        dv2 = 11 - resto
    
    return int(cpf[10]) == dv2

def validate_telefone(telefone):
    """Valida o formato do telefone."""
    # Remove caracteres não numéricos
    telefone = re.sub(r'[^0-9]', '', telefone)
    
    # Verifica se tem entre 10 e 11 dígitos (com ou sem DDD)
    return 10 <= len(telefone) <= 11

def validate_senha(senha):
    """Valida a força da senha."""
    # Verifica se tem pelo menos 8 caracteres
    if len(senha) < 8:
        return False
    
    # Verifica se tem pelo menos uma letra maiúscula, uma minúscula e um número
    if not re.search(r'[A-Z]', senha):
        return False
    if not re.search(r'[a-z]', senha):
        return False
    if not re.search(r'[0-9]', senha):
        return False
    
    return True

def validate_user_data(data, is_update=False):
    """Valida os dados do usuário."""
    errors = {}
    
    # Campos obrigatórios apenas para criação
    if not is_update:
        required_fields = ['nome', 'cpf', 'email', 'senha', 'tipo_usuario', 'genero']
        for field in required_fields:
            if field not in data or not data[field]:
                errors[field] = f'O campo {field} é obrigatório'
    
    # Validações específicas
    if 'email' in data and data['email'] and not validate_email(data['email']):
        errors['email'] = 'Email inválido'
    
    if 'cpf' in data and data['cpf'] and not validate_cpf(data['cpf']):
        errors['cpf'] = 'CPF inválido'
    
    if 'senha' in data and data['senha'] and not validate_senha(data['senha']):
        errors['senha'] = 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número'
    
    if 'tipo_usuario' in data and data['tipo_usuario'] not in ['usuario', 'atendente', 'admin']:
        errors['tipo_usuario'] = 'Tipo de usuário inválido'
    
    if 'genero' in data and data['genero'] not in ['masculino', 'feminino', 'outro', 'prefiro_nao_informar']:
        errors['genero'] = 'Gênero inválido'
    
    return errors

def validate_agendamento_data(data):
    """Valida os dados do agendamento."""
    errors = {}
    
    required_fields = ['id_usuario', 'id_atendente', 'id_servico', 'data_horario']
    for field in required_fields:
        if field not in data or not data[field]:
            errors[field] = f'O campo {field} é obrigatório'
    
    # Validação da data e hora
    if 'data_horario' in data and data['data_horario']:
        try:
            # Verifica se está no formato correto (YYYY-MM-DD HH:MM:SS)
            datetime_pattern = r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$'
            if not re.match(datetime_pattern, data['data_horario']):
                errors['data_horario'] = 'Formato de data e hora inválido. Use YYYY-MM-DD HH:MM:SS'
        except ValueError:
            errors['data_horario'] = 'Data e hora inválidas'
    
    return errors

def validate_servico_data(data):
    """Valida os dados do serviço."""
    errors = {}
    
    required_fields = ['nome', 'categoria', 'duracao']
    for field in required_fields:
        if field not in data or not data[field]:
            errors[field] = f'O campo {field} é obrigatório'
    
    if 'categoria' in data and data['categoria'] not in ['saude', 'juridico', 'contabil', 'outros']:
        errors['categoria'] = 'Categoria inválida'
    
    if 'duracao' in data and data['duracao']:
        try:
            duracao = int(data['duracao'])
            if duracao <= 0:
                errors['duracao'] = 'A duração deve ser um número positivo'
        except ValueError:
            errors['duracao'] = 'A duração deve ser um número'
    
    return errors

def validate_avaliacao_data(data):
    """Valida os dados da avaliação."""
    errors = {}
    
    required_fields = ['id_agendamento', 'nota']
    for field in required_fields:
        if field not in data or data[field] is None:
            errors[field] = f'O campo {field} é obrigatório'
    
    if 'nota' in data and data['nota'] is not None:
        try:
            nota = float(data['nota'])
            if nota < 0 or nota > 5:
                errors['nota'] = 'A nota deve estar entre 0 e 5'
        except ValueError:
            errors['nota'] = 'A nota deve ser um número'
    
    return errors