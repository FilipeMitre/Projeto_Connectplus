/// <reference types="cypress"/>

import { LoginPage } from './Login';

import { CadastroPage } from './Cadastro';
const loginPage = new LoginPage();
const cadastroPage = new CadastroPage();
const emailCerto = 'lucascliente@cliente.com'
const emailNovo = 'kauaastete0@gmail.com'
const emailErrado = 'XXXXXXXXXXXXXXXXX@XXXX.XXX'
const senhaCerta = 'Naruto17@'
const senhaErrada = 'XXXXXXXX'
const nome = 'Lucas Pereira da silva'
const nomesoc = 'Lucas'
const cpfCerto = '87712164053'
const cpfNovo = '08152132551'
const cpfErrado = '1111111111'
const cepCerto = '41620835'
const cepErrado = 'XXXXXXX'
const numero = '45'
const dataNasc = '1995-10-15'
const tellCerto = '71983810269'
const tellErrado = '99999999999999'
const pronome = 'ele/dele'

describe('Testes Frontend Connect+ Cadastro', () => {
    it('Fluxo de cadastro correto', () =>{
        cadastroPage.acessar()
        cadastroPage.preencherNome(nome)
        cadastroPage.preencherNomesoc(nomesoc)
        cadastroPage.preencherEmail(emailCerto)
        cadastroPage.preencherSenha(senhaCerta)
        cadastroPage.preencherConfsenha(senhaCerta)
        cadastroPage.preencherCpf(cpfCerto)
        cadastroPage.preencherDataNasc(dataNasc)
        cadastroPage.preencherTell(tellCerto)
        cadastroPage.preencherCep(cepCerto)
        cadastroPage.preencherNum(numero)
        cadastroPage.preencherPronome(pronome)
        cy.get('[name="identidade_genero"]').select('HOMEM_CIS');
        cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL');
        cy.get('[name="termos_uso"]').check();
        cy.wait(1000)
        cadastroPage.submeter()
        cy.wait(1000)
        cy.url().should('eq', 'http://localhost:5000/static/login/login.html')

    })

    it('Fluxo de cadastro Nome Vazio', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()
    
    // Busca o primeiro input do formulário (Nome Completo)
    cy.get('input').first().then(($input) => {
        // Valida que tem mensagem de validação
        expect($input[0].validationMessage).to.not.be.empty
        // Ou valida o texto específico (pode ser em português ou inglês)
        expect($input[0].validationMessage).to.match(/Preencha|Please fill|Fill/)
    })
})

it('Fluxo de cadastro Email Vazio', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('input:invalid').should('exist')
})

 it('Fluxo de cadastro email ja em uso', () =>{
        cadastroPage.acessar()
        cadastroPage.preencherNome(nome)
        cadastroPage.preencherNomesoc(nomesoc)
        cadastroPage.preencherEmail(emailCerto)
        cadastroPage.preencherSenha(senhaCerta)
        cadastroPage.preencherConfsenha(senhaCerta)
        cadastroPage.preencherCpf(cpfCerto)
        cadastroPage.preencherDataNasc(dataNasc)
        cadastroPage.preencherTell(tellCerto)
        cadastroPage.preencherCep(cepCerto)
        cadastroPage.preencherNum(numero)
        cadastroPage.preencherPronome(pronome)
        cy.get('[name="identidade_genero"]').select('HOMEM_CIS');
        cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL');
        cy.get('[name="termos_uso"]').check();
        cy.wait(1000)
        cadastroPage.submeter()
        cy.wait(1000)
        cy.get('#form-messages').should('have.text', 'Este endereço de email já está sendo usado por outro usuário. Por favor, use um email diferente.');
        
    })

    it('Fluxo de cadastro cep Vazio', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('input:invalid').should('exist')
})

it('Fluxo de cadastro cpf Vazio', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('input:invalid').should('exist')
})

it('Fluxo de cadastro cpf errado', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCpf(cpfErrado)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('#form-messages').should('have.text', 'Dados de usuário inválidos!');
})

it('Fluxo de cadastro cpf ja existente', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCpf(cpfCerto)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('#form-messages').should('have.text', 'Este CPF já está registrado em nossa base de dados. Se você já possui uma conta, tente fazer login.');
})

it('Fluxo de cadastro numero Vazio', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaCerta)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('input:invalid').should('exist')
})

it('Fluxo de cadastro senha Vazio', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('input:invalid').should('exist')
})

it('Fluxo de cadastro senha errada', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaErrada)
    cadastroPage.preencherConfsenha(senhaErrada)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cadastroPage.submeter()

    cy.get('#form-messages').should('have.text', 'Dados de usuário inválidos!');
})
it('Fluxo de cadastro senhas diferentes', () => {
    cadastroPage.acessar()
    cadastroPage.preencherNome(nome)
    cadastroPage.preencherEmail(emailNovo)
    cadastroPage.preencherNomesoc(nomesoc)
    cadastroPage.preencherSenha(senhaCerta)
    cadastroPage.preencherConfsenha(senhaErrada)
    cadastroPage.preencherCpf(cpfNovo)
    cadastroPage.preencherCep(cepCerto)
    cadastroPage.preencherDataNasc(dataNasc)
    cadastroPage.preencherTell(tellCerto)
    cadastroPage.preencherNum(numero)
    cadastroPage.preencherPronome(pronome)
    cy.get('[name="identidade_genero"]').select('HOMEM_CIS')
    cy.get('[name="orientacao_sexual"]').select('HETEROSSEXUAL')
    cy.get('[name="termos_uso"]').check()
    cy.wait(5000)

    cadastroPage.submeter()

    cy.get('#form-messages').should('have.text', 'As senhas não coincidem.');
})

it('Fluxo de cadastro atendente correto', () => {
    cy.visit('http://localhost:5000/static/index.html')
    cy.get('a.signup-button').click();
    cy.get('button[data-tab="ATENDENTE"]').click();

    cy.get('[name="nome_completo"]').type('Marcia Castro Alves');
    cy.get('[name="nome_social"]').type('Marcia');
    cy.get('[name="email"]').type('marciaatendente@atendente.com');
    cy.get('[name="cpf"]').type('081.034.750-41');
    cy.get('[name="data_nascimento"]').type('2000-01-17');
    cy.get('[name="telefone_numero"]').type('(71) 98338-1111');
    cy.get('[name="pronomes"]').type('ela/dela');
    cy.get('[name="cep"]').type('41620-835');
    cy.get('[name="numero_endereco"]').type('35');
    cy.get('[name="area_atuacao"]').select('SAUDE');
    cy.get('[name="qualificacao_descricao"]').type('Experiência em grandes hospitais e clinicas ');
    cy.get('[name="especialidades"]').click();
    cy.get('[name="especialidades"]').type('Fonaudiologa ');
    cy.get('[name="especialidades"]').clear();
    cy.get('[name="especialidades"]').type('fonoaudiologia');
    cy.get('[name="registro_profissional"]').type('9999999');
    cy.get('[name="anos_experiencia"]').type('5');
    cy.get('[name="aceita_atendimento_presencial"]').check();
    cy.get('[name="senha"]').type('Naruto17@');
    cy.get('[name="confirmar_senha"]').type('Naruto17@');
    cy.get('[name="termos_uso"]').check();
    cy.get('#submit-cadastro-button').click();

    cy.url().should('eq', 'http://localhost:5000/static/login/login.html')
})
})

describe('Testes Frontend Connect+ Login', () => {
it('Fluxo de login com sucesso', () =>{
    Cypress.on('uncaught:exception', (err, runnable) => {
        if (err.message.includes("Cannot read properties of null (reading 'insertBefore')")) {
        return false;
}
        return true;

});

    loginPage.acessar()
    loginPage.preencherEmail(emailCerto)
    loginPage.preencherSenha(senhaCerta)
    loginPage.submeter()
    cy.url().should('eq', 'http://localhost:5000/static/cliente/meus-agendamentos.html');
})

it('Fluxo de login com email incorreto', () =>{
    loginPage.acessar()
    loginPage.preencherEmail(emailErrado)
    loginPage.preencherSenha(senhaCerta)
    cy.wait(1000)
    loginPage.submeter()
    cy.get('#login-messages').should('have.text', 'Email ou senha inválidos.')
})

it('Fluxo de login com senha incorreta', () =>{
    loginPage.acessar()
    loginPage.preencherEmail(emailCerto)
    loginPage.preencherSenha(senhaErrada)
    cy.wait(1000)
    loginPage.submeter()
    cy.get('#login-messages').should('have.text', 'Email ou senha inválidos.')
})

it('Fluxo de login com campos vazios', () => {
loginPage.acessar()
loginPage.submeter()

cy.get('input').first().then(($input) => {
    expect($input[0].validationMessage).to.not.be.empty
    expect($input[0].validity.valid).to.be.false
})
})
})

describe('Testes Frontend Connect+ ADMIN', () => {
it('Teste ADMIN aprovar atendente', function() {
    cy.visit('http://localhost:5000/static/index.html')
    cy.get('a.login-button').click();
    
    cy.get('div.login-container').click();
    cy.get('[name="senha"]').type('Naruto17@');
    cy.get('[name="email"]').type('kauaastete@gmail.com');
    cy.get('#login-submit-button').click();
    
    cy.get('#attendants-list-tbody tr:nth-child(2) button.approve-button').click();
    cy.get('#confirm-action-button').click();
    cy.get('#attendants-list-tbody span.status-ATIVO').should('have.text', 'Ativo');
    
})
})

describe('Testes Frontend Connect+ Agendamento', () => {
it('Teste agendamento buscar atendente inexistente', () => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            if (err.message.includes("Cannot read properties of null (reading 'insertBefore')")) {
            return false;
  }
            return true;

});
        loginPage.acessar()
        loginPage.preencherEmail(emailCerto)
        loginPage.preencherSenha(senhaCerta)
        loginPage.submeter()

        cy.wait(1000)

        cy.get('nav li:nth-child(2) a').click();
        cy.get('#filtro-area').select('JURIDICO');
        cy.get('#filtro-busca-nome').type('Julio');
        cy.get('#botao-aplicar-filtros').click();
        cy.get('#lista-atendentes-container p.no-results-message').should('have.text', 'Nenhum atendente encontrado com os critérios selecionados.');
})

    it('Teste agendamento buscar atendente existente', () => {
        Cypress.on('uncaught:exception', (err, runnable) => {
            if (err.message.includes("Cannot read properties of null (reading 'insertBefore')")) {
            return false;
  }
            return true;

});
        
        loginPage.acessar()
        loginPage.preencherEmail(emailCerto)
        loginPage.preencherSenha(senhaCerta)
        loginPage.submeter()

        cy.wait(1000)

        cy.get('nav li:nth-child(2) a').click();
        cy.get('#filtro-area').select('SAUDE');
        cy.get('#filtro-busca-nome').type('Marcia');
        cy.get('#botao-aplicar-filtros').click();
        cy.get('#lista-atendentes-container div.atendente-card').should('be.visible');

})

it('Teste realizar atendimento', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
            if (err.message.includes("Cannot read properties of null (reading 'insertBefore')")) {
            return false;
  }
            return true;

});
        
        loginPage.acessar()
        loginPage.preencherEmail(emailCerto)
        loginPage.preencherSenha(senhaCerta)
        loginPage.submeter()

        cy.wait(1000)

        cy.get('nav li:nth-child(2) a').click();
        cy.get('#lista-atendentes-container button.agendar-button').click();
        cy.get('#next-month-button i.fas').click();
        cy.get('#calendar-grid div:nth-child(39)').click();
        cy.get('#time-slots-grid div:nth-child(1)').click();
        cy.get('#confirm-agendamento-button').click();
        cy.get('#confirmacao-solicitacao-modal div.modal-content').should('be.visible');

})

it('Teste realizar confirmalção do atendimento', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
            if (err.message.includes("Cannot read properties of null (reading 'insertBefore')")) {
            return false;
      }
            return true;
    
    });
        
        loginPage.acessar()
        cy.get('[name="email"]').type('marciaatendente@atendente.com');
        cy.get('[name="senha"]').type('Naruto17@');
        cy.get('#login-submit-button').click();
        cy.contains('Solicitações').click()
        cy.get('#lista-solicitacoes-container button.confirmar-button').click();
        cy.get('#botao-final-confirmar').click();
        cy.get('#confirmar-modal-close').click();
        cy.get('li:nth-child(2) a').click();
        cy.get('#lista-agenda-confirmados div.agenda-evento-item').should('be.visible');
})

it('Teste realizar cancelamento do atendimento', () => {
    Cypress.on('uncaught:exception', (err, runnable) => {
            if (err.message.includes("Cannot read properties of null (reading 'insertBefore')")) {
            return false;
  }
            return true;

});
        
        loginPage.acessar()
        loginPage.preencherEmail(emailCerto)
        loginPage.preencherSenha(senhaCerta)
        loginPage.submeter()

        cy.wait(1000)

        cy.get('#lista-agendamentos-futuros button.action-button').click();
        cy.reload()
        cy.get('#lista-agendamentos-passados div.agendamento-status').should('have.text', 'Cancelado por Você');

})


})
