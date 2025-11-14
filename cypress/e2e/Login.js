// O objetivo desse teste é testar a funcionalidade de login no Connect+

// testes que tenham login correto, login incorreto, campos vazios

export class LoginPage {
    acessar(){

        cy.visit('http://localhost:5000/static/index.html')
        cy.contains('Fazer login').click()
    }

    preencherEmail(email){
        cy.get('input[id=email]').type(email)
    }
    preencherSenha(senha){
        cy.get('input[id=senha]').type(senha)
    }

    submeter(){
        cy.get('#login-submit-button').click();
    }
}