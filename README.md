# Projeto_Atendimento

Para que esse projeto funcione é necessário seguir algumas etapas:

# Modificar os dados do Banco de Dados no código

Ao abrir o config.py é importante colocar a sua senha, o seu usuário e o nome do seu banco de dados ao invés do padrão que ali está

# Criar o banco de dados

Por padrão, para esse código, esse é o código que está sendo utilizado:

-- Recriando o banco de dados
DROP DATABASE IF EXISTS site_agendamento;
CREATE DATABASE site_agendamento;
USE site_agendamento;

-- Criação das tabelas
CREATE TABLE usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('usuario','atendente','admin') NOT NULL,
    genero VARCHAR(50) NOT NULL,
    situacao ENUM('pendente', 'aprovado', 'bloqueado') DEFAULT 'pendente',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE usuario_status_log (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    novo_status ENUM('pendente', 'aprovado', 'bloqueado') NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_admin INT NOT NULL,
    motivo VARCHAR(255),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_admin) REFERENCES usuario(id_usuario)
);

CREATE TABLE notificacoes (
    id_notificacao INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE atendente (
    id_usuario INT PRIMARY KEY,
    qualificacao VARCHAR(255),
    FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE telefone(
    id_tel INT AUTO_INCREMENT PRIMARY KEY,
    telefone VARCHAR(15) NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE endereco(
    id_end INT AUTO_INCREMENT PRIMARY KEY,
    rua VARCHAR(50) NOT NULL,
    cidade VARCHAR(50) NOT NULL,
    cep VARCHAR(50) NOT NULL,
    bairro VARCHAR(50) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
);

CREATE TABLE servicos (
    id_servico INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao VARCHAR(255),
    categoria ENUM('saude','juridico','contabil','outros') NOT NULL,
    duracao INT NOT NULL,
    contagem_agendamentos INT DEFAULT 0
);

CREATE TABLE agendamento (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_atendente INT NOT NULL,
    id_servico INT NOT NULL,
    data_horario DATETIME NOT NULL,
    situacao ENUM('pendente','confirmado','cancelado') DEFAULT 'pendente',
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_atendente) REFERENCES atendente(id_usuario),
    FOREIGN KEY (id_servico) REFERENCES servicos(id_servico),
    UNIQUE (id_atendente, data_horario),
    UNIQUE (id_usuario, data_horario)
);

CREATE TABLE avaliacao (
    id_avaliacao INT AUTO_INCREMENT PRIMARY KEY,
    id_agendamento INT NOT NULL,
    nota DECIMAL(3,1),
    comentario VARCHAR(255),
    horario DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_agendamento) REFERENCES agendamento(id_agendamento)
);

CREATE TABLE atendimento(
    id_atendimento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_atendente INT NOT NULL,
    registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
    FOREIGN KEY (id_atendente) REFERENCES atendente(id_usuario),
    UNIQUE (id_usuario,id_atendente,registro)
);

CREATE TABLE atendente_servico (
    id_atendente INT NOT NULL,
    id_servico INT NOT NULL,
    habilitado BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id_atendente, id_servico),
    FOREIGN KEY (id_atendente) REFERENCES atendente(id_usuario),
    FOREIGN KEY (id_servico) REFERENCES servicos(id_servico)
);

-- Índice para melhorar a performance das consultas
CREATE INDEX idx_usuario_tipo_situacao ON usuario(tipo_usuario, situacao);

-- Trigger para aprovar automaticamente usuários comuns
DELIMITER $$
CREATE TRIGGER tg_auto_aprovar_usuarios
BEFORE INSERT ON usuario
FOR EACH ROW
BEGIN
    IF NEW.tipo_usuario = 'usuario' THEN
        SET NEW.situacao = 'aprovado';
    END IF;
END$$

-- Atualiza data_modificacao
CREATE TRIGGER tg_update_data_modificacao
BEFORE UPDATE ON usuario
FOR EACH ROW
BEGIN
    SET NEW.data_modificacao = NOW();
END$$

-- Aviso de cancelamento próximo
CREATE TRIGGER tg_aviso_cancelamento_proximo
AFTER UPDATE ON agendamento
FOR EACH ROW
BEGIN
    IF NEW.situacao = 'cancelado' AND TIMESTAMPDIFF(HOUR, NEW.data_horario, NOW()) < 24 THEN
        INSERT INTO notificacoes (id_usuario, mensagem, data_hora)
        VALUES (NEW.id_usuario, 'Seu agendamento foi cancelado menos de 24 horas antes do horário marcado.', NOW());
    END IF;
END$$

-- Incrementa contagem de agendamentos
CREATE TRIGGER tg_incrementar_contagem_agendamentos
AFTER UPDATE ON agendamento
FOR EACH ROW
BEGIN
    IF NEW.situacao = 'confirmado' AND OLD.situacao <> 'confirmado' THEN
        UPDATE servicos
        SET contagem_agendamentos = contagem_agendamentos + 1
        WHERE id_servico = NEW.id_servico;
    END IF;
END$$

-- Notificação de novo agendamento
CREATE TRIGGER tg_notificacao_novo_agendamento
AFTER INSERT ON agendamento
FOR EACH ROW
BEGIN
    INSERT INTO notificacoes (id_usuario, mensagem, data_hora)
    VALUES (NEW.id_atendente, CONCAT('Novo agendamento marcado para ', NEW.data_horario), NOW());
END$$

-- Registro de mudanças de status de usuário
CREATE TRIGGER trg_usuario_status_update
AFTER UPDATE ON usuario
FOR EACH ROW
BEGIN
    IF NEW.situacao <> OLD.situacao THEN
        -- Apenas registra se a mudança não foi feita por um procedimento
        -- (os procedimentos já registram no log)
        IF NOT EXISTS (
            SELECT 1 FROM usuario_status_log 
            WHERE id_usuario = NEW.id_usuario 
            AND novo_status = NEW.situacao 
            AND data_hora > NOW() - INTERVAL 1 SECOND
        ) THEN
            -- Usar um valor padrão para admin_id se não estiver definido
            SET @temp_admin_id = IFNULL(@admin_id, 1);
            
            INSERT INTO usuario_status_log (id_usuario, novo_status, id_admin, motivo)
            VALUES (NEW.id_usuario, NEW.situacao, @temp_admin_id, 
                   CONCAT('Alteração automática realizada em ', NOW()));
        END IF;
    END IF;
END$$
DELIMITER ;

-- Criação das views
CREATE VIEW vw_historico_atendimentos AS
SELECT 
    ag.id_agendamento,
    u.nome AS usuario,
    at.nome AS atendente,
    s.nome AS servico,
    ag.data_horario,
    ag.situacao
FROM agendamento ag
JOIN usuario u ON ag.id_usuario = u.id_usuario
JOIN usuario at ON ag.id_atendente = at.id_usuario
JOIN servicos s ON ag.id_servico = s.id_servico
WHERE ag.situacao = 'confirmado';

CREATE VIEW vw_atendentes_pendentes AS
SELECT 
    u.id_usuario,
    u.nome,
    u.email,
    u.cpf,
    u.genero,
    a.qualificacao,
    u.data_criacao,
    'pendente' as situacao
FROM usuario u
JOIN atendente a ON u.id_usuario = a.id_usuario
WHERE u.situacao = 'pendente' AND u.tipo_usuario = 'atendente';

CREATE VIEW vw_avaliacao_atendentes AS
SELECT 
    at.id_usuario,
    at.nome AS atendente,
    COALESCE(AVG(a.nota), 0) AS media_nota
FROM avaliacao a
JOIN agendamento ag ON a.id_agendamento = ag.id_agendamento
JOIN usuario at ON ag.id_atendente = at.id_usuario
GROUP BY at.id_usuario, at.nome;

CREATE VIEW vw_servicos_populares AS
SELECT 
    s.id_servico,
    s.nome AS servico,
    COUNT(ag.id_agendamento) AS total_agendamentos
FROM agendamento ag
JOIN servicos s ON ag.id_servico = s.id_servico
GROUP BY s.id_servico, s.nome
ORDER BY total_agendamentos DESC;

CREATE VIEW vw_agendamentos_completos AS
SELECT 
    ag.id_agendamento,
    u.nome AS nome_usuario,
    at.nome AS nome_atendente,
    s.nome AS nome_servico,
    ag.data_horario,
    ag.situacao
FROM agendamento ag
JOIN usuario u ON ag.id_usuario = u.id_usuario
JOIN usuario at ON ag.id_atendente = at.id_usuario
JOIN servicos s ON ag.id_servico = s.id_servico;

CREATE VIEW vw_servicos_por_atendente AS
SELECT
    asv.id_atendente,
    u.nome AS nome_atendente,
    s.nome AS nome_servico,
    asv.habilitado
FROM atendente_servico asv
JOIN usuario u ON asv.id_atendente = u.id_usuario
JOIN servicos s ON asv.id_servico = s.id_servico;

CREATE VIEW vw_admin_atendentes_pendentes AS
SELECT 
    u.id_usuario,
    u.nome,
    u.email,
    u.cpf,
    u.genero,
    a.qualificacao,
    u.data_criacao,
    (SELECT COUNT(*) FROM usuario_status_log WHERE id_usuario = u.id_usuario) AS total_alteracoes
FROM usuario u
JOIN atendente a ON u.id_usuario = a.id_usuario
WHERE u.situacao = 'pendente' AND u.tipo_usuario = 'atendente'
ORDER BY u.data_criacao DESC;

-- Configuração para funções
SET GLOBAL log_bin_trust_function_creators = 1;

-- Criação das funções
DELIMITER $$
CREATE FUNCTION verificar_disponibilidade(p_data_horario DATETIME, p_id_usuario INT, p_id_atendente INT)
RETURNS BOOLEAN
NOT deterministic
READS sql data
BEGIN
    DECLARE disponivel BOOLEAN;
    
    SELECT COUNT(*) = 0 INTO disponivel
    FROM agendamento
    WHERE data_horario = p_data_horario
    AND (id_usuario = p_id_usuario OR id_atendente = p_id_atendente)
    AND situacao IN ('pendente', 'confirmado');
    
    RETURN disponivel;
END$$

CREATE FUNCTION contar_agendamentos(p_id_usuario INT, p_status ENUM('pendente', 'confirmado', 'cancelado'))
RETURNS INT
NOT deterministic
reads sql data
BEGIN
    DECLARE contagem INT;

    SELECT COUNT(*)
    INTO contagem
    FROM agendamento
    WHERE id_usuario = p_id_usuario
    AND situacao = p_status;

    RETURN contagem;
END$$

CREATE FUNCTION calcular_nota_media(p_id_atendente INT)
RETURNS DECIMAL(3,2)
NOT deterministic
reads sql data
BEGIN
    DECLARE media DECIMAL(3,2);

    SELECT COALESCE(AVG(a.nota), 0)
    INTO media
    FROM avaliacao a
    JOIN agendamento ag ON a.id_agendamento = ag.id_agendamento
    WHERE ag.id_atendente = p_id_atendente;

    RETURN media;
END$$

CREATE FUNCTION nome_servico(p_id_servico INT)
RETURNS VARCHAR(50)
deterministic
reads sql data
BEGIN
    DECLARE nome VARCHAR(50);

    SELECT s.nome
    INTO nome
    FROM servicos s
    WHERE s.id_servico = p_id_servico;

    RETURN nome;
END$$

CREATE FUNCTION is_admin(p_id_usuario INT)
RETURNS BOOLEAN
deterministic
reads sql data
BEGIN
    DECLARE eh_admin BOOLEAN;

    SELECT tipo_usuario = 'admin'
    INTO eh_admin
    FROM usuario
    WHERE id_usuario = p_id_usuario;

    RETURN eh_admin;
END$$
DELIMITER ;

-- Criação dos procedimentos
DELIMITER //
CREATE PROCEDURE criar_agendamento(
    IN p_id_usuario INT,
    IN p_id_atendente INT,
    IN p_id_servico INT,
    IN p_data_horario DATETIME
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    -- Verifica disponibilidade de atendente
    SELECT COUNT(*) INTO v_count
    FROM agendamento
    WHERE id_atendente = p_id_atendente AND data_horario = p_data_horario;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Atendente já possui agendamento neste horário.';
    END IF;

    -- Verifica disponibilidade de usuário
    SELECT COUNT(*) INTO v_count
    FROM agendamento
    WHERE id_usuario = p_id_usuario AND data_horario = p_data_horario;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Usuário já possui agendamento neste horário.';
    END IF;

    -- Insere agendamento
    INSERT INTO agendamento (id_usuario, id_atendente, id_servico, data_horario)
    VALUES (p_id_usuario, p_id_atendente, p_id_servico, p_data_horario);

    -- Retorna ID do novo agendamento
    SELECT LAST_INSERT_ID() AS novo_agendamento_id;
END //

CREATE PROCEDURE cancelar_agendamento(
    IN p_id_agendamento INT,
    IN motivo VARCHAR(255)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    UPDATE agendamento
    SET situacao = 'cancelado'
    WHERE id_agendamento = p_id_agendamento;

    SELECT ROW_COUNT() INTO v_count;
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Agendamento não encontrado ou já cancelado.';
    END IF;

    -- Log opcional para histórico
    INSERT INTO usuario_status_log (id_usuario, novo_status, motivo, data_hora)
    VALUES ((SELECT id_usuario FROM agendamento WHERE id_agendamento = p_id_agendamento), 'cancelado', motivo, NOW());

    SELECT ROW_COUNT() AS rows_updated;
END //

CREATE PROCEDURE inserir_avaliacao(
    IN p_id_agendamento INT,
    IN p_nota DECIMAL(3,1),
    IN p_comentario VARCHAR(255)
)
BEGIN
    DECLARE v_count INT DEFAULT 0;

    -- Verifica avaliação duplicada
    SELECT COUNT(*) INTO v_count
    FROM avaliacao
    WHERE id_agendamento = p_id_agendamento;
    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Avaliação já registrada para este agendamento.';
    END IF;

    -- Insere avaliação
    INSERT INTO avaliacao (id_agendamento, nota, comentario)
    VALUES (p_id_agendamento, p_nota, p_comentario);

    SELECT LAST_INSERT_ID() AS nova_avaliacao_id;
END //

CREATE PROCEDURE atualizar_atendimento(
    IN p_id_atendimento INT,
    IN p_id_usuario INT,
    IN p_id_atendente INT
)
BEGIN
    UPDATE atendimento
    SET id_usuario = p_id_usuario, id_atendente = p_id_atendente, registro = NOW()
    WHERE id_atendimento = p_id_atendimento;
END //

CREATE PROCEDURE gerenciar_servico(
    IN p_id_atendente INT,
    IN p_id_servico INT,
    IN p_habilitar BOOLEAN
)
BEGIN
    UPDATE atendente_servico
    SET habilitado = p_habilitar
    WHERE id_atendente = p_id_atendente AND id_servico = p_id_servico;
END //

CREATE PROCEDURE aprovar_atendente(
    IN pid_atendente INT,
    IN pid_admin INT,
    IN pmotivo VARCHAR(255)
)
BEGIN
    -- Verificar se o usuário é um atendente
    DECLARE v_tipo VARCHAR(10);
    SELECT tipo_usuario INTO v_tipo FROM usuario WHERE id_usuario = pid_atendente;
    
    IF v_tipo != 'atendente' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Apenas atendentes podem ser aprovados por este procedimento.';
    END IF;
    
    -- Atualizar status para aprovado
    UPDATE usuario SET situacao = 'aprovado' WHERE id_usuario = pid_atendente;

    -- Registrar no log
    INSERT INTO usuario_status_log (id_usuario, novo_status, id_admin, motivo, data_hora)
    VALUES (pid_atendente, 'aprovado', pid_admin, pmotivo, NOW());
    
    -- Enviar notificação ao atendente
    INSERT INTO notificacoes (id_usuario, mensagem, data_hora)
    VALUES (pid_atendente, 'Seu cadastro como atendente foi aprovado. Você já pode oferecer seus serviços.', NOW());
END //

CREATE PROCEDURE reprovar_atendente(
    IN pid_atendente INT,
    IN pid_admin INT,
    IN pmotivo VARCHAR(255)
)
BEGIN
    -- Verificar se o usuário é um atendente
    DECLARE v_tipo VARCHAR(10);
    SELECT tipo_usuario INTO v_tipo FROM usuario WHERE id_usuario = pid_atendente;
    
    IF v_tipo != 'atendente' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Apenas atendentes podem ser reprovados por este procedimento.';
    END IF;
    
    -- Atualizar status para bloqueado
    UPDATE usuario SET situacao = 'bloqueado' WHERE id_usuario = pid_atendente;

    -- Registrar no log
    INSERT INTO usuario_status_log (id_usuario, novo_status, id_admin, motivo, data_hora)
    VALUES (pid_atendente, 'bloqueado', pid_admin, pmotivo, NOW());
    
    -- Enviar notificação ao atendente
    INSERT INTO notificacoes (id_usuario, mensagem, data_hora)
    VALUES (pid_atendente, CONCAT('Seu cadastro como atendente foi reprovado. Motivo: ', pmotivo), NOW());
END //
DELIMITER ;

-- Inserção de dados iniciais
INSERT INTO usuario (nome, cpf, email, senha, tipo_usuario, genero, situacao) VALUES 
('Admin Sistema', '000.000.000-00', 'admin@sistema.com', '$2b$12$1xxxxxxxxxxxxxxxxxxxxuxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'admin', 'outro', 'aprovado');

-- Exemplos de inserção (opcional)
INSERT INTO usuario (nome, cpf, email, senha, tipo_usuario, genero) VALUES 
('João Silva', '123.456.789-00', 'joao@example.com', 'senha123', 'usuario', 'masculino'),
('Maria Souza', '987.654.321-00', 'maria@example.com', 'senha456', 'atendente', 'feminino');

INSERT INTO atendente (id_usuario, qualificacao) VALUES 
((SELECT id_usuario FROM usuario WHERE email = 'maria@example.com'), 'Especialista em Saúde');

INSERT INTO servicos (nome, descricao, categoria, duracao) VALUES 
('Consulta Médica', 'Consulta clínica geral', 'saude', 30);

-- Verificação dos usuários
SELECT id_usuario, nome, email, tipo_usuario, situacao FROM usuario;

-- Transformar um usuário específico em admin (substitua X pelo ID do usuário)
UPDATE usuario 
SET tipo_usuario = 'admin', situacao = 'aprovado' 
WHERE id_usuario = 1;

-- Verificação dos atendentes pendentes
SELECT * FROM vw_atendentes_pendentes;

-- Verificação da view para o painel de administrador
SELECT * FROM vw_admin_atendentes_pendentes;

# Não esquecer de dar run no app.py
Não é usando o index.html, se for rodar ele, a API não irá funcionar; tem que rodar a API usando o app.py e acessar o http://localhost:5000 ou o local onde for hospedado seu código
