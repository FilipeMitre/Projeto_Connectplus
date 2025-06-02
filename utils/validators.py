import re
from flask import jsonify
from datetime import datetime

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

def validate_user_data(data, is_update=False, user_type='CLIENTE'):
    """Valida os dados do usuário (tabela usuario)."""
    errors = {}
    
    # Campos obrigatórios para criação
    if not is_update:
        required_fields = ['nome_completo', 'cpf', 'email', 'senha', 'tipo_usuario']
        for field in required_fields:
            if field not in data or not data[field]:
                errors[field] = f'O campo {field} é obrigatório.'
        
        if 'tipo_usuario' in data and data['tipo_usuario'] not in ['CLIENTE', 'ATENDENTE', 'ADMIN']:
            errors['tipo_usuario'] = 'Tipo de usuário inválido (CLIENTE, ATENDENTE, ADMIN).'
        
        if 'senha' in data and data['senha'] and not validate_senha(data['senha']): # Supondo que validate_senha existe
            errors['senha'] = 'A senha deve ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula e um número.'

    if 'email' in data and data['email']:
        if not validate_email(data['email']): # Supondo que validate_email existe
            errors['email'] = 'Email inválido.'
    
    if 'cpf' in data and data['cpf']:
        if not validate_cpf(data['cpf']): # Supondo que validate_cpf existe
            errors['cpf'] = 'CPF inválido.'

    # Validações opcionais de identidade
    allowed_identidades = [
        'MULHER_CIS', 'HOMEM_CIS', 'MULHER_TRANS', 'HOMEM_TRANS', 
        'NAO_BINARIE', 'AGENERO', 'GENERO_FLUIDO', 'TRAVESTI',
        'OUTRA_IDENTIDADE', 'PREFIRO_NAO_DECLARAR_GENERO', None, '' # Permite nulo ou vazio
    ]
    if 'identidade_genero' in data and data.get('identidade_genero') not in allowed_identidades:
        errors['identidade_genero'] = 'Identidade de gênero inválida.'

    allowed_orientacoes = [
        'ASSEXUAL', 'BISSEXUAL', 'HETEROSSEXUAL', 'LESBICA', 'GAY', 
        'PANSEXUAL', 'QUEER', 'OUTRA_ORIENTACAO', 
        'PREFIRO_NAO_DECLARAR_ORIENTACAO', None, '' # Permite nulo ou vazio
    ]
    if 'orientacao_sexual' in data and data.get('orientacao_sexual') not in allowed_orientacoes:
        errors['orientacao_sexual'] = 'Orientação sexual inválida.'

    if 'data_nascimento' in data and data['data_nascimento']:
        try:
            datetime.strptime(data['data_nascimento'], '%Y-%m-%d')
        except ValueError:
            errors['data_nascimento'] = 'Formato de data de nascimento inválido. Use YYYY-MM-DD.'
            
    return errors

def validate_telefone_data(data, is_update=False):
    errors = {}
    if not is_update: # Para criação, um telefone é geralmente esperado
        if 'numero_telefone' not in data or not data['numero_telefone']:
            errors['numero_telefone'] = 'Número de telefone é obrigatório.'
    
    if 'numero_telefone' in data and data['numero_telefone']:
        if not validate_telefone(data['numero_telefone']): # Supondo que validate_telefone existe
            errors['numero_telefone'] = 'Número de telefone inválido.'
    
    if 'tipo_telefone' in data and data['tipo_telefone'] not in ['CELULAR', 'RESIDENCIAL', 'COMERCIAL', 'OUTRO', None, '']:
        errors['tipo_telefone'] = 'Tipo de telefone inválido.'
    return errors

def validate_endereco_data(data, is_update=False):
    errors = {}
    required_fields_endereco = ['logradouro', 'numero', 'bairro', 'cidade', 'estado', 'cep']
    if not is_update:
        for field in required_fields_endereco:
            if field not in data or not data[field]:
                errors[field] = f'O campo de endereço {field} é obrigatório.'
    
    if 'cep' in data and data['cep']:
        cep_limpo = re.sub(r'[^0-9]', '', data['cep'])
        if len(cep_limpo) != 8:
            errors['cep'] = 'CEP deve conter 8 dígitos.'
            
    if 'estado' in data and data['estado'] and len(data['estado']) != 2:
        errors['estado'] = 'Estado (UF) deve ter 2 caracteres.'

    if 'tipo_endereco' in data and data['tipo_endereco'] not in ['RESIDENCIAL', 'COMERCIAL', 'ATENDIMENTO', 'OUTRO', None, '']:
        errors['tipo_endereco'] = 'Tipo de endereço inválido.'
    return errors

def validate_atendente_detalhes_data(data, is_update=False):
    """Valida os dados de atendente_detalhes."""
    errors = {}
    required_fields = ['area_atuacao', 'qualificacao_descricao', 'duracao_padrao_atendimento_min']
    
    if not is_update:
        for field in required_fields:
            if field not in data or data[field] is None or str(data[field]).strip() == "":
                errors[field] = f'O campo {field} é obrigatório para atendentes.'
    
    allowed_areas = ['SAUDE', 'JURIDICO', 'CARREIRA', 'CONTABIL', 'ASSISTENCIA_SOCIAL']
    if 'area_atuacao' in data and data['area_atuacao'] not in allowed_areas:
        errors['area_atuacao'] = f'Área de atuação inválida. Permitidas: {", ".join(allowed_areas)}'

    if 'anos_experiencia' in data and data['anos_experiencia'] is not None:
        try:
            if int(data['anos_experiencia']) < 0:
                errors['anos_experiencia'] = 'Anos de experiência não podem ser negativos.'
        except ValueError:
            errors['anos_experiencia'] = 'Anos de experiência deve ser um número.'
            
    if 'duracao_padrao_atendimento_min' in data and data['duracao_padrao_atendimento_min'] is not None:
        try:
            if int(data['duracao_padrao_atendimento_min']) <= 0:
                errors['duracao_padrao_atendimento_min'] = 'Duração padrão do atendimento deve ser positiva.'
        except ValueError:
            errors['duracao_padrao_atendimento_min'] = 'Duração padrão do atendimento deve ser um número.'

    if 'curriculo_link' in data and data['curriculo_link']:
        # Simple URL validation (can be more robust)
        if not re.match(r'^https?://', data['curriculo_link']):
            errors['curriculo_link'] = 'Link do currículo parece inválido.'
            
    return errors

def validate_agendamento_data(data, is_update=False):
    """Valida os dados do agendamento."""
    errors = {}
    
    required_fields = ['id_cliente', 'id_atendente', 'data_hora_inicio', 'duracao_minutos', 'modalidade']
    if not is_update:
        for field in required_fields:
            if field not in data or data[field] is None: # Check for None as well
                errors[field] = f'O campo {field} é obrigatório.'
    
    if 'data_hora_inicio' in data and data['data_hora_inicio']:
        try:
            # Espera formato YYYY-MM-DDTHH:MM:SS (ISO-like) do frontend
            agendamento_dt = datetime.fromisoformat(data['data_hora_inicio'])
            if not is_update and agendamento_dt < datetime.now():
                errors['data_hora_inicio'] = 'Não é possível agendar no passado.'
        except ValueError:
            errors['data_hora_inicio'] = 'Formato de data e hora inválido. Use YYYY-MM-DDTHH:MM:SS'
    
    if 'duracao_minutos' in data and data['duracao_minutos'] is not None:
        try:
            if int(data['duracao_minutos']) <= 0:
                errors['duracao_minutos'] = 'Duração deve ser positiva.'
        except ValueError:
            errors['duracao_minutos'] = 'Duração deve ser um número.'
            
    if 'modalidade' in data and data['modalidade'] not in ['ONLINE', 'PRESENCIAL']:
        errors['modalidade'] = 'Modalidade inválida (ONLINE ou PRESENCIAL).'
        
    return errors

def validate_avaliacao_data(data):
    """Valida os dados da avaliação."""
    errors = {}
    
    required_fields = ['id_agendamento', 'id_avaliador', 'id_avaliado', 'nota'] # id_avaliador e id_avaliado virão do sistema
    for field in ['id_agendamento', 'nota']: # Apenas checa os que vêm do payload
        if field not in data or data[field] is None:
            errors[field] = f'O campo {field} é obrigatório.'
    
    if 'nota' in data and data['nota'] is not None:
        try:
            nota = int(data['nota']) # Nota deve ser inteiro
            if not (1 <= nota <= 5):
                errors['nota'] = 'A nota deve estar entre 1 e 5.'
        except ValueError:
            errors['nota'] = 'A nota deve ser um número inteiro.'
    return errors