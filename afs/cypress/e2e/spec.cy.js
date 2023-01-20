describe('template spec', () => {

  beforeEach(() => {
    cy.visit('http://localhost:8009')
  })
  
  it('authenticates dev user', () => {
    const user = 'dev';
    const pw = 'dev';
    cy.viewport(1050, 700);
    cy.get('#auth-link').should('have.length', 1)
    cy.get('#auth-link').should('have.length', 1)
    cy.contains('Sign in').click();
    cy.get('[name="username"]').type(`${user}{enter}`)
    cy.get('[name="password"]').type(`${pw}{enter}`)
    cy.contains('Log off')
  })
})