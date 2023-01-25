describe('template spec', () => {

  beforeEach(() => {
    cy.visit('http://localhost:8009')
    const user = 'dev';
    const pw = 'dev';
    cy.viewport(1050, 700);
    cy.get('#auth-link').should('have.length', 1)
    cy.get('#auth-link').should('have.length', 1)
    cy.contains('Sign in').click();
    cy.get('[name="username"]').type(`${user}{enter}`)
    cy.get('[name="password"]').type(`${pw}{enter}`)
  })
  
  it('creates a graph', () => {
    cy.contains('Manage').click();
    // cy.url().should('include', 'resource')
    cy.get('.graph-designer-nav').click();
    cy.get('.btn.btn-primary.dropdown-toggle').click();
    cy.get('.new-resource-btn').click();
  })
  
  // it('log off dev user', () => {
  //   cy.contains('Log off').click();
  //   cy.contains('Sign in').click();
  // })
})