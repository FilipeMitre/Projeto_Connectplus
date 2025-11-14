export class CadastroPage {
    acessar(){

        cy.visit('http://localhost:5000/static/index.html')
        cy.contains('Cadastre-se').click()
    }

    preencherNome(nome){
        cy.get('input[id=nome-completo]').type(nome)
    }

    preencherNomesoc(nomesoc){
        cy.get('input[id=nome-social]').type(nomesoc)
    }

    preencherEmail(email){
        cy.get('input[id=email]').type(email)
    }

    preencherSenha(senha){
        cy.get('input[id=senha]').type(senha)
    }

    preencherConfsenha(senha){
        cy.get('input[id=confirmar-senha]').type(senha)
    }

    preencherCpf(cpf){
        cy.get('input[id=cpf]').type(cpf)
    }

    preencherDataNasc(dataNasc){
        cy.get('input[id=data-nascimento]').type(dataNasc)

    }

    preencherTell(tell){
        cy.get('input[id=telefone-numero]').type(tell)

    }
    
    preencherNum(numero){
        cy.get('input[id=numero-endereco]').type(numero)     
    }
    
    preencherPronome(pronome){
        cy.get('input[id=pronomes]').type(pronome)
    }

    preencherCep(cep){
        cy.get('input[id=cep]').type(cep)
    }


    submeter(){
        cy.contains('CRIAR MINHA CONTA').click()
    }
}