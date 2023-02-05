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
    cy.contains('Arches Designer').click();
    cy.get('.btn.btn-primary.dropdown-toggle').click();
    cy.get('.clickme').click();
    cy.get('[data-original-title="Add Child Node"]').click();
    cy.contains('New Node').click();
    
    //open chosen datatype select and select 'string'
    cy.get(':nth-child(4) > .widgets > .row > .form-group > .crm-selector > .chosen-container > .chosen-single > span').click();
    cy.get('.active-result').contains('string').click();

    //save the newly added node
    cy.contains('Save Edits').click();
    
    //click the add child node button of the newly added node
    cy.get('[data-original-title="Add Child Node"]').eq(1).click();
    cy.contains('New Node_1').click();
    
    //open chosen datatype select and select 'number'
    cy.get(':nth-child(4) > .widgets > .row > .form-group > .crm-selector > .chosen-container > .chosen-single > span').click();
    cy.get('.active-result').contains('number').click();

    //save the newly added node and publish the graph
    cy.contains('Save Edits').click();
    cy.contains('Publish Graph').click();
    cy.contains('Publish').click()
  })
  
  // it('log off dev user', () => {
  //   cy.contains('Log off').click();
  //   cy.contains('Sign in').click();
  // })
})